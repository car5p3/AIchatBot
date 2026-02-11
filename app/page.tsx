'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MoreVertical } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! How can I help you today?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 60000),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const currentMessages = [...messages, newMessage];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors">
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="p-3 bg-slate-800 rounded-lg text-white text-sm hover:bg-slate-700 cursor-pointer transition-colors">
            Current conversation
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button className="w-full text-left px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-sm">
            Settings
          </button>
          <button className="w-full text-left px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-sm">
            Help & Feedback
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between bg-slate-800/50 backdrop-blur">
          <div>
            <h1 className="text-white font-semibold text-lg">Chat Assistant</h1>
            <p className="text-slate-400 text-xs">Always here to help</p>
          </div>
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } message-enter`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start message-enter">
              <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 bg-slate-800/50 backdrop-blur p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg px-4 py-3 transition-colors flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;