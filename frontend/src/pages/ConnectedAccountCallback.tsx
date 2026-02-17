/**
 * Connected Account Callback Page
 * Handles the OAuth callback after user authorizes a connected account
 */

import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConnectedAccountCallback() {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = () => {
      try {
        // Extract parameters from URL
        const params = new URLSearchParams(window.location.search);
        const connectCode = params.get('connect_code');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('[ConnectedAccountCallback] Processing callback:', {
          hasConnectCode: !!connectCode,
          error: errorParam,
          errorDescription
        });

        if (errorParam) {
          // OAuth error from Auth0/Google
          const errorMsg = errorDescription || errorParam || 'Unknown error occurred';
          console.error('[ConnectedAccountCallback] OAuth error:', errorMsg);

          setError(errorMsg);
          setStatus('error');

          // Send error message to parent window via postMessage
          window.opener?.postMessage(
            {
              type: 'CONNECTED_ACCOUNT_ERROR',
              error: errorMsg
            },
            window.location.origin
          );

          // Close popup after delay
          setTimeout(() => window.close(), 3000);
          return;
        }

        if (!connectCode) {
          console.error('[ConnectedAccountCallback] No connect_code in callback URL');

          const errorMsg = 'Invalid callback: missing connect_code';
          setError(errorMsg);
          setStatus('error');

          window.opener?.postMessage(
            {
              type: 'CONNECTED_ACCOUNT_ERROR',
              error: errorMsg
            },
            window.location.origin
          );

          setTimeout(() => window.close(), 3000);
          return;
        }

        // Success! Send connect_code back to parent window
        console.log('[ConnectedAccountCallback] Successfully received connect_code, sending to parent...');

        setStatus('success');

        window.opener?.postMessage(
          {
            type: 'CONNECTED_ACCOUNT_SUCCESS',
            connectCode
          },
          window.location.origin
        );

        // Close popup after showing success message
        setTimeout(() => window.close(), 1500);

      } catch (err: any) {
        console.error('[ConnectedAccountCallback] Error processing callback:', err);

        const errorMsg = err.message || 'Failed to process callback';
        setError(errorMsg);
        setStatus('error');

        window.opener?.postMessage(
          {
            type: 'CONNECTED_ACCOUNT_ERROR',
            error: errorMsg
          },
          window.location.origin
        );

        setTimeout(() => window.close(), 3000);
      }
    };

    // Process callback after brief delay to ensure DOM is ready
    setTimeout(processCallback, 100);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Connecting Your Account</h2>
            <p className="text-muted-foreground">
              Completing the connection with Google Calendar...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2">Connected Successfully!</h2>
            <p className="text-muted-foreground mb-4">
              Your Google Calendar account has been connected. You can now use calendar features with Token Vault.
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
            <p className="text-muted-foreground mb-4">
              {error || 'An error occurred while connecting your account.'}
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Chat
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
