import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Quiz, QuizSession, Participant, Response, Question } from '../types';

export const generateQuizCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createQuiz = async (quizData: Omit<Quiz, 'id'>) => {
  const docRef = await addDoc(collection(db, 'quizzes'), quizData);
  return docRef.id;
};

export const getQuizzesByHost = async (hostId: string): Promise<Quiz[]> => {
  const q = query(collection(db, 'quizzes'), where('hostId', '==', hostId), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  const docRef = doc(db, 'quizzes', quizId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Quiz;
  }
  return null;
};

export const updateQuiz = async (quizId: string, data: Partial<Quiz>) => {
  const docRef = doc(db, 'quizzes', quizId);
  await updateDoc(docRef, data);
};

export const deleteQuiz = async (quizId: string) => {
  await deleteDoc(doc(db, 'quizzes', quizId));
};

export const createQuizSession = async (quizId: string, hostId: string, quizCode: string) => {
  const sessionData: Omit<QuizSession, 'id'> = {
    quizId,
    hostId,
    quizCode,
    status: 'waiting',
    currentQuestionIndex: 0,
  };
  const docRef = await addDoc(collection(db, 'quizSessions'), sessionData);
  return docRef.id;
};

export const getSessionByCode = async (code: string): Promise<QuizSession | null> => {
  const q = query(collection(db, 'quizSessions'), where('quizCode', '==', code), where('status', 'in', ['waiting', 'question_active', 'question_ended']));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as QuizSession;
  }
  return null;
};

export const getSession = async (sessionId: string): Promise<QuizSession | null> => {
  const docRef = doc(db, 'quizSessions', sessionId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as QuizSession;
  }
  return null;
};

export const updateSession = async (sessionId: string, data: Partial<QuizSession>) => {
  await updateDoc(doc(db, 'quizSessions', sessionId), data);
};

export const joinSession = async (sessionId: string, name: string) => {
  // Check if name already exists in this session
  const q = query(collection(db, 'participants'), where('sessionId', '==', sessionId), where('name', '==', name));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error('Name is already taken in this quiz.');
  }

  const participantData: Omit<Participant, 'id'> = {
    sessionId,
    name,
    score: 0,
    questionsAttempted: 0,
    correctAnswers: 0,
    joinedAt: Date.now(),
    status: 'waiting',
  };
  
  const docRef = await addDoc(collection(db, 'participants'), participantData);
  return docRef.id;
};

export const getParticipant = async (participantId: string): Promise<Participant | null> => {
  const docSnap = await getDoc(doc(db, 'participants', participantId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Participant;
  }
  return null;
};

export const updateParticipant = async (participantId: string, data: Partial<Participant>) => {
  await updateDoc(doc(db, 'participants', participantId), data);
};

export const submitResponse = async (responseData: Omit<Response, 'id'>) => {
  await addDoc(collection(db, 'responses'), responseData);
};

export const getAllSessionResponses = async (sessionId: string): Promise<Response[]> => {
  const q = query(collection(db, 'responses'), where('sessionId', '==', sessionId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
};
