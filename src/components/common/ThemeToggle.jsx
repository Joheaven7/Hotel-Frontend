import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B705] ${className}`}
      aria-label="Toggle Theme"
    >
      <div className="absolute inset-0 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full transition-colors duration-300"></div>
      
      <div className="relative z-10 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun size={20} className="text-[#F2B705] animate-fade-in" />
        ) : (
          <Moon size={20} className="text-[#0F5B4F] animate-fade-in" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
