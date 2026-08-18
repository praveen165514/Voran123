import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useParticipants, useResponses } from '../lib/hooks';
import { getQuiz, submitResponse } from '../lib/db';
import { Quiz } from '../types';
import { Button } from '../components/ui/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function StudentLiveQuiz() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { participants } = useParticipants(sessionId);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  
  const currentQuestionId = quiz && session ? quiz.questions[session.currentQuestionIndex]?.id : undefined;
  const { responses } = useResponses(sessionId, currentQuestionId);
  
  const [quizLoading, setQuizLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const participantId = localStorage.getItem(`quiz_${sessionId}`);
  const participant = participants.find(p => p.id === participantId);
  const currentResponse = responses.find(r => r.participantId === participantId);
  
  useEffect(() => {
    if (session) {
      getQuiz(session.quizId).then(q => {
        setQuiz(q);
        setQuizLoading(false);
      });
    }
  }, [session]);

  useEffect(() => {
    if (session?.status === 'question_active' && !currentResponse) {
      setSelectedOption(null);
    }
    
    if (session && quiz && session.status === 'question_active') {
      const currentQ = quiz.questions[session.currentQuestionIndex];
      if (!currentQ) return;
      
      setTotalTime(currentQ.timerSeconds);
      const endTime = session.startedAt! + (currentQ.timerSeconds * 1000);
      
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, (endTime - now) / 1000);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [session, quiz, currentResponse]);

  const handleSelectOption = async (index: number) => {
    if (!session || !quiz || !participantId || session.status !== 'question_active' || currentResponse || isSubmitting) return;
    
    setSelectedOption(index);
    setIsSubmitting(true);
    
    try {
      const currentQ = quiz.questions[session.currentQuestionIndex];
      const timeToAnswer = (Date.now() - session.startedAt!) / 1000;
      
      const isCorrect = currentQ.correctAnswerIndex === index;
      const basePoints = currentQ.points;
      let pointsEarned = 0;
      
      if (isCorrect) {
        const timeRatio = Math.max(0, 1 - (timeToAnswer / currentQ.timerSeconds));
        pointsEarned = Math.round(basePoints * (0.5 + (0.5 * timeRatio)));
      }
      
      await submitResponse({
        sessionId: session.id,
        participantId,
        questionId: currentQ.id,
        selectedOptionIndex: index,
        responseTime: timeToAnswer,
        pointsEarned,
        isCorrect,
        submittedAt: Date.now()
      });
      
    } catch (error) {
      console.error(error);
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionLoading || quizLoading) return <div className="flex-1 bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!session || !quiz) return <div className="flex-1 bg-black flex items-center justify-center text-red-500">Quiz not found</div>;
  if (!participant) return <div className="flex-1 bg-black flex items-center justify-center text-white">Not joined</div>;

  const isFinished = session.status === 'completed';
  const isQuestionActive = session.status === 'question_active';
  
  if (isFinished) {
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
    const rank = sortedParticipants.findIndex(p => p.id === participant.id) + 1;
    
    return (
      <div className="flex-1 bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Quiz Complete</h1>
          <p className="text-xl text-zinc-400 font-medium mb-12">Your final score</p>
          
          <div className="text-8xl font-bold text-white tracking-tighter mb-8">{participant.score}</div>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <div className="text-sm font-medium text-zinc-500 mb-2">Correct Answers</div>
              <div className="text-2xl font-bold text-white">{participant.correctAnswers} / {quiz.questions.length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <div className="text-sm font-medium text-zinc-500 mb-2">Rank</div>
              <div className="text-2xl font-bold text-white">#{rank}</div>
            </div>
          </div>
          
          <div className="mt-12">
            <Button size="lg" onClick={() => navigate('/')} variant="secondary" className="rounded-full px-8">Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[session.currentQuestionIndex];
  
  let isCorrect = null;
  if (!isQuestionActive && currentResponse) {
    isCorrect = currentResponse.isCorrect;
  }

  const progressPercentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <div className="flex-1 bg-black flex flex-col items-center p-4 sm:p-8 overflow-hidden relative">
      
      {/* Top Bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-12 shrink-0">
        <div className="text-lg font-bold text-white tracking-widest">
          {(session.currentQuestionIndex + 1).toString().padStart(2, '0')} <span className="text-zinc-600">/ {quiz.questions.length.toString().padStart(2, '0')}</span>
        </div>
        <div className="text-lg font-bold text-white tabular-nums tracking-widest">
          00:{Math.ceil(timeLeft).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Thin orange progress line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
        <div 
          className="h-full bg-orange-500 transition-all duration-75 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="w-full max-w-3xl flex-1 flex flex-col gap-12">
        
        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center text-center">
          {isQuestionActive ? (
            currentResponse ? (
              <div className="animate-in zoom-in duration-500">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full mb-6 shadow-2xl">
                  <span className="w-4 h-4 rounded-full bg-orange-500 animate-pulse"></span>
                </div>
                <h2 className="text-3xl font-semibold text-white tracking-tight">Answer submitted</h2>
                <p className="text-zinc-500 mt-4 text-lg">Waiting for others...</p>
              </div>
            ) : (
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
                {currentQ?.text}
              </h2>
            )
          ) : (
            <div className="animate-in zoom-in duration-500">
              {isCorrect === true && (
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              )}
              {isCorrect === false && (
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
              )}
              {isCorrect === null && (
                <div className="inline-flex items-center justify-center w-24 h-24 bg-zinc-800 rounded-full mb-6">
                  <span className="text-2xl font-bold text-zinc-500">Time's Up</span>
                </div>
              )}
              <h2 className="text-3xl font-semibold text-white tracking-tight mt-4">
                {isCorrect === true ? 'Correct!' : isCorrect === false ? 'Incorrect' : 'No Answer Submitted'}
              </h2>
              {isCorrect !== null && currentResponse && (
                <p className="text-orange-400 font-bold mt-4 text-xl">+{currentResponse.pointsEarned} points</p>
              )}
              <p className="text-zinc-500 mt-8 text-lg font-medium animate-pulse">Waiting for next question...</p>
            </div>
          )}
        </div>

        {/* Answer Cards */}
        {isQuestionActive && !currentResponse && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 pb-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
            {currentQ?.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedOption === i;
              
              return (
                <button
                  key={i}
                  disabled={isSubmitting || !!currentResponse}
                  onClick={() => handleSelectOption(i)}
                  className={`relative overflow-hidden text-left p-6 sm:p-8 rounded-[2rem] border transition-all duration-300
                    ${isSelected 
                      ? 'bg-orange-500 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[0.98]' 
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-orange-500/50 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.2)]'
                    }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors
                      ${isSelected ? 'bg-black/20 text-white' : 'bg-black text-zinc-400'}
                    `}>
                      {letter}
                    </div>
                    <span className={`text-xl font-semibold transition-colors
                      ${isSelected ? 'text-black' : 'text-white'}
                    `}>
                      {opt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}