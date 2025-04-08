import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the list of available courses
// In a real application, this might come from an API
const availableCourses = [
  'BS in Computer Engineering',
  'BS in Information Technology',
  'BS in Civil Engineering',
  'BS in Mechanical Engineering',
  'BS in Electrical Engineering',
  // Add all other courses offered by CIT-U
];

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // Add registration logic here
    console.log('Register attempt:', { firstName, lastName, email, idNumber, selectedCourse, password });
  };

  // Shared input styling
  const inputClassName = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create an account</h2>
        <p className="mt-1 text-sm text-gray-600">Enter your information to create an account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="John"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Doe"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="registerEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="m.example@cit.edu"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Student ID</label>
          <input
            type="text"
            id="studentId"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            required
            placeholder="23XX-XXXXX"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="program" className="block text-sm font-medium text-gray-700">Program</label>
          <select
            id="program"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className={`${inputClassName} pr-10`}
          >
            <option value="" disabled>Select program</option>
            {availableCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="registerPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClassName}
          />
        </div>

        <div>
          <button
            type="submit"
            style={{ backgroundColor: '#800000' }}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500"
          >
            Register
          </button>
        </div>
      </form>

      <div className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-medium text-maroon-600 hover:text-maroon-500"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default RegisterForm; 