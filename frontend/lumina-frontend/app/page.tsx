"use client"

import ChatHistory from './components/chat/ChatHistory';
import LuminaFace from './components/lumina_face';
import DocumentBrowser from './components/document/DocumentBrowser';

interface ChatHistoryMessage {
  id: number;
  sender: 'Lumina' | 'User';
  message: string;
}

// Mock data for chat history
const chatHistory: ChatHistoryMessage[] = [
  { id: 1, sender: 'User', message: 'Hello Lumina!' },
  { id: 2, sender: 'Lumina', message: 'Hello! How can I assist you today?' },
  { id: 3, sender: 'User', message: 'Can you explain quantum computing?' },
  { id: 4, sender: 'Lumina', message: 'Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition and entanglement, to perform calculations...' },
]

export default function ModernLuminaDashboard() {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <ChatHistory chatHistory={chatHistory} />
      <div className="flex-grow p-6 overflow-hidden flex flex-col">
        <LuminaFace />
        <DocumentBrowser />
      </div>
    </div>
  )
}