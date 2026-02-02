
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface HeroProps {
  onStartQuiz: () => void;
  language: Language;
}

const Hero: React.FC<HeroProps> = ({ onStartQuiz, language }) => {
  const t = TRANSLATIONS[language].hero;
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1529921879218-f99546d03a9d?auto=format&fit=crop&q=80&w=1920" 
          alt="Great Wall of China" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in drop-shadow-2xl">
          {t.title}
        </h1>
        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
          {t.subtitle}
        </p>
        
        <button 
          onClick={onStartQuiz}
          className="bg-brand-orange text-white text-lg font-bold px-10 py-4 rounded-full shadow-2xl hover:bg-brand-darkOrange transition-all animate-pulse-slow transform hover:scale-105"
        >
          {t.cta}
        </button>

        <div className="mt-8 flex items-center justify-center space-x-2 text-white/90">
          <span className="text-lg">🛡️</span>
          <span className="text-sm md:text-base font-medium">{t.trust}</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <i className="fa-solid fa-chevron-down text-white text-2xl"></i>
      </div>
    </section>
  );
};

export default Hero;
