# Floating Chat Bar Usage Examples

## Basic Usage

```tsx
import { FloatingChatBar } from '@/components/chat'

export default function YourPage() {
  const handleSendMessage = (message: string) => {
    console.log('User message:', message)
    // Handle your chat logic here
  }

  return (
    <div>
      {/* Your page content */}
      <main>
        {/* Dashboard content, skills, learning content, etc. */}
      </main>

      {/* Floating chat bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask me anything about your learning..."
      />
    </div>
  )
}
```

## Advanced Usage with State Management

```tsx
"use client"
import { useState } from 'react'
import { FloatingChatBar } from '@/components/chat'

export default function DashboardWithChat() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (message: string) => {
    setIsLoading(true)
    
    try {
      // Your API call to handle the message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      const result = await response.json()
      console.log('AI Response:', result)
      
      // Handle the response in your app
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Your dashboard content */}
      <main className="pb-32"> {/* Add padding to account for floating chat */}
        {/* Dashboard widgets, charts, etc. */}
      </main>

      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask our AI about your progress..."
        enableVoice={true}
        enableMinimize={true}
        isMinimized={isMinimized}
        onMinimizeToggle={() => setIsMinimized(!isMinimized)}
        disabled={isLoading}
      />
    </div>
  )
}
```

## Integration with Pages

### Dashboard Page
```tsx
// app/dashboard/page.tsx
import { FloatingChatBar } from '@/components/chat'

export default function Dashboard() {
  return (
    <div>
      {/* Dashboard components */}
      <FloatingChatBar 
        placeholder="Ask about your learning progress..."
        onSendMessage={(msg) => {/* Handle dashboard-specific queries */}}
      />
    </div>
  )
}
```

### Skills Page
```tsx
// app/skills/page.tsx
import { FloatingChatBar } from '@/components/chat'

export default function Skills() {
  return (
    <div>
      {/* Skills components */}
      <FloatingChatBar 
        placeholder="Ask about skills development..."
        onSendMessage={(msg) => {/* Handle skills-specific queries */}}
      />
    </div>
  )
}
```

### Learning Page
```tsx
// app/learning/page.tsx
import { FloatingChatBar } from '@/components/chat'

export default function Learning() {
  return (
    <div>
      {/* Learning components */}
      <FloatingChatBar 
        placeholder="Need help with your learning path?"
        onSendMessage={(msg) => {/* Handle learning-specific queries */}}
      />
    </div>
  )
}
```

### Certificate Page
```tsx
// app/certificates/page.tsx
import { FloatingChatBar } from '@/components/chat'

export default function Certificates() {
  return (
    <div>
      {/* Certificate components */}
      <FloatingChatBar 
        placeholder="Ask about certification requirements..."
        onSendMessage={(msg) => {/* Handle certificate-specific queries */}}
      />
    </div>
  )
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSendMessage` | `(message: string) => void` | - | Callback when user sends a message |
| `placeholder` | `string` | `"Ask our AI assistant anything..."` | Input placeholder text |
| `className` | `string` | - | Additional CSS classes |
| `enableVoice` | `boolean` | `true` | Show voice input button |
| `enableMinimize` | `boolean` | `true` | Show minimize/maximize button |
| `isMinimized` | `boolean` | `false` | Current minimized state |
| `onMinimizeToggle` | `() => void` | - | Callback for minimize toggle |
| `disabled` | `boolean` | `false` | Disable all interactions |

## Styling Notes

- The component uses your existing revolutionary theme colors
- It has a glass morphism effect with backdrop blur
- Responsive design that works on mobile and desktop
- Smooth animations for state changes
- The component is positioned `fixed` at the bottom of the screen
- On desktop, it's centered with a max width
- On mobile, it spans the full width with padding

## Tips

1. Add `pb-32` or similar bottom padding to your page content to prevent the floating chat bar from covering important content
2. The component automatically handles focus states and keyboard navigation
3. Voice input button is included but requires implementation of actual voice recognition
4. The component includes typing indicators and message length validation
5. All animations are optimized for performance using Framer Motion
