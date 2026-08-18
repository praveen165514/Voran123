import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createQuiz } from '../lib/db';
import { Question } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Plus, Trash2, GripVertical, CheckCircle2, Circle, FileText } from 'lucide-react';
import { PdfImportModal } from '../components/PdfImportModal';

export default function CreateQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q_1',
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      timerSeconds: 20,
      points: 1000,
      order: 0,
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        timerSeconds: 20,
        points: 1000,
        order: questions.length,
      }
    ]);
  };

  const handleImportQuestions = (importedQuestions: Partial<Question>[]) => {
    // Remove the initial empty question if it's untouched
    const hasInitialEmpty = questions.length === 1 && !questions[0].text && questions[0].options.every(o => !o);
    
    const newQuestions = importedQuestions.map((q, i) => ({
      id: `q_${Date.now()}_${i}`,
      text: q.text || '',
      options: q.options || ['', '', '', ''],
      correctAnswerIndex: q.correctAnswerIndex ?? 0,
      timerSeconds: q.timerSeconds ?? 20,
      points: q.points ?? 1000,
      order: hasInitialEmpty ? i : questions.length + i,
    }));

    setQuestions(prev => hasInitialEmpty ? newQuestions : [...prev, ...newQuestions]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[optIndex] = value;
    newQuestions[qIndex].options = newOptions;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setError(null);
    if (!title.trim()) {
      setError("Please enter a quiz title.");
      return;
    }
    
    setIsSaving(true);
    try {
      await createQuiz({
        title,
        description,
        hostId: user.uid,
        questions,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError("Error saving quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    setError(null);
    if (!title.trim() || questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))) {
      setError("Please fill in all questions and options before publishing.");
      return;
    }

    setIsSaving(true);
    try {
      await createQuiz({
        title,
        description,
        hostId: user.uid,
        questions,
        status: 'published',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError("Error publishing quiz");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div className="p-8 text-center text-white">Please login to create a quiz.</div>;
  }

  return (
    <div className="flex-1 bg-black min-h-screen pb-12 pt-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header & Progress */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create Quiz</h1>
            <div className="flex gap-3">
              <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={handleSaveDraft} isLoading={isSaving}>Save Draft</Button>
              <Button onClick={handlePublish} isLoading={isSaving}>Publish</Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="text-white">Details</span>
            <span className="mx-2">→</span>
            <span>Questions</span>
            <span className="mx-2">→</span>
            <span>Settings</span>
            <span className="mx-2">→</span>
            <span>Publish</span>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-medium">
              {error}
            </div>
          )}
        </header>

        <div className="space-y-12">
          {/* Details Section */}
          <section>
            <input
              className="w-full bg-transparent border-none text-4xl sm:text-5xl font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-0 mb-4 tracking-tight"
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-transparent border-none text-xl text-zinc-400 placeholder:text-zinc-700 focus:outline-none focus:ring-0 resize-none min-h-[100px]"
              placeholder="Add a description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </section>

          {/* Questions Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-900 pb-4 mb-8">
              <h2 className="text-xl font-semibold text-white tracking-tight">Questions</h2>
              <span className="bg-zinc-900 text-zinc-400 text-xs px-3 py-1 rounded-full font-bold">{questions.length}</span>
            </div>
            
            {questions.map((q, qIndex) => (
              <div key={q.id} className="group relative bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 transition-all hover:bg-zinc-900/80">
                
                {/* Floating Controls (Visible on hover) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800">
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-800" onClick={() => handleRemoveQuestion(qIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-4 mb-8">
                  <div className="text-zinc-600 font-bold text-lg mt-1 tracking-tighter">{(qIndex + 1).toString().padStart(2, '0')}</div>
                  <textarea
                    placeholder="Type your question here..."
                    className="w-full bg-transparent border-none text-2xl font-semibold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-0 resize-none h-auto overflow-hidden"
                    value={q.text}
                    onChange={(e) => handleUpdateQuestion(qIndex, { text: e.target.value })}
                    rows={1}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => {
                    const isCorrect = q.correctAnswerIndex === optIndex;
                    return (
                      <div key={optIndex} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCorrect ? 'border-orange-500/50 bg-orange-500/10' : 'border-zinc-800 bg-black hover:border-zinc-700'}`}>
                        <button 
                          className={`shrink-0 transition-colors ${isCorrect ? 'text-orange-500' : 'text-zinc-700 hover:text-orange-400'}`}
                          onClick={() => handleUpdateQuestion(qIndex, { correctAnswerIndex: optIndex })}
                        >
                          {isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>
                        <input
                          type="text"
                          className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-white placeholder:text-zinc-600 text-lg"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Question Settings - Minimal */}
                <div className="flex items-center gap-6 pt-6 mt-6 border-t border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <select 
                      className="bg-transparent border-none text-zinc-400 text-sm focus:ring-0 cursor-pointer hover:text-white transition-colors"
                      value={q.timerSeconds}
                      onChange={(e) => handleUpdateQuestion(qIndex, { timerSeconds: parseInt(e.target.value) })}
                    >
                      <option value={10}>10s Time Limit</option>
                      <option value={20}>20s Time Limit</option>
                      <option value={30}>30s Time Limit</option>
                      <option value={60}>60s Time Limit</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      className="bg-transparent border-none text-zinc-400 text-sm focus:ring-0 cursor-pointer hover:text-white transition-colors"
                      value={q.points}
                      onChange={(e) => handleUpdateQuestion(qIndex, { points: parseInt(e.target.value) })}
                    >
                      <option value={500}>500 Points</option>
                      <option value={1000}>1,000 Points</option>
                      <option value={2000}>2,000 Points</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button variant="ghost" className="flex-1 py-12 border border-zinc-800 border-dashed bg-transparent hover:bg-zinc-900/50 hover:border-zinc-700 rounded-3xl text-zinc-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2" onClick={handleAddQuestion}>
                <Plus className="h-6 w-6 text-orange-500" />
                <span className="font-semibold text-white">Add Question Manually</span>
              </Button>
              <Button variant="ghost" className="flex-1 py-12 border border-zinc-800 border-dashed bg-transparent hover:bg-zinc-900/50 hover:border-orange-500/50 rounded-3xl text-zinc-500 hover:text-orange-400 transition-all flex flex-col items-center justify-center gap-2" onClick={() => setIsImportModalOpen(true)}>
                <FileText className="h-6 w-6 text-orange-500" />
                <span className="font-semibold text-white">Import from PDF</span>
                <span className="text-xs text-zinc-500">AI will auto-detect questions & answers</span>
              </Button>
            </div>
          </section>
        </div>
      </div>
      <PdfImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleImportQuestions} 
      />
    </div>
  );
}
