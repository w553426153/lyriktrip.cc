
import React, { useState } from 'react';
import { WHATSAPP_BUTLER_PHONE_E164, WHATSAPP_DEFAULT_MESSAGE, buildWhatsAppChatUrl } from '../config';

const FloatingContact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappUrl = buildWhatsAppChatUrl(WHATSAPP_BUTLER_PHONE_E164, WHATSAPP_DEFAULT_MESSAGE);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 mb-4 overflow-hidden animate-scale-in w-72">
          <div className="p-4 bg-brand-orange text-white text-center font-bold">
            Chat with Your Local Friend
          </div>
          <div className="p-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"><i className="fa-brands fa-whatsapp"></i></div>
              <div className="flex-1">
                <div className="font-bold text-sm text-brand-blue">Human Butler</div>
                <div className="text-xs text-gray-500">Detailed consultation</div>
              </div>
            </a>
            
            <a href="mailto:hello@lyriktrip.com" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"><i className="fa-solid fa-envelope"></i></div>
              <div className="flex-1">
                <div className="font-bold text-sm text-brand-blue">Email Support</div>
                <div className="text-xs text-gray-500">Replies within 12h</div>
              </div>
            </a>
            
            <div className="p-3 border-t border-gray-100 mt-2">
              <div className="text-[10px] text-gray-400 uppercase font-bold text-center tracking-widest mb-1">Human Service Hours</div>
              <div className="text-xs text-gray-500 text-center">08:00 - 22:00 (GMT+8)</div>
            </div>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl transition-all transform hover:scale-110 ${
          isOpen ? 'bg-brand-blue rotate-90' : 'bg-brand-orange'
        }`}
      >
        {isOpen ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-comments"></i>}
      </button>
    </div>
  );
};

export default FloatingContact;
