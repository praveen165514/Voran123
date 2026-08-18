import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getQuizzesByHost, deleteQuiz, createQuizSession, generateQuizCode } from '../lib/db';
import { Quiz } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Play, Trash2, LayoutGrid, FileText, Activity, Users, Settings } from 'lucide-react';

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    if (!user) return;
    try {
      const data = await getQuizzesByHost(user.uid);
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHost = async (quizId: string) => {
    if (!user) return;
    setError(null);
    try {
      const code = generateQuizCode();
      const sessionId = await createQuizSession(quizId, user.uid, code);
      navigate(`/host/lobby/${sessionId}`);
    } catch (err) {
      console.error("Failed to host quiz", err);
      setError("Failed to start quiz session");
    }
  };

  const executeDelete = async (quizId: string) => {
    try {
      await deleteQuiz(quizId);
      loadQuizzes();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDelete = (quizId: string) => {
    setDeleteConfirmId(quizId);
  };

  if (!user) return <div className="p-8 text-center text-white">Please login to view dashboard.</div>;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-black">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800/60 p-6 flex-col gap-8 shrink-0 bg-black overflow-y-auto">
        <nav className="space-y-2 mt-4">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white transition-all">
            <LayoutGrid className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Overview</span>
          </Link>
          <div className="flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 cursor-pointer transition-all">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">My Quizzes</span>
          </div>
          <Link to="/create" className="flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Quiz</span>
          </Link>
          <div className="flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 cursor-pointer transition-all">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Live Sessions</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 cursor-pointer transition-all">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Results</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 cursor-pointer transition-all">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-8 md:p-12 bg-black flex flex-col gap-16 overflow-y-auto">
        
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between shrink-0 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{getTimeOfDay()}, {user.displayName?.split(' ')[0] || 'Teacher'}.</h1>
          </div>
          <Link to="/create">
            <Button size="lg"><Plus className="mr-2 h-5 w-5" /> Create Quiz</Button>
          </Link>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-medium">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 border-t border-zinc-900 pt-12">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <h3 className="text-2xl font-bold text-white tracking-tight">Recent Quizzes</h3>
          </div>
          
          {loading ? (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-zinc-900 rounded-3xl" />)}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-zinc-800">
              <h3 className="text-xl font-semibold text-white mb-2">No quizzes yet</h3>
              <p className="text-zinc-400 mb-8">Create your first interactive quiz and start engaging your students.</p>
              <Link to="/create">
                <Button>Create Your First Quiz</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {quizzes.map((quiz, i) => {
                const colors = [
                  { bg: 'bg-zinc-900/40', border: 'border-zinc-800', hoverBorder: 'hover:border-zinc-700' },
                ];
                const c = colors[0];
                return (
                  <div key={quiz.id} className={`${c.bg} border ${c.border} ${c.hoverBorder} rounded-[2rem] p-6 transition-all duration-300 cursor-pointer group flex flex-col relative overflow-hidden backdrop-blur-xl`} onClick={() => handleHost(quiz.id)}>
                    <div className="absolute top-6 right-6 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="bg-black/60 backdrop-blur-md hover:bg-black/80 h-10 w-10 p-0 rounded-full text-zinc-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-white mb-6 border border-zinc-700/50 shadow-inner">
                      <FileText className="w-5 h-5 text-orange-400" />
                    </div>
                    
                    <h4 className="text-xl font-semibold text-white mb-2 tracking-tight line-clamp-1">{quiz.title}</h4>
                    
                    <div className="flex items-center gap-2 mt-auto pt-8">
                      <span className="text-sm text-zinc-500 font-medium">{quiz.questions.length} Questions</span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-sm text-zinc-500 font-medium">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Hover overlay for quick host */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-sm transition-all duration-300 rounded-[2rem]">
                      <Button className="bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                        <Play className="mr-2 h-4 w-4 fill-current" /> Host Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-2">Delete Quiz</h3>
            <p className="text-zinc-400 mb-8">Are you sure you want to delete this quiz? This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button 
                variant="secondary" 
                className="flex-1 rounded-xl"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                onClick={() => executeDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}