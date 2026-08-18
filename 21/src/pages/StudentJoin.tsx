import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionByCode, joinSession } from '../lib/db';
import { Button } from '../components/ui/Button';

export default function StudentJoin() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const session = await getSessionByCode(code.trim());
      if (!session) {
        setError("We couldn't find that quiz code.");
        return;
      }
      
      if (session.status !== 'waiting') {
        setError("This quiz has already started.");
        return;
      }

      const participantId = await joinSession(session.id, name.trim());
      
      localStorage.setItem(`quiz_${session.id}`, participantId);
      localStorage.setItem('currentSessionId', session.id);
      
      navigate(`/student/lobby/${session.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while joining.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Orange Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">Join a Quiz</h1>
          <p className="text-lg text-zinc-400 font-medium">Enter the code shared by your host.</p>
        </div>
        
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-4 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-zinc-800 shadow-2xl">
            <input
              type="text"
              placeholder="Quiz Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-600 text-center text-3xl font-bold tracking-widest h-20 rounded-2xl focus:outline-none focus:border-orange-500/50 transition-colors uppercase"
              maxLength={6}
              required
            />
            
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-600 text-center text-xl font-medium h-16 rounded-2xl focus:outline-none focus:border-orange-500/50 transition-colors"
              maxLength={20}
              required
            />
            
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm p-4 rounded-xl text-center border border-red-500/20 font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-bold mt-4" 
              isLoading={loading}
              disabled={!code || !name}
            >
              Join Quiz
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}