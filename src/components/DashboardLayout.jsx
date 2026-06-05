import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useLocation } from 'react-router-dom';
import ChatWidget from './chat/ChatWidget';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-text-primary">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden pointer-events-auto"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 z-10 relative ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
      >
        {/* Top Navbar */}
        <TopNavbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar relative z-0 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>

      {/* Floating Real-Time Support Chat Wire for Customers */}
      <ChatWidget />
    </div>
  );
};

export default DashboardLayout;