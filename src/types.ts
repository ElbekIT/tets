export interface User {
  id: string;
  telegramId: number;
  username: string;
  avatar?: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image';
  timestamp: number;
  seen: boolean;
  isEdited?: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
}

export interface TypingStatus {
  userId: string;
  chatId: string;
  isTyping: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
