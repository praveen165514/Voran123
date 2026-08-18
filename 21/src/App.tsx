/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import HostDashboard from './pages/HostDashboard';
import CreateQuiz from './pages/CreateQuiz';
import HostLobby from './pages/HostLobby';
import HostLiveQuiz from './pages/HostLiveQuiz';
import StudentJoin from './pages/StudentJoin';
import StudentLobby from './pages/StudentLobby';
import StudentLiveQuiz from './pages/StudentLiveQuiz';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-orange-500/30">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<HostDashboard />} />
              <Route path="/create" element={<CreateQuiz />} />
              <Route path="/host/lobby/:sessionId" element={<HostLobby />} />
              <Route path="/host/live/:sessionId" element={<HostLiveQuiz />} />
              
              <Route path="/join" element={<StudentJoin />} />
              <Route path="/student/lobby/:sessionId" element={<StudentLobby />} />
              <Route path="/student/live/:sessionId" element={<StudentLiveQuiz />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
