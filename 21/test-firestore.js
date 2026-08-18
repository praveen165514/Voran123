const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const q = query(collection(db, 'quizzes'), where('hostId', '==', 'test'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    console.log('Query success', snapshot.size);
  } catch (err) {
    console.error('Query failed:', err.message);
  }
}
test();
