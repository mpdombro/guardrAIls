import { LogIn, Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LoginPromptProps {
  message: string
  onLogin: () => void
}

export default function LoginPrompt({ message, onLogin }: LoginPromptProps) {
  return (
    <Card className="max-w-md border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Lock className="h-5 w-5" />
          Authentication Required
        </CardTitle>
        <CardDescription className="text-orange-800">
          This operation requires you to be logged in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-orange-200">
          <Shield className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700">{message}</p>
        </div>

        <Button onClick={onLogin} className="w-full" size="lg">
          <LogIn className="h-5 w-5 mr-2" />
          Login with Auth0
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You'll be redirected to Auth0 to securely authenticate
        </p>
      </CardContent>
    </Card>
  )
}
