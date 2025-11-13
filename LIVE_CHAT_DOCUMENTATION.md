# Live Chat Support System - Documentation

## Overview

AmeriLend now has a comprehensive **Live Chat Support System** that allows users to communicate directly with human support agents in real-time. This system works alongside the existing AI chat assistant, giving users a choice between automated AI help or human agent support.

## Features

### For Users

1. **Dual Chat Options**
   - **AI Assistant**: Instant 24/7 automated support with access to user account data
   - **Live Human Agent**: Real-time conversation with a support team member

2. **Guest Support**
   - Non-logged-in users can request live agent support
   - Required to provide name and email before starting chat
   - Session-based tracking for guest conversations

3. **Real-Time Messaging**
   - Messages are delivered instantly
   - Auto-polling every 3 seconds for new messages
   - Visual indicators for agent connection status
   - System messages for important updates

4. **User Experience**
   - Clean, professional chat interface
   - Color-coded messages (user, agent, system)
   - Timestamp for each message
   - Loading indicators
   - Smooth animations and transitions

### For Support Agents (Admin)

1. **Conversation Management**
   - View all live chat conversations
   - Filter by status (waiting, active, resolved, closed)
   - Assign conversations to specific agents
   - Mark conversations as resolved

2. **Rich Messaging**
   - Send text messages to users
   - View full conversation history
   - See user information (name, email, account details)
   - Track conversation timeline

3. **Queue Management**
   - See waiting conversations
   - Priority levels (low, normal, high, urgent)
   - Category classification
   - User ratings and feedback

## Database Schema

### liveChatConversations Table

Stores all chat conversations between users and agents.

```typescript
{
  id: number (Primary Key)
  userId: number | null (Linked to users table, null for guests)
  guestName: string | null (Name of guest user)
  guestEmail: string | null (Email of guest user)
  assignedAgentId: number | null (Admin user assigned to conversation)
  status: 'waiting' | 'active' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  subject: string | null
  category: 'loan_inquiry' | 'application_status' | 'payment_issue' | 
            'technical_support' | 'general' | 'other'
  userRating: number | null (1-5 stars)
  userFeedback: string | null
  sessionId: string (Unique session identifier)
  createdAt: timestamp
  updatedAt: timestamp
  assignedAt: timestamp | null
  resolvedAt: timestamp | null
  closedAt: timestamp | null
}
```

### liveChatMessages Table

Stores individual messages within conversations.

```typescript
{
  id: number (Primary Key)
  conversationId: number (Foreign key to liveChatConversations)
  senderId: number | null (User or Agent ID)
  senderType: 'user' | 'agent' | 'system'
  senderName: string
  messageType: 'text' | 'system' | 'file'
  content: string
  fileUrl: string | null (For future file attachments)
  fileName: string | null
  fileSize: number | null
  read: number (0 = unread, 1 = read)
  readAt: timestamp | null
  createdAt: timestamp
}
```

## API Endpoints (tRPC)

### User Endpoints

#### 1. Start Conversation
```typescript
liveChat.startConversation
Input: {
  category?: 'loan_inquiry' | 'application_status' | 'payment_issue' | 
           'technical_support' | 'general' | 'other'
  subject?: string
  guestName?: string (required for non-authenticated users)
  guestEmail?: string (required for non-authenticated users)
}
Returns: { conversationId: number, sessionId: string }
```

#### 2. Get Conversation
```typescript
liveChat.getConversation
Input: {
  conversationId?: number
  sessionId?: string
}
Returns: LiveChatConversation
```

#### 3. Send Message
```typescript
liveChat.sendMessage
Input: {
  conversationId: number
  content: string (max 2000 characters)
}
Returns: LiveChatMessage
```

#### 4. Get Messages
```typescript
liveChat.getMessages
Input: {
  conversationId: number
}
Returns: LiveChatMessage[]
```

#### 5. Close Conversation
```typescript
liveChat.closeConversation
Input: {
  conversationId: number
  rating?: number (1-5)
  feedback?: string
}
Returns: { success: true }
```

### Admin Endpoints

#### 1. Get All Conversations
```typescript
liveChat.getAllConversations
Returns: LiveChatConversation[]
```

#### 2. Assign to Agent
```typescript
liveChat.assignToAgent
Input: {
  conversationId: number
}
Returns: { success: true }
```

#### 3. Send Agent Message
```typescript
liveChat.sendAgentMessage
Input: {
  conversationId: number
  content: string (max 2000 characters)
}
Returns: LiveChatMessage
```

#### 4. Resolve Conversation
```typescript
liveChat.resolveConversation
Input: {
  conversationId: number
}
Returns: { success: true }
```

## Component Usage

### Frontend Component

Use the `LiveChatSupport` component anywhere in your application:

```tsx
import LiveChatSupport from "@/components/LiveChatSupport";

function App() {
  return (
    <div>
      <LiveChatSupport />
    </div>
  );
}
```

The component is a floating chat widget that appears in the bottom-right corner of the screen.

### Component Features

1. **Selection Screen**
   - Choose between AI Assistant or Live Agent
   - Display phone number for direct calling
   - Clean, professional UI

2. **Guest Form** (for non-authenticated users)
   - Collects name and email
   - Validation for required fields
   - Back button to return to selection

3. **Chat Interface**
   - Real-time message display
   - Auto-scrolling to latest message
   - Connection status indicator
   - Different styling for user/agent/system messages

## Implementation Steps

### 1. Run Database Migration

```bash
# Apply the migration to create the new tables
npm run db:push
```

### 2. Update Frontend

Replace the existing `ChatSupport` component with `LiveChatSupport`:

```tsx
// In your main App.tsx or layout file
import LiveChatSupport from "@/components/LiveChatSupport";

// Replace:
// <ChatSupport />

// With:
<LiveChatSupport />
```

### 3. Admin Interface (To Be Implemented)

Create an admin dashboard page to manage live chats:

```tsx
// AdminLiveChat.tsx
- Display all conversations
- Filter by status
- Assign to agents
- Real-time message interface
- Resolve/close conversations
```

## Workflow

### User Journey

1. **User clicks chat widget** → Selection screen appears
2. **User selects "Talk to Human Agent"**
3. If not logged in → **Guest form** appears
4. User fills name and email → **Chat starts**
5. System message: "Waiting for agent..."
6. **Agent assigns conversation** → System message: "Agent has joined"
7. **Real-time conversation** between user and agent
8. **Agent resolves issue** → Conversation marked as resolved
9. **User rates experience** (optional) and closes chat

### Agent Journey

1. **Admin logs in** → Views live chat dashboard
2. **Sees waiting conversations** in queue
3. **Clicks "Assign to me"** → Conversation becomes active
4. **Views user information** and conversation history
5. **Sends messages** to help user
6. **Resolves conversation** when complete
7. **Views user rating** and feedback (if provided)

## Future Enhancements

1. **Real-time WebSocket connection** instead of polling
2. **File attachments** in chat (images, PDFs)
3. **Typing indicators** (show when agent is typing)
4. **Chat transfer** between agents
5. **Canned responses** for common questions
6. **Chat analytics** (response times, satisfaction scores)
7. **Email notifications** when agent responds
8. **Chat transcripts** sent to user email
9. **Mobile app support** with push notifications
10. **Multi-language support** with auto-translation

## Security Considerations

1. **Authentication**
   - User conversations are protected by authentication
   - Guests use session-based tracking
   - Agents must be admin role

2. **Data Privacy**
   - Messages are stored securely in database
   - No sensitive information should be shared in chat
   - HTTPS encryption for all communications

3. **Rate Limiting**
   - Prevent spam by limiting message frequency
   - Session expiration for inactive chats

## Support Contact

For issues or questions about the live chat system:
- Phone: 1-800-555-0100
- Email: support@amerilendloan.com

## Technical Stack

- **Frontend**: React, TailwindCSS, shadcn/ui
- **Backend**: tRPC, Node.js
- **Database**: MySQL (via Drizzle ORM)
- **Real-time**: Polling (can be upgraded to WebSockets)
- **Authentication**: Session-based with user context
