import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCfPFrUlQxTfa9itBeSkrS9KNeYSvs1XwQ",
  authDomain: "reclaim-f71d2.firebaseapp.com",
  projectId: "reclaim-f71d2",
  storageBucket: "reclaim-f71d2.firebasestorage.app",
  messagingSenderId: "398121066059",
  appId: "1:398121066059:web:633a28f38098c427f337ce"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)