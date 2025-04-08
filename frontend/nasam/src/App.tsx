import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Import LoginPage
import RegisterPage from './pages/RegisterPage'; // Import RegisterPage
import './App.css'; // Keep existing App styles if any

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} /> {/* Redirect root to login */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Add routes for Home, About, FAQ, Contact if they will have separate pages */}
      {/* Example: <Route path="/about" element={<AboutPage />} /> */}

      {/* Catch-all or 404 route (optional) */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App; 