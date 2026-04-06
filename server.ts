import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Telegraf } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mushtumgram-secret';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// In-memory store (for demo, since Firebase declined)
const users = new Map<string, any>(); // userId -> User
const telegramToUser = new Map<number, string>(); // telegramId -> userId
const loginCodes = new Map<string, any>(); // code -> { telegramId, username, photo, timestamp }
const chats = new Map<string, any>(); // chatId -> Chat
const messages: any[] = [];

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  app.use(cors());
  app.use(express.json());

  // --- Telegram Bot ---
  if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
      const startPayload = ctx.payload;
      if (startPayload && startPayload.startsWith('login_')) {
        const code = startPayload.replace('login_', '');
        const { id, username, first_name, last_name } = ctx.from;
        
        loginCodes.set(code, {
          telegramId: id,
          username: username || `${first_name} ${last_name || ''}`.trim(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || id}`,
          timestamp: Date.now(),
        });

        ctx.reply('✅ You are logged into MushtumGRAM! Go back to the website.');
      } else {
        ctx.reply('Welcome to MushtumGRAM! 🐔\n\nUse the website to login.');
      }
    });

    bot.launch().catch(err => console.error('Bot launch failed:', err));
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not provided. Bot features disabled.');
  }

  // --- API Routes ---
  app.get('/api/auth/poll/:code', (req, res) => {
    const { code } = req.params;
    const loginData = loginCodes.get(code);

    if (loginData) {
      // Check if user exists, else create
      let userId = telegramToUser.get(loginData.telegramId);
      if (!userId) {
        userId = uuidv4();
        const newUser = {
          id: userId,
          telegramId: loginData.telegramId,
          username: loginData.username,
          avatar: loginData.avatar,
          lastSeen: Date.now(),
          isOnline: false,
        };
        users.set(userId, newUser);
        telegramToUser.set(loginData.telegramId, userId);
      }

      const user = users.get(userId);
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
      
      loginCodes.delete(code); // Consume code
      res.json({ token, user });
    } else {
      res.status(404).json({ message: 'Code not found or expired' });
    }
  });

  app.get('/api/users', (req, res) => {
    res.json(Array.from(users.values()));
  });

  // --- Socket.io ---
  io.on('connection', (socket) => {
    let currentUserId: string | null = null;

    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        currentUserId = decoded.userId;
        const user = users.get(currentUserId);
        if (user) {
          user.isOnline = true;
          user.lastSeen = Date.now();
          socket.join(`user:${currentUserId}`);
          io.emit('user:status', { userId: currentUserId, isOnline: true });
          
          // Send initial data
          const userChats = Array.from(chats.values()).filter(c => c.participants.includes(currentUserId));
          socket.emit('init', {
            chats: userChats,
            users: Array.from(users.values()),
          });
        }
      } catch (err) {
        socket.disconnect();
      }
    });

    socket.on('chat:create', (data) => {
      if (!currentUserId) return;
      const { participantId } = data;
      
      // Check if chat already exists
      let chat = Array.from(chats.values()).find(c => 
        c.participants.length === 2 && 
        c.participants.includes(currentUserId) && 
        c.participants.includes(participantId)
      );

      if (!chat) {
        chat = {
          id: uuidv4(),
          participants: [currentUserId, participantId],
          lastMessage: null,
        };
        chats.set(chat.id, chat);
      }

      chat.participants.forEach((pId: string) => {
        io.to(`user:${pId}`).emit('chat:update', chat);
      });
    });

    socket.on('message:send', (data) => {
      if (!currentUserId) return;
      const { chatId, text, type } = data;
      const message = {
        id: uuidv4(),
        chatId,
        senderId: currentUserId,
        text,
        type: type || 'text',
        timestamp: Date.now(),
        seen: false,
        isEdited: false,
      };
      messages.push(message);
      
      // Update chat last message
      const chat = chats.get(chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.participants.forEach((pId: string) => {
          io.to(`user:${pId}`).emit('message:receive', message);
          io.to(`user:${pId}`).emit('chat:update', chat);
        });
      }
    });

    socket.on('message:edit', (data) => {
      if (!currentUserId) return;
      const { messageId, text } = data;
      const message = messages.find(m => m.id === messageId && m.senderId === currentUserId);
      if (message) {
        message.text = text;
        message.isEdited = true;
        
        const chat = chats.get(message.chatId);
        if (chat) {
          chat.participants.forEach((pId: string) => {
            io.to(`user:${pId}`).emit('message:update', message);
          });
        }
      }
    });

    socket.on('message:delete', (data) => {
      if (!currentUserId) return;
      const { messageId } = data;
      const index = messages.findIndex(m => m.id === messageId && m.senderId === currentUserId);
      if (index > -1) {
        const message = messages[index];
        messages.splice(index, 1);
        
        const chat = chats.get(message.chatId);
        if (chat) {
          chat.participants.forEach((pId: string) => {
            io.to(`user:${pId}`).emit('message:remove', { messageId, chatId: message.chatId });
          });
        }
      }
    });

    socket.on('typing', (data) => {
      if (!currentUserId) return;
      const { chatId, isTyping } = data;
      const chat = chats.get(chatId);
      if (chat) {
        chat.participants.forEach((pId: string) => {
          if (pId !== currentUserId) {
            io.to(`user:${pId}`).emit('user:typing', { userId: currentUserId, chatId, isTyping });
          }
        });
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId) {
        const user = users.get(currentUserId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = Date.now();
          io.emit('user:status', { userId: currentUserId, isOnline: false, lastSeen: user.lastSeen });
        }
      }
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
