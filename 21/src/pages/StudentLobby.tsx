import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useParticipants } from '../lib/hooks';

export default function StudentLobby() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, loading } = useSession(sessionId);
  const { participants } = useParticipants(sessionId);

  const participantId = localStorage.getItem(`quiz_${sessionId}`);
  const participant = participants.find(p => p.id === participantId);

  useEffect(() => {
    if (!loading && session) {
      if (session.status !== 'waiting') {
        navigate(`/student/live/${sessionId}`);
      }
    }
  }, [session, loading, navigate, sessionId]);

  if (loading) return <div className="flex-1 bg-black flex items-center justify-center p-8 text-white">Loading...</div>;
  if (!session) return <div className="flex-1 bg-black flex items-center justify-center p-8 text-red-500">Session not found</div>;
  
  if (!participant) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">You are not in this quiz</h2>
        <button className="text-orange-400 hover:underline" onClick={() => navigate('/join')}>Go to Join Page</button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Orange Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Animated Check */}
        <div className="w-16 h-16 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center mb-8 shadow-xl">
          <svg className="w-6 h-6 text-white animate-in zoom-in duration-500 delay-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">You're in.</h1>
        <p className="text-lg text-zinc-400 font-medium mb-12">Waiting for the host to start...</p>
        
        {/* Simple Animated Orange Progress Indicator */}
        <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden mb-12">
          <div className="h-full bg-orange-500 rounded-full w-1/3 animate-[progress_2s_ease-in-out_infinite_alternate]"></div>
        </div>

        {/* Minimal Participant List */}
        <div className="w-full text-center">
          <div className="text-sm font-semibold text-zinc-500 mb-6">{participants.length} players joined</div>
          <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto">
            {participants.slice(-10).reverse().map((p, index) => (
              <div 
                key={p.id}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {p.id === participantId ? <span className="text-white font-bold">{p.name} (You)</span> : p.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}