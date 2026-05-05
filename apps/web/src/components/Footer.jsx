import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import CookiePreferencesModal from './CookiePreferencesModal.jsx';

const Footer = () => {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Trading Journal</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
            <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <button 
              onClick={() => setIsCookieModalOpen(true)} 
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Trading Journal. All rights reserved.</p>
        </div>
      </div>

      <CookiePreferencesModal 
        isOpen={isCookieModalOpen} 
        onClose={() => setIsCookieModalOpen(false)} 
      />
    </footer>
  );
};

export default Footer;