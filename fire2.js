const firebaseConfig = {
  apiKey: "AIzaSyCMOPJnK_qpUZcHUWi6EQz-qclrNsDky3U",
  authDomain: "psysko-8d035.firebaseapp.com",
  projectId: "psysko-8d035",
  storageBucket: "psysko-8d035.firebasestorage.app",
  messagingSenderId: "176989826632",
  appId: "1:176989826632:web:bae58e639edbd8d4adf27d",
  measurementId: "G-XL5YJR6L74"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
window.db = db; // important!
