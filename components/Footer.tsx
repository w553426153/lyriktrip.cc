
import React from 'react';
import { Language, Page } from '../types';
import { TRANSLATIONS } from '../translations';

interface FooterProps {
  language: Language;
  onNavigate: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ language, onNavigate }) => {
  const t = TRANSLATIONS[language].footer;
  
  return (
    <footer className="bg-brand-blue text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <span className="text-2xl font-bold text-white mb-6 block">
              Lyrik<span className="text-brand-orange">Trip</span>
            </span>
            <p className="text-gray-400 mb-6 max-w-sm">
              {t.about}
            </p>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-brand-orange">{t.support}</h4>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(Page.PrivacyPolicy);
                  }}
                  className="hover:text-white transition-colors"
                >
                  {t.privacy}
                </a>
              </li>
              <li>
                <a
                  href="/booking-terms"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(Page.BookingTerms);
                  }}
                  className="hover:text-white transition-colors"
                >
                  {t.bookingTerms}
                </a>
              </li>
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
                <span>media@lyriktrip.com</span>
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
