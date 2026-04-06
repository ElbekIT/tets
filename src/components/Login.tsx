import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'motion/react';
import { MessageCircle, ShieldCheck, Zap, Ghost } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [code, setCode] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newCode = uuidv4().slice(0, 8);
    setCode(newCode);
  }, []);

  useEffect(() => {
    if (!code || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/poll/${code}`);
        if (response.ok) {
          const data = await response.json();
          onLogin(data.token, data.user);
          setIsPolling(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [code, isPolling, onLogin]);

  const handleLoginClick = () => {
    const botUsername = process.env.BOT_USERNAME || 'MushtumGRAMBot';
    const url = `https://t.me/${botUsername}?start=login_${code}`;
    window.open(url, '_blank');
    setIsPolling(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6"
          >
            <span className="text-5xl">🐔</span>
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            MushtumGRAM
          </h1>
          <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-xs">
            Fast. Secure. Funny.
          </p>
        </div>

        <div className="space-y-6 mb-10">
          <FeatureItem 
            icon={<Zap className="w-5 h-5 text-orange-400" />}
            title="Real-time Speed"
            desc="Instant messaging with chicken-speed delivery."
          />
          <FeatureItem 
            icon={<ShieldCheck className="w-5 h-5 text-blue-400" />}
            title="Secure Login"
            desc="Verified via Telegram Bot. No passwords needed."
          />
          <FeatureItem 
            icon={<Ghost className="w-5 h-5 text-purple-400" />}
            title="Privacy First"
            desc="Your data is protected and encrypted."
          />
        </div>

        <button
          onClick={handleLoginClick}
          disabled={isPolling}
          className="w-full bg-[#24A1DE] hover:bg-[#24A1DE]/90 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
        >
          {isPolling ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Waiting for Bot...</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-6 h-6" />
              <span>Login with Telegram</span>
            </>
          )}
        </button>

        {isPolling && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-6 text-white/40 text-sm animate-pulse"
          >
            Please start the bot in Telegram to continue.
          </motion.p>
        )}

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs">
            By logging in, you agree to our Terms of Service.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-4 items-start">
    <div className="mt-1">{icon}</div>
    <div>
      <h3 className="font-semibold text-white/90 text-sm">{title}</h3>
      <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
    </div>
  </div>
);
