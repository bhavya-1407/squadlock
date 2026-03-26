import React from 'react';
import { Instagram, Youtube, Twitter, MessageCircle, Music2, Ghost } from 'lucide-react';

export const POISON_APPS = [
  { id: 'Instagram', icon: <Instagram size={24} />, color: 'text-pink-500' },
  { id: 'YouTube', icon: <Youtube size={24} />, color: 'text-red-500' },
  { id: 'Reddit', icon: <Ghost size={24} />, color: 'text-orange-600' },
  { id: 'Twitter', icon: <Twitter size={24} />, color: 'text-blue-400' },
  { id: 'TikTok', icon: <Music2 size={24} />, color: 'text-cyan-400' },
  { id: 'Discord', icon: <MessageCircle size={24} />, color: 'text-indigo-500' },
];
