import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, Smile, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, Ghost } from 'lucide-react';
import { User, Chat, Message } from '../types';

interface ChatWindowProps {
  currentUser: User;
  chat: Chat;
  users: User[];
  messages: Message[];
  onSendMessage: (text: string) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  onBack: () => void;
  isDarkMode: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  chat,
  users,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTyping,
  typingUsers,
  onBack,
  isDarkMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
  const otherUser = users.find(u => u.id === otherParticipantId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      if (editingMessageId) {
        onEditMessage(editingMessageId, inputText.trim());
        setEditingMessageId(null);
      } else {
        onSendMessage(inputText.trim());
      }
      setInputText('');
      onTyping(false);
    }
  };

  const handleEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setInputText(msg.text);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setInputText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  if (!otherUser) return null;

  return (
    <div className={`flex-1 flex flex-col h-full relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'} transition-colors duration-300`}>
      {/* Background Pattern */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDarkMode ? 'invert' : ''}`} 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
      />

      {/* Header */}
      <div className={`p-4 flex items-center justify-between border-b z-10 backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white/80 border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`md:hidden p-2 rounded-xl ${isDarkMode ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-100 text-gray-400'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <img src={otherUser.avatar} alt={otherUser.username} className="w-10 h-10 rounded-xl bg-white/5" referrerPolicy="no-referrer" />
            {otherUser.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full" />
            )}
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{otherUser.username}</h3>
            <p className={`text-[10px] uppercase tracking-wider font-bold ${otherUser.isOnline ? 'text-green-500' : (isDarkMode ? 'text-white/20' : 'text-gray-400')}`}>
              {otherUser.isOnline ? 'Online' : `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-100 text-gray-400'}`}>
            <Phone className="w-5 h-5" />
          </button>
          <button className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-100 text-gray-400'}`}>
            <Video className="w-5 h-5" />
          </button>
          <button className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-100 text-gray-400'}`}>
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar z-10">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {!isMe && showAvatar && (
                  <img src={otherUser.avatar} alt={otherUser.username} className="w-6 h-6 rounded-lg bg-white/5 mb-1" referrerPolicy="no-referrer" />
                )}
                {!isMe && !showAvatar && <div className="w-6" />}
                
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl relative shadow-sm group ${
                  isMe 
                    ? (isDarkMode ? 'bg-orange-600 text-white rounded-br-none' : 'bg-orange-500 text-white rounded-br-none') 
                    : (isDarkMode ? 'bg-white/10 text-white rounded-bl-none' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none')
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/60' : 'text-white/20'}`}>
                    {msg.isEdited && <span className="text-[8px] italic mr-1">edited</span>}
                    <span className="text-[9px] font-medium">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (msg.seen ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                  </div>

                  {isMe && (
                    <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                      <button 
                        onClick={() => handleEdit(msg)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/40' : 'bg-gray-100 hover:bg-gray-200 text-gray-400'}`}
                      >
                        EDIT
                      </button>
                      <button 
                        onClick={() => onDeleteMessage(msg.id)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold ${isDarkMode ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                      >
                        DEL
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {typingUsers.includes(otherUser.id) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-center gap-2"
          >
            <img src={otherUser.avatar} alt={otherUser.username} className="w-6 h-6 rounded-lg bg-white/5" referrerPolicy="no-referrer" />
            <div className={`px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 ${isDarkMode ? 'bg-white/5' : 'bg-white border border-gray-100'}`}>
              <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 z-10 ${isDarkMode ? 'bg-[#0f172a]/80' : 'bg-white/80'} backdrop-blur-md`}>
        {editingMessageId && (
          <div className={`max-w-4xl mx-auto mb-2 px-4 py-2 rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-1 h-8 bg-orange-500 rounded-full" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Editing Message</p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                  {messages.find(m => m.id === editingMessageId)?.text}
                </p>
              </div>
            </div>
            <button onClick={cancelEdit} className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-200 text-gray-400'}`}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className={`flex-1 flex items-center rounded-2xl px-4 py-2.5 transition-all ${isDarkMode ? 'bg-white/5 focus-within:bg-white/10' : 'bg-gray-100 focus-within:bg-gray-200'}`}>
            <button type="button" className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/20 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-900'}`}>
              <Smile className="w-6 h-6" />
            </button>
            <input 
              type="text" 
              placeholder="Write a message..." 
              value={inputText}
              onChange={handleInputChange}
              className={`bg-transparent border-none outline-none text-sm w-full px-3 ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-gray-400'}`}
            />
            <button type="button" className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/20 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-900'}`}>
              <ImageIcon className="w-6 h-6" />
            </button>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!inputText.trim()}
            className={`p-3 rounded-2xl transition-all shadow-lg ${inputText.trim() ? 'bg-orange-500 text-white shadow-orange-500/20' : (isDarkMode ? 'bg-white/5 text-white/20' : 'bg-gray-100 text-gray-400')}`}
          >
            <Send className="w-6 h-6" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
