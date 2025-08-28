"use client";
import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, X, ExternalLink } from 'lucide-react';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { ApiKeys } from '@/lib/types';

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useLocalStorage<ApiKeys>('ai-fiesta:keys', {});
  const [gemini, setGemini] = useState(keys.gemini || '');
  const [openrouter, setOpenrouter] = useState(keys.openrouter || '');

  const save = () => {
    const next = { gemini: gemini.trim() || undefined, openrouter: openrouter.trim() || undefined };
    setKeys(next);
    setOpen(false);
  };

  // Allow programmatic open from anywhere (e.g., rate-limit CTA)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-settings', handler as EventListener);
    return () => window.removeEventListener('open-settings', handler as EventListener);
  }, []);

  return (
    <div>
      <button 
        onClick={() => setOpen(true)} 
        className="px-4 py-2 bg-secondary hover:bg-muted transition-colors text-sm flex items-center gap-2"
      >
        <SettingsIcon className="w-4 h-4" />
        Settings
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-lg weeble-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                API Keys
              </h2>
              <button 
                onClick={() => setOpen(false)} 
                className="p-2 hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Keys are stored locally in your browser and sent only with your requests. Never hardcode keys in code.</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/app/u/5/apikey?pli=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="weeble-button px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Get Key
                  </a>
                </div>
                <input 
                  value={gemini} 
                  onChange={(e) => setGemini(e.target.value)} 
                  placeholder="AIza..." 
                  className="w-full bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" 
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">OpenRouter API Key</label>
                  <a
                    href="https://openrouter.ai/sign-in?redirect_url=https%3A%2F%2Fopenrouter.ai%2Fsettings%2Fkeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="weeble-button px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Get Key
                  </a>
                </div>
                <input 
                  value={openrouter} 
                  onChange={(e) => setOpenrouter(e.target.value)} 
                  placeholder="sk-or-..." 
                  className="w-full bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" 
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setOpen(false)} 
                className="px-4 py-2 bg-secondary hover:bg-muted transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button 
                onClick={save} 
                className="weeble-button px-4 py-2 flex items-center gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                Save Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
