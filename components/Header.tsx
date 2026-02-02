
import React, { useState, useEffect } from 'react';
import { Page, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenConsult: () => void;
  wishlistCount: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onNavigate, 
  onOpenConsult, 
  wishlistCount, 
  language,
  onLanguageChange 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = TRANSLATIONS[language].nav;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClasses = isScrolled 
    ? "bg-white text-brand-blue shadow-md py-3" 
    : "bg-transparent text-white py-5";

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
    { code: 'ru', label: 'RU' }
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${navClasses}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => onNavigate(Page.Home)}
        >
          <span className={`text-2xl font-bold ${isScrolled ? 'text-brand-orange' : 'text-white'}`}>
            Lyrik<span className={isScrolled ? 'text-brand-blue' : 'text-brand-orange'}>Trip</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 font-medium">
          <span 
            className={`cursor-pointer hover:text-brand-orange transition-colors ${currentPage === Page.Destinations ? 'text-brand-orange' : ''}`}
            onClick={() => onNavigate(Page.Destinations)}
          >
            {t.destinations}
          </span>
          <span 
            className={`cursor-pointer hover:text-brand-orange transition-colors ${currentPage === Page.Tours ? 'text-brand-orange' : ''}`}
            onClick={() => onNavigate(Page.Tours)}
          >
            {t.tours}
          </span>
          <span className="cursor-pointer hover:text-brand-orange">{t.about}</span>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-4 border-r pr-4 border-gray-300">
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1 hover:text-brand-orange transition-colors uppercase font-bold text-sm"
              >
                <i className="fa-solid fa-globe"></i> <span>{language}</span>
              </button>
              {showLangMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100 min-w-[80px] animate-scale-in">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-orange-50 transition-colors ${language === lang.code ? 'text-brand-orange font-bold' : 'text-gray-600'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="relative cursor-pointer group"
              onClick={() => onNavigate(Page.Wishlist)}
            >
              <i className={`fa-regular fa-heart text-xl group-hover:text-brand-orange transition-colors ${currentPage === Page.Wishlist ? 'fa-solid text-brand-orange' : ''}`}></i>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => onNavigate(Page.Contact)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isScrolled ? 'text-brand-blue hover:text-brand-orange' : 'text-white hover:text-brand-orange'
            }`}
          >
            {t.contact}
          </button>
          <button 
            onClick={onOpenConsult}
            className="bg-brand-orange text-white px-6 py-2 rounded-md font-bold hover:bg-brand-darkOrange transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t.customTrip}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
