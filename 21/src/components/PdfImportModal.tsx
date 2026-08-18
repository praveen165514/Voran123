import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { X, UploadCloud, FileText, AlertTriangle, CheckCircle2, Circle, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Question } from '../types';

interface ExtractedQuestion {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  confidenceScore: number;
  confidenceReason?: string;
  selected: boolean;
}

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Partial<Question>[]) => void;
}

export function PdfImportModal({ isOpen, onClose, onImport }: PdfImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        if (selected.size > 20 * 1024 * 1024) {
          setError("File size must be under 20 MB.");
          return;
        }
        setFile(selected);
        setError(null);
      } else {
        setError("Please select a valid PDF file.");
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf') {
        if (dropped.size > 20 * 1024 * 1024) {
          setError("File size must be under 20 MB.");
          return;
        }
        setFile(dropped);
        setError(null);
      } else {
        setError("Please drop a valid PDF file.");
      }
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
    setStep('scanning');
    setError(null);
    setScanProgress(0);
    
    // Simulate progress animation while fetching
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) return prev; // Hold at 90% until fetch completes
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          const response = await fetch('/api/extract-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pdf: base64Data }),
          });

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (parseError) {
              throw new Error(`Server Error (${response.status}): The API could not be reached.`);
            }
            throw new Error(errorData.error || 'Failed to scan PDF');
          }

          const data = await response.json();
          clearInterval(interval);
          setScanProgress(100);
          
          setTimeout(() => {
            const formatted = (data.questions || []).map((q: any) => ({
              ...q,
              selected: true
            }));
            setExtractedQuestions(formatted);
            
            if (formatted.length === 0) {
               setError("VOran couldn't find any multiple-choice questions in this PDF.");
               setStep('upload');
            } else {
               setStep('review');
            }
          }, 500);
        } catch (err: any) {
          clearInterval(interval);
          setError(err.message || 'An unexpected error occurred.');
          setStep('upload');
        }
      };
      
      reader.onerror = () => {
        throw new Error("Failed to read file.");
      }
      
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'An unexpected error occurred.');
      setStep('upload');
    }
  };

  const toggleSelect = (index: number) => {
    setExtractedQuestions(prev => {
      const next = [...prev];
      next[index].selected = !next[index].selected;
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = extractedQuestions.every(q => q.selected);
    setExtractedQuestions(prev => prev.map(q => ({ ...q, selected: !allSelected })));
  };

  const updateQuestion = (index: number, updates: Partial<ExtractedQuestion>) => {
    setExtractedQuestions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleImport = () => {
    const selected = extractedQuestions.filter(q => q.selected);
    const toImport = selected.map(q => ({
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      points: 1000,
      timerSeconds: 20
    }));
    onImport(toImport);
    onClose();
  };

  const selectedCount = extractedQuestions.filter(q => q.selected).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-xl border border-orange-500/30">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI PDF Import</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {step === 'upload' && (
            <div className="max-w-xl mx-auto flex flex-col items-center">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Upload Question PDF</h3>
                <p className="text-zinc-400">Upload a PDF containing multiple-choice questions. AI will automatically detect MCQs, options, and correct answers.</p>
              </div>

              {!file ? (
                <div 
                  className="w-full border-2 border-dashed border-zinc-700 hover:border-orange-500/50 bg-zinc-900/50 hover:bg-orange-500/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                  <div className="bg-zinc-800 group-hover:bg-orange-500/20 p-4 rounded-full mb-6 transition-colors">
                    <FileText className="w-8 h-8 text-zinc-400 group-hover:text-orange-400" />
                  </div>
                  <p className="text-white font-medium text-lg mb-2">Drop your PDF here</p>
                  <p className="text-zinc-500 mb-6">or click to browse files</p>
                  <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">PDF files • Max 20 MB</div>
                </div>
              ) : (
                <div className="w-full bg-black border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/30">
                      <FileText className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{file.name}</p>
                      <p className="text-zinc-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-red-400 text-sm font-medium transition-colors px-3">
                      Remove
                    </button>
                  </div>
                  <Button size="lg" className="w-full h-14 text-lg" onClick={handleScan}>
                    Scan with AI <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {error && (
                <div className="mt-6 w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'scanning' && (
            <div className="max-w-md mx-auto flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative bg-zinc-900 border border-zinc-800 p-6 rounded-full">
                  <Sparkles className="w-12 h-12 text-orange-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight mb-4">AI is analyzing your PDF</h3>
              
              <div className="w-full bg-zinc-900 rounded-full h-2 mb-6 overflow-hidden">
                <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${Math.min(scanProgress, 100)}%` }}></div>
              </div>
              
              <div className="flex flex-col items-center gap-3 text-sm font-medium text-zinc-400">
                <div className={`transition-opacity ${scanProgress > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>✓ Reading document</div>
                <div className={`transition-opacity ${scanProgress > 30 ? 'text-zinc-300' : 'text-zinc-600'}`}>● Detecting questions</div>
                <div className={`transition-opacity ${scanProgress > 60 ? 'text-zinc-300' : 'text-zinc-600'}`}>○ Extracting answer options</div>
                <div className={`transition-opacity ${scanProgress > 85 ? 'text-zinc-300' : 'text-zinc-600'}`}>○ Preparing your quiz</div>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="max-w-3xl mx-auto flex flex-col">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2">AI Found {extractedQuestions.length} Questions</h3>
                <p className="text-zinc-400">Review and edit your questions before adding them to the quiz.</p>
              </div>

              <div className="flex items-center justify-between mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <label className="flex items-center gap-3 cursor-pointer text-white font-medium">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-zinc-700 bg-black text-orange-500 focus:ring-orange-500/50 focus:ring-offset-black"
                    checked={extractedQuestions.length > 0 && extractedQuestions.every(q => q.selected)}
                    onChange={toggleSelectAll}
                  />
                  Select All
                </label>
                <div className="text-sm font-medium text-zinc-400">
                  <span className="text-white font-bold">{selectedCount}</span> of {extractedQuestions.length} selected
                </div>
              </div>

              <div className="space-y-6">
                {extractedQuestions.map((q, i) => (
                  <div key={i} className={`bg-black border ${q.selected ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-800'} rounded-3xl p-6 transition-colors`}>
                    <div className="flex items-start gap-4 mb-6">
                      <input 
                        type="checkbox" 
                        className="mt-1.5 w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500/50 focus:ring-offset-black cursor-pointer"
                        checked={q.selected}
                        onChange={() => toggleSelect(i)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Question {i + 1}</span>
                          {q.confidenceScore >= 0.8 ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> High confidence
                            </span>
                          ) : q.confidenceScore >= 0.5 ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Review recommended
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Low confidence
                            </span>
                          )}
                        </div>
                        
                        {q.confidenceReason && q.confidenceScore < 0.8 && (
                           <div className="mb-4 text-sm text-yellow-500/90 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                             {q.confidenceReason}
                           </div>
                        )}

                        <textarea
                          className="w-full bg-transparent border-none text-xl font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-0 resize-none"
                          value={q.text}
                          onChange={(e) => updateQuestion(i, { text: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctAnswerIndex === optIndex;
                        return (
                          <div key={optIndex} className={`flex items-center gap-3 p-3 rounded-xl border ${isCorrect ? 'border-orange-500/50 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                            <button 
                              className={`${isCorrect ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                              onClick={() => updateQuestion(i, { correctAnswerIndex: optIndex })}
                            >
                              {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <input
                              type="text"
                              className="w-full bg-transparent border-none text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[optIndex] = e.target.value;
                                updateQuestion(i, { options: newOpts });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="p-6 border-t border-zinc-800 bg-black/50 shrink-0 flex justify-between items-center">
            <Button variant="ghost" onClick={() => setStep('upload')}>Cancel</Button>
            <Button size="lg" onClick={handleImport} disabled={selectedCount === 0}>
              Import {selectedCount} Questions →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
