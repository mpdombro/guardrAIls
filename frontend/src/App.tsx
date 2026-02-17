import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { LogIn, LogOut, User, Loader2, Shield, ShieldOff } from 'lucide-react'
import { Button } from './components/ui/button'
import ChatInterface from './components/chat/ChatInterface'

function App() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()
  const [securityEnabled, setSecurityEnabled] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">GuardrAIls</h1>
              <p className="text-sm text-muted-foreground">Treasury Management AI Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Security Toggle */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background">
                {securityEnabled ? (
                  <Shield className="h-4 w-4 text-primary" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Security</span>
                <button
                  onClick={() => setSecurityEnabled(!securityEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securityEnabled ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securityEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${
                    securityEnabled ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {securityEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            )}

            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    logout({ logoutParams: { returnTo: window.location.origin } })
                  }
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => loginWithRedirect()} size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <ChatInterface
          securityEnabled={securityEnabled}
          isAuthenticated={isAuthenticated}
        />
      </main>
    </div>
  )
}

export default App
