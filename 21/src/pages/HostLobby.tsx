import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useParticipants } from '../lib/hooks';
import { updateSession } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Users, Copy, Check } from 'lucide-react';

export default function HostLobby() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, loading } = useSession(sessionId);
  const { participants } = useParticipants(sessionId);
  const [copied, setCopied] = React.useState(false);
  const [showConfirmStart, setShowConfirmStart] = React.useState(false);

  const handleCopy = () => {
    if (session) {
      navigator.clipboard.writeText(session.quizCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStart = () => {
    if (!sessionId) return;
    if (participants.length === 0) {
      setShowConfirmStart(true);
      return;
    }
    executeStart();
  };

  const executeStart = async () => {
    if (!sessionId) return;
    try {
      setShowConfirmStart(false);
      await updateSession(sessionId, { status: 'question_active', startedAt: Date.now() });
      navigate(`/host/live/${sessionId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to start quiz");
    }
  };

  if (loading) return <div className="flex-1 bg-black p-8 text-center text-white">Loading session...</div>;
  if (!session) return <div className="flex-1 bg-black p-8 text-center text-red-500">Session not found</div>;

  return (
    <div className="flex-1 flex flex-col bg-black text-white items-center justify-center p-4">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-400 mb-8 tracking-tight">Your quiz is ready.</h1>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-[8rem] md:text-[12rem] leading-none font-bold tracking-tighter text-white">
            {session.quizCode}
          </div>
          <p className="text-lg text-zinc-500 mt-2 font-medium">Share this code with your students.</p>
          
          <div className="flex items-center gap-4 mt-8">
            <Button variant="secondary" onClick={handleCopy} className="rounded-full px-8">
              {copied ? <Check className="mr-2 h-4 w-4 text-orange-400" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Code
            </Button>
            <Button size="lg" onClick={handleStart} className="rounded-full px-12 text-lg">
              Start Quiz
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl animate-in fade-in duration-1000 delay-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-6 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-white tracking-wide">{participants.length} students joined</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center content-start">
          {participants.length === 0 ? (
             <div className="w-full text-center text-zinc-600 py-8 text-sm font-medium">
               Waiting for everyone to join...
             </div>
          ) : (
            participants.map(p => (
              <div 
                key={p.id} 
                className="px-4 py-2 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-300"
              >
                {p.name}
              </div>
            ))
          )}
        </div>
      </div>

      {showConfirmStart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-2">Start without students?</h3>
            <p className="text-zinc-400 mb-8">No students have joined yet. Are you sure you want to start the quiz anyway?</p>
            <div className="flex gap-4">
              <Button 
                variant="secondary" 
                className="flex-1 rounded-xl"
                onClick={() => setShowConfirmStart(false)}
              >
                Wait
              </Button>
              <Button 
                className="flex-1 rounded-xl"
                onClick={executeStart}
              >
                Start Quiz
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}