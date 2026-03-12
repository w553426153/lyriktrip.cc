
import React, { useState } from 'react';
import { SURVIVAL_KITS } from '../constants';
import { SurvivalKit, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface SurvivalKitsProps {
  onOpenConsult: (source: string) => void;
  language: Language;
}

const SurvivalKits: React.FC<SurvivalKitsProps> = ({ onOpenConsult, language }) => {
  const [showModal, setShowModal] = useState<SurvivalKit | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const t = TRANSLATIONS[language].survival;

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setShowModal(null);
      setSubmitted(false);
      setEmail('');
      alert('Check your inbox! The guide is on its way.');
    }, 1500);
  };

  return (
    <section className="py-20 bg-brand-lightBlue">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-brand-blue mb-4">{t.title}</h2>
        <p className="text-gray-600 mb-12">{t.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {SURVIVAL_KITS.map((kit) => (
            <div 
              key={kit.id} 
              className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-2 flex flex-col items-center"
            >
              <span className="text-6xl mb-6">{kit.icon}</span>
              <h3 className="text-xl font-bold text-brand-blue mb-2">{kit.title}</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow">{kit.description}</p>
              <button 
                onClick={() => setShowModal(kit)}
                className="bg-brand-orange text-white px-6 py-2 rounded-md font-bold hover:bg-brand-darkOrange transition-all w-full"
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Butler Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-dashed border-brand-orange rounded-xl p-10 max-w-4xl mx-auto shadow-inner">
          <h3 className="text-2xl font-bold text-brand-blue mb-4">{t.bannerTitle}</h3>
          <p className="text-gray-700 mb-8">{t.bannerSub}</p>
          <button 
            onClick={() => onOpenConsult('Survival Kit Banner')}
            className="bg-brand-orange text-white px-8 py-3 rounded-md font-bold hover:bg-brand-darkOrange transition-all text-lg shadow-lg"
          >
            {t.bannerCTA}
          </button>
        </div>
      </div>

      {/* Modal Lead Gen */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-brand-orange p-6 text-white text-center">
              <h3 className="text-xl font-bold">Get Full {showModal.title} Guide</h3>
              <p className="text-white/80 text-sm">Join 5,000+ travelers exploring China fearlessly.</p>
            </div>
            <div className="p-8">
              <img 
                src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800" 
                alt="Guide Preview" 
                className="w-full h-40 object-cover rounded-lg mb-6 shadow-md"
              />
              <form onSubmit={handleDownload}>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-brand-orange outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={submitted}
                  className={`w-full py-4 rounded-md font-bold text-white transition-all shadow-lg ${
                    submitted ? 'bg-gray-400' : 'bg-brand-orange hover:bg-brand-darkOrange'
                  }`}
                >
                  {submitted ? 'Sending...' : t.cta}
                </button>
              </form>
              <button onClick={() => setShowModal(null)} className="w-full mt-4 text-gray-400 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SurvivalKits;
