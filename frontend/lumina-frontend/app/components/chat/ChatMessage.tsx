import { motion } from 'framer-motion';

type Sender = 'Lumina' | 'User';

export interface ChatMessage {
  sender: Sender;
  message: string;
}

const ChatMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`mb-4 p-3 rounded-lg ${
      message.sender === 'Lumina'
        ? 'bg-blue-600 text-white ml-4'
        : 'bg-gray-700 text-gray-100 mr-4'
    }`}
  >
    <strong className="block mb-1">{message.sender}</strong>
    {message.message}
  </motion.div>
)

export default ChatMessage; 