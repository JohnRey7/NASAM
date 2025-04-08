import React from 'react';
import Header from '../components/Header';
import RegisterForm from '../components/RegisterForm'; // We will modify RegisterForm later

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <RegisterForm />
        </div>
      </main>
      {/* Optional: Add a Footer component here */}
    </div>
  );
};

export default RegisterPage; 