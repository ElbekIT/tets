import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { User, Chat, Message, TypingStatus } from './types';
import { connectSocket, disconnectSocket, getSocket } from './services/socket';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');

  const handleLogin = (newToken: string, user: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    disconnectSocket();
  };

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    if (!token) return;

    connectSocket(token);
    const socket = getSocket();

    socket.on('init', (data: { chats: Chat[]; users: User[] }) => {
      setChats(data.chats);
      setUsers(data.users);
    });

    socket.on('user:status', (data: { userId: string; isOnline: boolean; lastSeen?: number }) => {
      setUsers(prev => prev.map(u => u.id === data.userId ? { ...u, isOnline: data.isOnline, lastSeen: data.lastSeen || u.lastSeen } : u));
    });

    socket.on('chat:update', (chat: Chat) => {
      setChats(prev => {
        const index = prev.findIndex(c => c.id === chat.id);
        if (index > -1) {
          const newChats = [...prev];
          newChats[index] = chat;
          return newChats.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
        }
        return [chat, ...prev].sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
      });
    });

    socket.on('message:receive', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [message.chatId]: [...(prev[message.chatId] || []), message],
      }));
    });

    socket.on('message:update', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [message.chatId]: (prev[message.chatId] || []).map(m => m.id === message.id ? message : m),
      }));
    });

    socket.on('message:remove', (data: { messageId: string; chatId: string }) => {
      setMessages(prev => ({
        ...prev,
        [data.chatId]: (prev[data.chatId] || []).filter(m => m.id !== data.messageId),
      }));
    });

    socket.on('user:typing', (data: TypingStatus) => {
      setTypingUsers(prev => {
        const current = prev[data.chatId] || [];
        if (data.isTyping) {
          if (!current.includes(data.userId)) {
            return { ...prev, [data.chatId]: [...current, data.userId] };
          }
        } else {
          return { ...prev, [data.chatId]: current.filter(id => id !== data.userId) };
        }
        return prev;
      });
    });

    return () => {
      socket.off('init');
      socket.off('user:status');
      socket.off('chat:update');
      socket.off('message:receive');
      socket.off('user:typing');
    };
  }, [token]);

  const handleSendMessage = (text: string) => {
    if (!activeChatId) return;
    const socket = getSocket();
    socket.emit('message:send', { chatId: activeChatId, text });
  };

  const handleEditMessage = (messageId: string, text: string) => {
    const socket = getSocket();
    socket.emit('message:edit', { messageId, text });
  };

  const handleDeleteMessage = (messageId: string) => {
    const socket = getSocket();
    socket.emit('message:delete', { messageId });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeChatId) return;
    const socket = getSocket();
    socket.emit('typing', { chatId: activeChatId, isTyping });
  };

  const handleNewChat = (participantId: string) => {
    const socket = getSocket();
    socket.emit('chat:create', { participantId });
  };

  if (!token || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`h-screen w-screen flex overflow-hidden font-sans ${isDarkMode ? 'dark bg-[#0f172a]' : 'bg-white'}`}>
      <Sidebar 
        currentUser={currentUser}
        chats={chats}
        users={users}
        activeChatId={activeChatId}
        onChatSelect={setActiveChatId}
        onNewChat={(id) => {
          handleNewChat(id);
          // We'll wait for chat:update to set activeChatId if needed, 
          // but for UX we can try to find it or wait.
        }}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      <main className="flex-1 h-full relative">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div 
              key={activeChat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ChatWindow 
                currentUser={currentUser}
                chat={activeChat}
                users={users}
                messages={messages[activeChat.id] || []}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onTyping={handleTyping}
                typingUsers={typingUsers[activeChat.id] || []}
                onBack={() => setActiveChatId(null)}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`h-full flex flex-col items-center justify-center p-8 text-center ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}
            >
              <div className="w-32 h-32 bg-orange-500/10 rounded-full flex items-center justify-center text-6xl mb-6 animate-bounce">
                🐔
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome to MushtumGRAM
              </h2>
              <p className={`max-w-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                Select a chat to start messaging or find your friends in the contacts tab.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
      `}} />
    </div>
  );
}
