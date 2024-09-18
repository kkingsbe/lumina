import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

const ChatInput: React.FC = () => (
    <div className="mt-4 flex items-center bg-gray-700 rounded-full p-2">
      <Input placeholder="Type your message..." className="flex-grow mr-2 bg-transparent border-none text-white placeholder-gray-400" />
      <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700">
        <Send className="h-4 w-4" />
      </Button>
    </div>
)  

export default ChatInput;