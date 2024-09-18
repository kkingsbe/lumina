import { ScrollArea } from "@/components/ui/scroll-area"
import ChatMessage, { ChatMessage as ChatMessageType } from './ChatMessage'
import ChatInput from './ChatInput'

interface ChatHistoryMessage {
    id: number;
    sender: 'Lumina' | 'User';
    message: string;
}

const ChatHistory: React.FC<{ chatHistory: ChatHistoryMessage[] }> = ({ chatHistory }) => (
    <div className="w-1/3 bg-gray-800 p-6 overflow-hidden flex flex-col border-r border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-blue-400">Chat with Lumina</h2>
      <ScrollArea className="flex-grow pr-4">
        {chatHistory.map((message) => (
          <ChatMessage key={message.id} message={message as ChatMessageType} />
        ))}
      </ScrollArea>
      <ChatInput />
    </div>
)

export default ChatHistory;