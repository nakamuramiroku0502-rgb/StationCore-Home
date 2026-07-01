import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ★ Firebaseコンソールからコピーしたご自身のConfigに書き換えてください
const firebaseConfig = {
  apiKey: "AIzaSyBRaPbVbqoE8J7KxOvTlFKmp6y2oZiYoDw",
  authDomain: "miroku-0502.firebaseapp.com",
  projectId: "miroku-0502",
  storageBucket: "miroku-0502.firebasestorage.app",
  messagingSenderId: "227454970330",
  appId: "1:227454970330:web:1c59854910196f9618b8e3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);