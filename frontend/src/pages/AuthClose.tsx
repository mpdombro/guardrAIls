/**
 * Auth Close Page
 * Handles the callback after Google authorization and completes the Connected Account flow
 */

import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function AuthClose() {
  const { getAccessTokenSilently } = useAuth0();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeConnection = async () => {
      try {
        // Get connect_code from URL
        const params = new URLSearchParams(window.location.search);
        const connectCode = params.get('connect_code');

        if (!connectCode) {
          throw new Error('Missing connect_code parameter');
        }

        // Get session info
        const authSession = sessionStorage.getItem('auth_session');
        const redirectUri = sessionStorage.getItem('redirect_uri');

        if (!authSession || !redirectUri) {
          throw new Error('Connection session expired');
        }

        console.log('[AuthClose] Completing Connected Account...');

        // Get access token
        const accessToken = await getAccessTokenSilently();

        // Call backend to complete connection
        const response = await fetch('http://localhost:3001/api/connected-accounts/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            connectCode,
            authSession,
            redirectUri
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to complete connection');
        }

        console.log('[AuthClose] Connected Account created successfully!');

        // Clear session storage
        sessionStorage.removeItem('auth_session');
        sessionStorage.removeItem('redirect_uri');
        sessionStorage.removeItem('state');

        setStatus('success');

        // Close popup after 1.5 seconds
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (err: any) {
        console.error('[AuthClose] Error:', err);
        setError(err.message || 'Failed to complete connection');
        setStatus('error');
      }
    };

    completeConnection();
  }, [getAccessTokenSilently]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Finalizing Connection</h2>
            <p className="text-muted-foreground">
              Completing your Google Calendar connection...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2">Connected!</h2>
            <p className="text-muted-foreground mb-4">
              Your Google Calendar has been connected successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              This window will close automatically...
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
