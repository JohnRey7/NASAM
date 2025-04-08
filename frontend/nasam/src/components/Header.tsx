import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa'; // User icon

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' }, // Assuming these paths
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side navigation links */}
        <div className="flex items-center space-x-6">
          {/* Optional: Add a Logo here if needed */}
          {/* <Link to="/" className="text-xl font-bold text-gray-800">NAS App</Link> */}
          <ul className="flex space-x-6">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`text-gray-600 hover:text-gray-900 ${location.pathname === item.path ? 'font-semibold' : ''}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/login')}
            className={`px-4 py-1 rounded text-sm font-medium ${location.pathname === '/login'
                ? 'bg-gray-200 text-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{ backgroundColor: location.pathname === '/register' ? '#660000' : '#800000' }} // Darker maroon on active
            className="px-4 py-1 rounded text-sm font-medium text-white hover:bg-opacity-90"
          >
            Register
          </button>
          <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <FaUserCircle size={24} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header; 