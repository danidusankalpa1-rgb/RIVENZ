import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBf22eqn8AqnUsQ-Rliwn3C-O96ZQ8xR-Y",
  authDomain: "graphics-4c4f2.firebaseapp.com",
  projectId: "graphics-4c4f2",
  storageBucket: "graphics-4c4f2.firebasestorage.app",
  messagingSenderId: "480020418524",
  appId: "1:480020418524:web:62c7745967060614da4919"
};


export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);