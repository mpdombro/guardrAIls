/**
 * Connect Account Prompt Component
 * Displays when user needs to connect an external account (like Google) for Token Vault
 */

import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ExternalLink, Loader2, CheckCircle } from 'lucide-react';

interface ConnectAccountPromptProps {
  provider: string;
  requiredScopes: string[];
  onConnectionSuccess?: () => void;
}

export function ConnectAccountPrompt({ provider, requiredScopes, onConnectionSuccess }: ConnectAccountPromptProps) {
  const { getAccessTokenWithPopup } = useAuth0();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerDisplayNames: Record<string, string> = {
    'google-oauth2': 'Google Calendar',
    'google': 'Google Calendar'
  };

  const displayName = providerDisplayNames[provider] || provider;

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('[ConnectAccount] Requesting additional calendar scopes...');

      // Request additional scopes WITHOUT forcing connection parameter
      // This preserves the current user session while adding Google calendar access
      await getAccessTokenWithPopup({
        authorizationParams: {
          prompt: 'consent',
          scope: `openid profile email ${requiredScopes.join(' ')}`,
          access_type: 'offline'
        },
        cacheMode: 'off' // Don't cache to ensure fresh consent
      });

      console.log('[ConnectAccount] Calendar access authorized successfully');
      console.log('[ConnectAccount] User session preserved');

      setIsConnected(true);
      setIsConnecting(false);

      // Mark Google as connected in localStorage (for demo mode)
      localStorage.setItem('googleConnected', 'true');

      // NO PAGE RELOAD - just show success message

      // Notify parent to show calendar events
      setTimeout(() => {
        if (onConnectionSuccess) {
          onConnectionSuccess();
        }
      }, 1500); // Give time to see success message

    } catch (err: any) {
      console.error('[ConnectAccount] Error:', err);
      setError(err.message || 'Failed to connect account');
      setIsConnecting(false);
    }
  };

  return (
    <Card className={`p-4 mt-3 ${
      isConnected
        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
        : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1">
          {isConnected ? (
            <>
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Connected Successfully!
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Your {displayName} account has been connected. Ask me to show your calendar again!
              </p>
            </>
          ) : (
            <>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Connect {displayName}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                To use calendar features, you need to create a Connected Account for Google Calendar.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                <strong>Token Vault:</strong> Your calendar credentials will be securely stored by Auth0 and retrieved only when needed.
              </p>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-3 p-2 bg-red-50 dark:bg-red-950 rounded">
                  {error}
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to Google...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect {displayName}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                You'll be redirected to Google to authorize calendar access
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
