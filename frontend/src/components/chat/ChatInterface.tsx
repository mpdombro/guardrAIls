import { useState, useRef, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MessageBubble from './MessageBubble'
import { chatService } from '@/services/api'
import type { Message } from '@/types'

interface ChatInterfaceProps {
  securityEnabled: boolean
  isAuthenticated: boolean
}

export default function ChatInterface({ securityEnabled, isAuthenticated }: ChatInterfaceProps) {
  const { getAccessTokenSilently, user } = useAuth0()

  const getWelcomeMessage = () => {
    if (isAuthenticated) {
      return 'Hello! I\'m your Treasury Management AI Assistant. I can help you view payroll data, execute transfers, and get exchange rates. Try asking me "Who am I?" to see your user context, or "Show me the 2024 payroll".'
    }
    return 'Hello! I\'m your Treasury Management AI Assistant. You\'re currently chatting without authentication. Log in to access secure treasury operations and user-specific features. Try asking me "Who am I?" to see the difference!'
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatService.sendMessage(
        {
          message: input,
          securityEnabled,
          conversationHistory: messages,
        },
        isAuthenticated ? getAccessTokenSilently : undefined
      )

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        specialType: response.specialType,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Chat error:', error)
      let errorContent = 'Sorry, I encountered an error processing your request. Please try again.'

      // Handle authentication errors specifically
      if (error.message === 'Authentication required' || error.response?.status === 401) {
        errorContent = 'Your session has expired. Please refresh the page and log in again.'
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-t-lg">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} currentUser={user} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 p-4 border-t bg-background rounded-b-lg">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about treasury operations..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
