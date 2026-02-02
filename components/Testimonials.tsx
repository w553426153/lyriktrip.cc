
import React from 'react';
import { TESTIMONIALS } from '../constants';

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-blue mb-4">What Our Travelers Say</h2>
          <p className="text-gray-600">Real stories from real people who explored China with us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex items-center space-x-4 mb-6">
                <img src={t.avatar} alt={t.user} className="w-14 h-14 rounded-full border-2 border-brand-orange p-0.5" />
                <div>
                  <h4 className="font-bold text-brand-blue">{t.user}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="font-medium">{t.country}</span>
                    <span className="text-brand-orange">|</span>
                    <span className="italic">{t.tourName}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6 flex-grow relative">
                <i className="fa-solid fa-quote-left absolute -left-4 -top-4 text-brand-orange/20 text-4xl"></i>
                <p className="text-gray-700 italic leading-relaxed z-10 relative">"{t.story}"</p>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                <div className="text-xs font-bold text-brand-orange uppercase tracking-widest">{t.category}</div>
                <div className="flex text-yellow-500 text-xs">
                  {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="bg-brand-orange text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-brand-darkOrange transition-all hover:scale-105">
            Book Your Worry-Free Experience
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
