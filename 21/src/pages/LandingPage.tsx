import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
  return (
    <div className="flex-1 bg-black overflow-hidden selection:bg-orange-500/30">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-20 pb-32">
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center flex flex-col items-center">
          <h1 className="text-6xl sm:text-8xl font-bold tracking-tight text-white mb-8">
            VOran
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-400 font-medium max-w-2xl mb-12 leading-relaxed">
            Turn any question set into a live, interactive experience. A beautifully simple platform for classrooms, events, and competitions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Link to="/dashboard">
              <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-4 h-16 shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]">
                Create a Quiz
              </Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-10 py-4 h-16">
                Join a Quiz
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
