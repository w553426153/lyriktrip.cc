
import React from 'react';
import { SERVICE_TIERS } from '../constants';

interface ServiceTiersProps {
  onOpenConsult: (source: string) => void;
}

const ServiceTiers: React.FC<ServiceTiersProps> = ({ onOpenConsult }) => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-blue mb-4">Choose Your Level of Support</h2>
          <p className="text-gray-600">From self-help tools to dedicated in-trip support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SERVICE_TIERS.map((tier) => (
            <div 
              key={tier.id} 
              className={`relative rounded-2xl p-8 flex flex-col transition-all shadow-md hover:shadow-2xl ${
                tier.popular 
                  ? 'border-2 border-brand-orange bg-white scale-105 z-10' 
                  : 'border border-gray-200 bg-gray-50'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-brand-blue mb-4">{tier.name}</h3>
                <div className="flex items-end space-x-2">
                  <span className="text-4xl font-extrabold text-brand-orange">{tier.price}</span>
                  {tier.oldPrice && <span className="text-lg text-gray-400 line-through mb-1">{tier.oldPrice}</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3 text-gray-700">
                    <i className="fa-solid fa-check text-brand-orange mt-1"></i>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => onOpenConsult(`Tier: ${tier.name}`)}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  tier.popular 
                    ? 'bg-brand-orange text-white hover:bg-brand-darkOrange shadow-lg' 
                    : 'border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 italic mb-4">💰 Transparent pricing. No hidden fees.</p>
          <button 
            onClick={() => onOpenConsult('Consultation')}
            className="text-brand-blue font-bold border-b-2 border-brand-orange hover:text-brand-orange transition-colors"
          >
            Not sure which fits? Ask a Butler
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServiceTiers;
