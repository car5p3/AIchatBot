'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MoreVertical, AtSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Mention {
  name: string;
  avatar: string;
}

const AVAILABLE_USERS: Mention[] = [
  { name: 'Alice', avatar: '👩‍🔬' },
  { name: 'Bob', avatar: '🧙' },
  { name: 'Charlie', avatar: '👨‍💻' },
  { name: 'Diana', avatar: '✨' },
  { name: 'Eve', avatar: '🎭' },
];

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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect @mentions in input
  const detectMention = (text: string, position: number) => {
    const lastAtSymbol = text.lastIndexOf('@', position - 1);
    if (lastAtSymbol === -1) return null;

    const beforeAt = lastAtSymbol === 0 || /\s/.test(text[lastAtSymbol - 1]);
    if (!beforeAt) return null;

    const afterAt = text.substring(lastAtSymbol + 1, position);
    if (/\s/.test(afterAt)) return null;

    return afterAt.toLowerCase();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const position = e.target.selectionStart || 0;

    setInputValue(text);
    setCursorPosition(position);

    const query = detectMention(text, position);
    if (query !== null) {
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const filteredUsers = AVAILABLE_USERS.filter((user) =>
    user.name.toLowerCase().startsWith(mentionQuery)
  );

  const insertMention = (userName: string) => {
    const lastAtSymbol = inputValue.lastIndexOf('@', cursorPosition - 1);
    const beforeMention = inputValue.substring(0, lastAtSymbol);
    const afterMention = inputValue.substring(cursorPosition);

    const newInput = `${beforeMention}@${userName} ${afterMention}`;
    setInputValue(newInput);
    setShowMentions(false);
    setMentionQuery('');
    
    // Focus input and move cursor
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = lastAtSymbol + userName.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    }, 0);
  };

  // Render message with mention highlighting and markdown
  const renderMessageWithMentions = (text: string) => {
    // Parse mentions first
    const mentionPattern = /@(\w+)/g;
    const parts: Array<{ text: string; isMention: boolean; userName?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isMention: false,
        });
      }
      parts.push({
        text: match[0],
        isMention: true,
        userName: match[1],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isMention: false,
      });
    }

    return (
      <div className="space-y-2">
        {parts.map((part, idx) => {
          if (part.isMention) {
            const mentionedUser = AVAILABLE_USERS.find(
              (user) => user.name.toLowerCase() === part.userName!.toLowerCase()
            );
            return (
              <span
                key={`mention-${idx}`}
                className="bg-gradient-to-r from-cyan-400/30 to-purple-400/30 text-cyan-300 px-2 py-0.5 rounded font-semibold border border-cyan-400/50 inline-flex items-center gap-1"
              >
                <AtSign size={14} className="inline" />
                {mentionedUser && <span>{mentionedUser.avatar}</span>}
                {part.userName}
              </span>
            );
          } else {
            return (
              <ReactMarkdown
                key={`markdown-${idx}`}
                components={{
                  p: ({ node, ...props }) => (
                    <p {...props} className="mb-2" />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong {...props} className="font-bold text-white" />
                  ),
                  em: ({ node, ...props }) => (
                    <em {...props} className="italic text-white" />
                  ),
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : 'text';
                    
                    return inline ? (
                      <code
                        {...props}
                        className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-600"
                      >
                        {children}
                      </code>
                    ) : (
                      <SyntaxHighlighter
                        {...props}
                        style={atomDark}
                        language={language}
                        PreTag="div"
                        className="rounded-lg my-2 text-sm overflow-x-auto"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  },
                  pre: ({ node, ...props }) => (
                    <pre {...props} className="bg-transparent p-0 overflow-visible" />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      {...props}
                      className="border-l-4 border-cyan-400 pl-4 italic text-slate-300 my-2"
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc list-inside mb-2 space-y-1" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal list-inside mb-2 space-y-1" />
                  ),
                  li: ({ node, ...props }) => (
                    <li {...props} className="text-slate-100" />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-blue-400 hover:text-blue-300 underline"
                    />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1 {...props} className="text-xl font-bold my-2 text-white" />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 {...props} className="text-lg font-bold my-2 text-white" />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 {...props} className="text-base font-bold my-2 text-white" />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr {...props} className="my-2 border-slate-600" />
                  ),
                  table: ({ node, ...props }) => (
                    <table
                      {...props}
                      className="border-collapse border border-slate-600 my-2"
                    />
                  ),
                  thead: ({ node, ...props }) => (
                    <thead {...props} className="bg-slate-700" />
                  ),
                  tbody: ({ node, ...props }) => <tbody {...props} />,
                  tr: ({ node, ...props }) => (
                    <tr {...props} className="border border-slate-600" />
                  ),
                  td: ({ node, ...props }) => (
                    <td {...props} className="border border-slate-600 px-3 py-2" />
                  ),
                  th: ({ node, ...props }) => (
                    <th {...props} className="border border-slate-600 px-3 py-2 text-left" />
                  ),
                }}
              >
                {part.text}
              </ReactMarkdown>
            );
          }
        })}
      </div>
    );
  };

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

      // Check if we should navigate to the project website
      if (data.shouldNavigate && data.navigateUrl) {
        setTimeout(() => {
          window.open(data.navigateUrl, '_blank');
        }, 1000);
      }
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
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-md border-r border-slate-700/50 flex flex-col relative z-10 hover:border-slate-600/50 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50">
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg text-white text-sm hover:from-blue-600/30 hover:to-purple-600/30 cursor-pointer transition-all duration-300 transform hover:translate-x-1 border border-blue-600/30 hover:border-blue-600/50 font-medium">
            Current conversation
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button className="w-full text-left px-4 py-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-all duration-300 text-sm transform hover:translate-x-1 font-medium">
            Settings
          </button>
          <button className="w-full text-left px-4 py-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-all duration-300 text-sm transform hover:translate-x-1 font-medium">
            Help & Feedback
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top Header */}
        <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-purple-900/30 backdrop-blur-xl">
          <div>
            <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Chat Assistant</h1>
            <p className="text-slate-400 text-xs">✨ Always here to help</p>
          </div>
          <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-300 transform hover:rotate-90">
            <MoreVertical size={20} className="text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } animate-message-enter`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className={`max-w-xs lg:max-w-md px-5 py-3 rounded-xl backdrop-blur-sm border ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-600/80 to-blue-500/80 text-white rounded-br-none shadow-lg shadow-blue-600/40 border-blue-500/30'
                    : 'bg-gradient-to-br from-slate-700/80 to-slate-600/80 text-slate-100 rounded-bl-none shadow-lg shadow-slate-700/40 border-slate-600/30'
                }`}
              >
                <div className="text-sm leading-relaxed">{renderMessageWithMentions(message.text)}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-message-enter">
              <div className="bg-gradient-to-br from-slate-700/80 to-slate-600/80 text-slate-100 px-5 py-3 rounded-xl rounded-bl-none border border-slate-600/30 shadow-lg shadow-slate-700/40 backdrop-blur-sm">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-purple-900/30 backdrop-blur-xl p-6">
          <div className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here... (use @ to mention)"
                  className="w-full bg-slate-700/50 hover:bg-slate-700/70 text-white placeholder-slate-400 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-700/80 transition-all duration-300 border border-slate-600/50 focus:border-blue-500/50 backdrop-blur-sm"
                />
                
                {/* Mention Autocomplete Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                  <div
                    ref={mentionsRef}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2"
                  >
                    {filteredUsers.map((user) => (
                      <button
                        key={user.name}
                        onClick={() => insertMention(user.name)}
                        className="w-full px-4 py-3.5 text-left hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 flex items-center gap-3 border-b border-slate-700/50 last:border-0 group transform hover:translate-x-1"
                      >
                        <span className="text-2xl">{user.avatar}</span>
                        <div className="flex-1">
                          <div className="text-white font-semibold">@{user.name}</div>
                          <div className="text-xs text-slate-400">Click to mention</div>
                        </div>
                        <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>
                    ))}
                  </div>
                )}

                {showMentions && mentionQuery && filteredUsers.length === 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-xl p-3 text-center text-slate-400 text-sm z-50">
                    No users found matching "@{mentionQuery}"
                  </div>
                )}
              </div>

              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50 text-white rounded-xl px-6 py-3.5 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 transform hover:scale-105 active:scale-95 font-semibold disabled:transform-none disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2.5 italic">
            Press Enter to send, Shift+Enter for new line. Use @ to mention someone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;