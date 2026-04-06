import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Settings, MoreVertical, Plus, UserPlus, LogOut, Sun, Moon } from 'lucide-react';
import { User, Chat } from '../types';

interface SidebarProps {
  currentUser: User;
  chats: Chat[];
  users: User[];
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: (participantId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  chats,
  users,
  activeChatId,
  onChatSelect,
  onNewChat,
  onLogout,
  isDarkMode,
  toggleDarkMode,
}) => {
  const [search, setSearch] = useState('');
  const [showUsers, setShowUsers] = useState(false);

  const filteredChats = chats.filter(chat => {
    const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherParticipantId);
    return otherUser?.username.toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id && 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`w-80 h-full flex flex-col border-r ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'} transition-colors duration-300`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
            🐔
          </div>
          <h1 className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            MushtumGRAM
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={onLogout}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className={`relative flex items-center rounded-2xl px-4 py-2.5 transition-all ${isDarkMode ? 'bg-white/5 focus-within:bg-white/10' : 'bg-gray-100 focus-within:bg-gray-200'}`}>
          <Search className={`w-4 h-4 mr-3 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`} />
          <input 
            type="text" 
            placeholder="Search messages or users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-none outline-none text-sm w-full ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-gray-400'}`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 mb-4">
        <button 
          onClick={() => setShowUsers(false)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!showUsers ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')}`}
        >
          CHATS
        </button>
        <button 
          onClick={() => setShowUsers(true)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${showUsers ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')}`}
        >
          CONTACTS
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {showUsers ? (
            filteredUsers.map(user => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => onNewChat(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
              >
                <div className="relative">
                  <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-2xl bg-white/5" referrerPolicy="no-referrer" />
                  {user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e293b] rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                <UserPlus className={`w-4 h-4 ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`} />
              </motion.button>
            ))
          ) : (
            filteredChats.map(chat => {
              const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
              const otherUser = users.find(u => u.id === otherParticipantId);
              if (!otherUser) return null;

              return (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeChatId === chat.id ? (isDarkMode ? 'bg-white/10' : 'bg-gray-100') : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50')}`}
                >
                  <div className="relative">
                    <img src={otherUser.avatar} alt={otherUser.username} className="w-12 h-12 rounded-2xl bg-white/5" referrerPolicy="no-referrer" />
                    {otherUser.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e293b] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{otherUser.username}</h3>
                      {chat.lastMessage && (
                        <span className={`text-[10px] ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                          {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                      {chat.lastMessage ? chat.lastMessage.text : 'No messages yet'}
                    </p>
                  </div>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* User Profile */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-white/5 bg-white/2' : 'border-gray-100 bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt={currentUser.username} className="w-10 h-10 rounded-xl bg-white/5" referrerPolicy="no-referrer" />
          <div className="flex-1 overflow-hidden">
            <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentUser.username}</h3>
            <p className={`text-[10px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>MY PROFILE</p>
          </div>
          <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-200 text-gray-400'}`}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
