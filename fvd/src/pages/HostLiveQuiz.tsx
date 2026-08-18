import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useParticipants, useResponses } from '../lib/hooks';
import { updateSession, getQuiz, getAllSessionResponses } from '../lib/db';
import { exportResultsToExcel } from '../lib/export';
import { Quiz } from '../types';
import { Button } from '../components/ui/Button';
import { Users, BarChart, Download, CheckCircle2 } from 'lucide-react';

export default function HostLiveQuiz() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { participants } = useParticipants(sessionId);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  
  const currentQuestionId = quiz && session ? quiz.questions[session.currentQuestionIndex]?.id : undefined;
  const { responses } = useResponses(sessionId, currentQuestionId);
  
  const [quizLoading, setQuizLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (session) {
      getQuiz(session.quizId).then(q => {
        setQuiz(q);
        setQuizLoading(false);
      });
    }
  }, [session]);

  useEffect(() => {
    if (!session || !quiz || session.status !== 'question_active') return;

    const currentQ = quiz.questions[session.currentQuestionIndex];
    if (!currentQ) return;

    const endTime = session.startedAt + (currentQ.timerSeconds * 1000);
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        handleEndQuestion();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [session, quiz]);

  const handleEndQuestion = async () => {
    if (!sessionId) return;
    await updateSession(sessionId, { status: 'question_ended' });
  };

  const handleNextQuestion = async () => {
    if (!sessionId || !session || !quiz) return;
    
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= quiz.questions.length) {
      await updateSession(sessionId, { status: 'completed' });
    } else {
      await updateSession(sessionId, { 
        currentQuestionIndex: nextIndex,
        status: 'question_active',
        startedAt: Date.now()
      });
    }
  };

  const handleExport = async () => {
    if (!sessionId || !quiz || !participants) return;
    try {
      setIsExporting(true);
      const allResponses = await getAllSessionResponses(sessionId);
      exportResultsToExcel(quiz, participants, allResponses);
    } catch (error) {
      console.error("Error exporting results:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (sessionLoading || quizLoading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (!session || !quiz) return <div className="p-8 text-center text-red-500">Session not found</div>;

  const currentQuestion = quiz.questions[session.currentQuestionIndex];
  const isQuestionActive = session.status === 'question_active';
  const isFinished = session.status === 'completed';

  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center bg-black p-8 overflow-y-auto">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">Leaderboard</h1>
          <p className="text-xl text-zinc-400 font-medium">Final results for <span className="text-white">{quiz.title}</span></p>
        </div>
        
        <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl animate-in fade-in duration-700">
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-black border border-zinc-800">
                <div className="flex items-center gap-6">
                  <div className={`text-2xl font-black w-10 text-center ${i === 0 ? 'text-orange-500' : 'text-zinc-500'}`}>
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">{p.name}</h3>
                    <p className="text-sm text-zinc-400">{p.correctAnswers} / {quiz.questions.length} correct</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{p.score} <span className="text-sm text-zinc-500 font-bold uppercase tracking-widest">pts</span></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" variant="secondary" onClick={handleExport} isLoading={isExporting} className="rounded-full px-8 bg-zinc-800 hover:bg-zinc-700">
            <Download className="mr-2 h-5 w-5" /> Export Excel
          </Button>
          <Button size="lg" onClick={() => navigate('/dashboard')} className="rounded-full px-8">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const answeredCount = responses.length;
  const totalCount = participants.length;

  return (
    <div className="flex-1 flex flex-col bg-black p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-12 pt-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center shrink-0 border-b border-zinc-900 pb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{quiz.title}</h1>
              {isQuestionActive && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-orange-400 tracking-widest uppercase">Live</span>
                </div>
              )}
            </div>
            <div className="text-sm font-medium text-zinc-500">Question {session.currentQuestionIndex + 1} of {quiz.questions.length}</div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white tabular-nums">{timeLeft}s</div>
            </div>
            {isQuestionActive ? (
              <Button variant="danger" onClick={handleEndQuestion} className="rounded-full px-6">End Question</Button>
            ) : (
              <Button onClick={handleNextQuestion} className="rounded-full px-6">
                {session.currentQuestionIndex + 1 >= quiz.questions.length ? 'Show Results' : 'Next Question'}
              </Button>
            )}
          </div>
        </div>

        {/* Current Question Display for Host */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 sm:p-8 shrink-0 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-8">
            {currentQuestion?.text}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion?.options.map((opt, i) => {
              const isCorrect = currentQuestion.correctAnswerIndex === i;
              return (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${isCorrect ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-zinc-800 bg-black'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isCorrect ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div className="text-lg font-medium text-white flex-1">{opt}</div>
                  {isCorrect && (
                    <div className="flex items-center gap-1.5 text-orange-500 text-sm font-bold tracking-widest uppercase bg-orange-500/20 px-3 py-1 rounded-full shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Answered Statistic */}
        <div className="text-center shrink-0 flex items-center justify-center gap-6 bg-zinc-900/30 py-6 rounded-3xl border border-zinc-800/50">
          <div className="text-right">
            <div className="text-lg font-medium text-zinc-400 leading-tight">Students<br/>Answered</div>
          </div>
          <div className="w-px h-12 bg-zinc-800"></div>
          <div className="text-left">
            <div className="text-5xl font-bold text-white tracking-tighter">
              {answeredCount}<span className="text-zinc-600">/{totalCount}</span>
            </div>
          </div>
        </div>
        
        {/* Horizontal Answer Distribution (Visible when question ended) */}
        {!isQuestionActive && (
          <div className="flex justify-center gap-8 py-8 shrink-0">
            {currentQuestion?.options.map((opt, i) => {
              const optResponses = responses.filter(r => r.selectedOptionIndex === i).length;
              const isCorrect = currentQuestion.correctAnswerIndex === i;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`text-2xl font-bold ${isCorrect ? 'text-orange-500' : 'text-white'}`}>
                    {String.fromCharCode(65 + i)} — {optResponses}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Participants Table */}
        <div className="flex-1 min-h-0 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col">
          <h3 className="font-semibold text-white tracking-tight mb-6">Live Participants</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-sm font-medium text-zinc-500">
                  <th className="pb-4 font-medium">Student</th>
                  <th className="pb-4 font-medium">Score</th>
                  <th className="pb-4 font-medium">Answered</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-white">
                {participants.map(p => {
                  const hasAnswered = responses.some(r => r.participantId === p.id);
                  return (
                    <tr key={p.id} className="text-sm">
                      <td className="py-4 font-medium">{p.name}</td>
                      <td className="py-4 font-mono">{p.score}</td>
                      <td className="py-4">{p.correctAnswers} / {quiz.questions.length}</td>
                      <td className="py-4">
                        {isQuestionActive ? (
                          hasAnswered ? <span className="text-green-400">Done</span> : <span className="text-zinc-500">Thinking...</span>
                        ) : (
                          <span className="text-zinc-400">Waiting</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}