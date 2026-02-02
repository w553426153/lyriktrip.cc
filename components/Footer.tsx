
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface FooterProps {
  language: Language;
}

const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = TRANSLATIONS[language].footer;
  const nav = TRANSLATIONS[language].nav;
  
  return (
    <footer className="bg-brand-blue text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <span className="text-2xl font-bold text-white mb-6 block">
              Lyrik<span className="text-brand-orange">Trip</span>
            </span>
            <p className="text-gray-400 mb-6 max-w-sm">
              {t.about}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-colors"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-colors"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-colors"><i className="fa-brands fa-whatsapp"></i></a>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-brand-orange">{nav.destinations}</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Beijing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shanghai</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Xi'an</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guilin & Yangshuo</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-brand-orange">{t.support}</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Booking Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Payment Methods</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-bold text-red-400">24/7 Emergency: +86 138 0000 0000</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-brand-orange">{t.contact}</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start space-x-3">
                <i className="fa-solid fa-location-dot mt-1 text-brand-orange"></i>
                <span>Chaoyang District, Beijing, China</span>
              </li>
              <li className="flex items-center space-x-3">
                <i className="fa-solid fa-envelope text-brand-orange"></i>
                <span>hello@lyriktrip.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>© 2024 LyrikTrip Travel Co., Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
