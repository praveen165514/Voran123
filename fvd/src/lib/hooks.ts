import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { QuizSession, Participant, Response, Quiz } from '../types';

export const useQuiz = (quizId?: string) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      const docSnap = await getDoc(doc(db, 'quizzes', quizId));
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() } as Quiz);
      }
      setLoading(false);
    };
    
    fetchQuiz();
  }, [quizId]);

  return { quiz, loading };
};

export const useSession = (sessionId?: string) => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'quizSessions', sessionId), (doc) => {
      if (doc.exists()) {
        setSession({ id: doc.id, ...doc.data() } as QuizSession);
      } else {
        setSession(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching session:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { session, loading };
};

export const useParticipants = (sessionId?: string) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'participants'),
      where('sessionId', '==', sessionId),
      orderBy('score', 'desc') // For leaderboard
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
      setParticipants(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { participants, loading };
};

export const useResponses = (sessionId?: string, questionId?: string) => {
  const [responses, setResponses] = useState<Response[]>([]);
  
  useEffect(() => {
    if (!sessionId || !questionId) return;

    const q = query(
      collection(db, 'responses'),
      where('sessionId', '==', sessionId),
      where('questionId', '==', questionId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
      setResponses(data);
    });

    return () => unsubscribe();
  }, [sessionId, questionId]);

  return { responses };
};
