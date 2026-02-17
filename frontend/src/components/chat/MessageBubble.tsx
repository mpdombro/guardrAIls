import { User, Bot } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { Badge } from '@/components/ui/badge'
import UserProfileCard from './UserProfileCard'
import LoginPrompt from './LoginPrompt'
import { ConnectAccountPrompt } from './ConnectAccountPrompt'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  currentUser?: any
  onConnectionSuccess?: () => void
}

export default function MessageBubble({ message, currentUser, onConnectionSuccess }: MessageBubbleProps) {
  const { loginWithRedirect } = useAuth0()
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* Render special message types */}
        {message.specialType === 'user-profile' && currentUser ? (
          <UserProfileCard user={currentUser} />
        ) : message.specialType === 'login-required' ? (
          <LoginPrompt
            message={message.content}
            onLogin={() => loginWithRedirect()}
          />
        ) : message.specialType === 'connect-account-required' && message.connectionFlow ? (
          <>
            <div className="rounded-lg px-4 py-2 bg-muted text-foreground">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            <ConnectAccountPrompt
              provider={message.connectionFlow.provider}
              requiredScopes={message.connectionFlow.requiredScopes}
              onConnectionSuccess={onConnectionSuccess}
            />
          </>
        ) : (
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        {message.securityBadge && (
          <Badge
            variant={
              message.securityBadge.status === 'passed'
                ? 'success'
                : message.securityBadge.status === 'denied'
                ? 'destructive'
                : 'secondary'
            }
          >
            {message.securityBadge.type.toUpperCase()}: {message.securityBadge.status}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}
