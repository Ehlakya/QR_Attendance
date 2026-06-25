import React from 'react';

// Suppress React DevTools informational log
const originalInfo = console.info;
console.info = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('React DevTools')) return;
  originalInfo(...args);
};
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from './context/ThemeContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster position="top-right" />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
)
