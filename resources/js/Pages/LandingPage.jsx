import React from 'react';
import { router } from '@inertiajs/react';
import { AccountCircle, AdminPanelSettings, Work } from '@mui/icons-material';

const LandingPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/imgs/logo-main.png"
            alt="Logo"
            className="mx-auto w-full sm:w-40 md:w-80"
          />
        </div>
        {/* Card */}
        <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 sm:p-8 md:p-10 w-full max-w-2xl mx-auto">
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            {/* Log in as Owner Button */}
            <button
              className="w-full sm:w-auto px-6 py-4 bg-white text-black text-lg sm:text-xl font-semibold rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-200 transition duration-300"
              onClick={() => router.visit('/owner/login')}
            >
              <AccountCircle fontSize="large" />
              <span>Log in as Owner</span>
            </button>
            {/* Log in as Admin Button */}
            <button
              className="w-full sm:w-auto px-6 py-4 bg-white text-black text-lg sm:text-xl font-semibold rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-200 transition duration-300"
              onClick={() => router.visit('/admin/login')}
            >
              <AdminPanelSettings fontSize="large" />
              <span>Log in as Manager</span>
            </button>
            {/* Log in as Staff Button */}
            <button
              className="w-full sm:w-auto px-6 py-4 bg-white text-black text-lg sm:text-xl font-semibold rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-200 transition duration-300"
              onClick={() => router.visit('/staff/login')}
            >
              <Work fontSize="large" />
              <span>Log in as Staff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
