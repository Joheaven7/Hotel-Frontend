import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 text-lg mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary inline-flex gap-2">
          <Home size={20} />
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;