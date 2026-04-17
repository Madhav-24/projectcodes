import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDzRBISPsRiHhZcS42TeOlKq7q9lxhfkek',
  authDomain: 'projectdatabase-4491d.firebaseapp.com',
  databaseURL: 'https://projectdatabase-4491d-default-rtdb.firebaseio.com',
  projectId: 'projectdatabase-4491d',
  storageBucket: 'projectdatabase-4491d.firebasestorage.app',
  messagingSenderId: '562156553878',
  appId: '1:562156553878:web:aa40d9c5fbe743566aa4b7',
  measurementId: 'G-007SN3NH2V',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics, firebaseConfig };
export default app;
