import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyBp55c0-J231N7pMpUT3oMAkMMSvh7Bsko",
    authDomain: "promptloom-b49be.firebaseapp.com",
    projectId: "promptloom-b49be",
    storageBucket: "promptloom-b49be.firebasestorage.app",
    messagingSenderId: "242229225365",
    appId: "1:242229225365:web:f2a4d91b075057dda7389c",
    measurementId: "G-C8EC00RM22"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const db = getFirestore(app)

export { auth, provider, db}
