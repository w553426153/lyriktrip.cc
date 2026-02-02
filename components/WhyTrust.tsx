
import React from 'react';
import { WHY_TRUST_DATA } from '../constants';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface WhyTrustProps {
  onOpenConsult: (source: string) => void;
  language: Language;
}

const WhyTrust: React.FC<WhyTrustProps> = ({ onOpenConsult, language }) => {
  const t = TRANSLATIONS[language].whyTrust;
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-blue mb-4">{t.title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
          {WHY_TRUST_DATA.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row min-h-[160px]">
              {/* Left: Pain Point */}
              <div className="flex-1 bg-gray-50 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200">
                <div className="flex items-center space-x-3 text-gray-500 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-semibold text-sm uppercase tracking-wider">{t.concern}</span>
                </div>
                <p className="text-brand-blue font-bold text-lg">{item.pain}</p>
              </div>
              {/* Right: Solution */}
              <div className="flex-1 bg-white p-6 flex flex-col justify-center">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <i className="fa-solid fa-circle-check"></i>
                  <span className="font-semibold text-sm uppercase tracking-wider">{t.solution}</span>
                </div>
                <p className="text-gray-700 mb-4">{item.sol}</p>
                <button 
                  onClick={() => onOpenConsult(`Concern: ${item.pain}`)}
                  className="text-brand-orange font-bold text-sm flex items-center hover:translate-x-1 transition-transform"
                >
                  {t.cta} <i className="fa-solid fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyTrust;
