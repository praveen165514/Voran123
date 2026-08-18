import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle, logout } from '../lib/firebase';
import { Button } from './ui/Button';
import { BrainCircuit, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="sticky top-6 mt-6 mb-6 z-50 mx-auto w-[95%] max-w-5xl rounded-full border border-zinc-800/60 bg-black/80 backdrop-blur-xl shrink-0 transition-all duration-300">
      <div className="mx-auto flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-full flex items-center justify-center font-bold text-2xl text-black">V</div>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-400">
          <Link to="/join">
            <Button variant="ghost" size="sm" className="text-white hover:text-orange-400">Join Quiz</Button>
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-white transition-colors hidden sm:flex items-center py-2">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-zinc-800/60">
                <span className="text-sm font-medium hidden sm:inline-block text-zinc-300">{user.displayName}</span>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-8 w-8 rounded-full border border-zinc-700" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={logout} className="px-2 hover:bg-zinc-800/50 rounded-full" title="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" onClick={handleLogin}>Teacher Login</Button>
          )}
        </nav>
      </div>
    </header>
  );
}
