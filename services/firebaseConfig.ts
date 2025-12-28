
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  setDoc,
  getDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAhx_I1Wg0RncK_XTTOVjKrRkeD8-wDoMw",
  authDomain: "condominio-amaranthus.firebaseapp.com",
  projectId: "condominio-amaranthus",
  storageBucket: "condominio-amaranthus.firebasestorage.app",
  messagingSenderId: "233912918531",
  appId: "1:233912918531:web:6850381663623ef1282436"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  setDoc,
  getDoc
};
