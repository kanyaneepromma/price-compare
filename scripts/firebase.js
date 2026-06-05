// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDf-1z_Vt3JMOaqSRxsJVI7dy7AUFlYfuU",
    authDomain: "digital-tarot-reader.firebaseapp.com",
    projectId: "digital-tarot-reader",
    storageBucket: "digital-tarot-reader.firebasestorage.app",
    messagingSenderId: "877580666601",
    appId: "1:877580666601:web:c823df201ade5efafed278",
    measurementId: "G-27XDBFETW7"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);