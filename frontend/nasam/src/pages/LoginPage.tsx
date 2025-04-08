import React from 'react';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm'; // We will modify LoginForm later

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <LoginForm />
        </div>
      </main>
      {/* Optional: Add a Footer component here */}
    </div>
  );
};

export default LoginPage; 