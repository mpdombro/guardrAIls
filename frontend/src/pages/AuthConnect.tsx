/**
 * Auth Connect Page
 * Handles the Connected Account connection flow in a popup window
 */

import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2, XCircle } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function AuthConnect() {
  const { getAccessTokenSilently } = useAuth0();
  const [status, setStatus] = useState<'connecting' | 'success' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleConnect = async () => {
      try {
        // Get params from URL
        const params = new URLSearchParams(window.location.search);
        const connection = params.get('connection');
        const returnTo = params.get('returnTo') || '/close';
        const scopes = params.getAll('scopes');

        if (!connection) {
          throw new Error('Missing connection parameter');
        }

        console.log('[AuthConnect] Initiating Connected Account flow:', {
          connection,
          scopes,
          returnTo
        });

        // Get access token
        const accessToken = await getAccessTokenSilently();

        // Call backend to initiate connection flow
        const response = await fetch('http://localhost:3001/api/connected-accounts/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            provider: connection,
            scopes: scopes.join(' '),
            redirectUri: `${window.location.origin}${returnTo}`
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to initiate connection');
        }

        const data = await response.json();

        console.log('[AuthConnect] Got connect_uri, storing session and redirecting...');

        // Store session info
        sessionStorage.setItem('auth_session', data.authSession);
        sessionStorage.setItem('redirect_uri', `${window.location.origin}${returnTo}`);
        sessionStorage.setItem('state', data.state);

        // Redirect to Google authorization
        window.location.href = data.connectUri;

      } catch (err: any) {
        console.error('[AuthConnect] Error:', err);
        setError(err.message || 'Failed to connect account');
        setStatus('error');
      }
    };

    handleConnect();
  }, [getAccessTokenSilently]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        {status === 'connecting' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Connecting Account</h2>
            <p className="text-muted-foreground">
              Preparing to connect your Google Calendar...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Close Window
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
