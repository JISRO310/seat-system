import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Construction } from "lucide-react";

const firebaseConfig = {
  apiKey: "AIzaSyBk28xs_NgOAvaXBvWCb-iorcwHLXhmTvU",
  authDomain: "seat-system-f79b9.firebaseapp.com",
  projectId: "seat-system-f79b9",
  storageBucket: "seat-system-f79b9.firebasestorage.app",
  messagingSenderId: "953226048683",
  appId: "1:953226048683:web:4ad85da6f2551730d973ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);