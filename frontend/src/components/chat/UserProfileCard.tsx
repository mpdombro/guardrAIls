import { User, Shield, Mail, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserProfileCardProps {
  user: {
    sub: string
    name?: string
    email?: string
    picture?: string
  }
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Authenticated User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Picture and Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{user.name || 'Unknown User'}</h3>
            <Badge variant="success">Authenticated</Badge>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-3 pt-2 border-t">
          {/* Email */}
          {user.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
          )}

          {/* User ID */}
          <div className="flex items-start gap-3">
            <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">User ID (Auth0 Sub)</p>
              <p className="text-sm font-mono text-xs break-all">{user.sub}</p>
            </div>
          </div>

          {/* Security Context */}
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">Security Context</p>
              <p className="text-sm">
                This identity is used for authorization checks, audit logs, and user-specific
                operations.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
