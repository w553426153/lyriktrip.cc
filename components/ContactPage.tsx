
import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1600" 
          alt="Contact Support" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-blue/60 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center text-white px-6 mt-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">We're Here to Help</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">Whether it's trip planning or an on-trip emergency, our team is your reliable partner in China.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-brand-lightBlue p-8 rounded-2xl text-center border border-gray-100 hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-brand-orange text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-6 shadow-md"><i className="fa-brands fa-whatsapp"></i></div>
            <h3 className="text-xl font-bold text-brand-blue mb-4">Chat on WhatsApp</h3>
            <p className="text-gray-600 mb-6 text-sm">Fastest for quick questions and real-time support.</p>
            <a href="#" className="inline-block bg-brand-orange text-white px-6 py-2 rounded-md font-bold hover:bg-brand-darkOrange transition-all">Start Chat</a>
          </div>
          <div className="bg-brand-lightBlue p-8 rounded-2xl text-center border border-gray-100 hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-6 shadow-md"><i className="fa-solid fa-envelope"></i></div>
            <h3 className="text-xl font-bold text-brand-blue mb-4">Email Us</h3>
            <p className="text-gray-600 mb-6 text-sm">Best for itinerary details and booking documents.</p>
            <a href="mailto:hello@lyriktrip.com" className="inline-block bg-brand-blue text-white px-6 py-2 rounded-md font-bold hover:bg-gray-800 transition-all">hello@lyriktrip.com</a>
          </div>
          <div className="bg-brand-lightBlue p-8 rounded-2xl text-center border border-gray-100 hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-6 shadow-md"><i className="fa-solid fa-phone"></i></div>
            <h3 className="text-xl font-bold text-brand-blue mb-4">24/7 Hotline</h3>
            <p className="text-gray-600 mb-6 text-sm">Strictly for emergencies while you are in China.</p>
            <a href="tel:+8613800000000" className="inline-block bg-red-500 text-white px-6 py-2 rounded-md font-bold hover:bg-red-600 transition-all">+86 138 0000 0000</a>
          </div>
        </div>

        {/* Butlers */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-brand-blue mb-12 text-center">Meet Your Butlers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Sarah', role: 'Chief Planner', img: 'https://i.pravatar.cc/150?u=sarah' },
              { name: 'Michael', role: 'Support Specialist', img: 'https://i.pravatar.cc/150?u=michael' },
              { name: 'Lisa', role: 'Cultural Expert', img: 'https://i.pravatar.cc/150?u=lisa2' },
              { name: 'Jason', role: 'Logistics Manager', img: 'https://i.pravatar.cc/150?u=jason' }
            ].map((butler, i) => (
              <div key={i} className="text-center group">
                <div className="relative mb-4 inline-block">
                   <img src={butler.img} alt={butler.name} className="w-32 h-32 rounded-full mx-auto shadow-md border-4 border-white group-hover:border-brand-orange transition-all" />
                   <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                </div>
                <h4 className="font-bold text-brand-blue text-lg">{butler.name}</h4>
                <p className="text-gray-500 text-sm">{butler.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl p-10 border border-gray-200">
          <h2 className="text-2xl font-bold text-brand-blue mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <details className="group border-b border-gray-200 pb-4">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-brand-blue hover:text-brand-orange">
                How soon will I get my survival kit?
                <span className="group-open:rotate-180 transition-transform"><i className="fa-solid fa-chevron-down"></i></span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">Instantly! After entering your email on the survival kit section, the download link will appear and a copy will be sent to your inbox.</p>
            </details>
            <details className="group border-b border-gray-200 pb-4">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-brand-blue hover:text-brand-orange">
                Do I need to pay immediately for a tour?
                <span className="group-open:rotate-180 transition-transform"><i className="fa-solid fa-chevron-down"></i></span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">No. Our process is "Consultation-First". You talk to a butler to finalize details, and then we send a Stripe payment link for a 20% deposit.</p>
            </details>
            <details className="group border-b border-gray-200 pb-4">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-brand-blue hover:text-brand-orange">
                What if I want to cancel my trip?
                <span className="group-open:rotate-180 transition-transform"><i className="fa-solid fa-chevron-down"></i></span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">We offer a full refund if you cancel 30 days before departure. If government restrictions or airline cancellations occur, we also provide flexible refund/credit options.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
