
import React, { useState } from 'react';
import { TOURS, DESTINATIONS } from '../constants';

interface SmartFormModalProps {
  onClose: () => void;
  initialSource?: string;
  wishlist: string[];
}

const SmartFormModal: React.FC<SmartFormModalProps> = ({ onClose, initialSource, wishlist }) => {
  const [step, setStep] = useState(0); // 0 is Intro, 1-4 are Questions, 5 is Contact, 6 is Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    q1: '', // Payment
    q2: '', // Network
    q3: '', // Language
    destinations: [] as string[],
    name: '',
    email: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleDestination = (d: string) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.includes(d) 
        ? prev.destinations.filter(x => x !== d) 
        : [...prev.destinations, d]
    }));
  };

  const getOptionLabel = (q: string, id: string) => {
    const options: Record<string, Record<string, string>> = {
      q1: { 
        'A': 'Cash/Credit Card (Unprepared)', 
        'B': 'Apple/Google Pay (Partial)', 
        'C': 'Alipay/WeChat Pay (Ready)' 
      },
      q2: { 
        'A': 'Digital Detox', 
        'B': 'Hotel Wi-Fi/Roaming (Partial)', 
        'C': 'VPN/eSIM (Ready)' 
      },
      q3: { 
        'A': 'English on Phone', 
        'B': 'Google Translate', 
        'C': 'Bilingual Cards/Maps (Ready)' 
      },
      dest: {
        'A': 'Great Wall / Terracotta Warriors',
        'B': 'Shanghai & Water Towns',
        'C': 'Pandas or Nature',
        'D': 'Undecided'
      }
    };
    return options[q][id] || id;
  };

  const getWishlistSummary = () => {
    if (!wishlist || wishlist.length === 0) return "Empty";

    const savedTours: string[] = [];
    const savedPlaces: string[] = [];
    const savedFoods: string[] = [];

    wishlist.forEach(id => {
      // Check Tours
      const tour = TOURS.find(t => t.id === id);
      if (tour) {
        savedTours.push(tour.title);
        return;
      }

      // Check Destinations (Attractions and Foods)
      DESTINATIONS.forEach(dest => {
        const attr = (dest.attractions || []).find(a => a.id === id);
        if (attr) savedPlaces.push(`${attr.name} (${dest.name})`);

        const food = (dest.famousFoods || []).find(f => f.id === id);
        if (food) savedFoods.push(`${food.name} (${dest.name})`);
      });
    });

    const parts = [];
    if (savedTours.length > 0) parts.push(`Tours: [${savedTours.join(', ')}]`);
    if (savedPlaces.length > 0) parts.push(`Places: [${savedPlaces.join(', ')}]`);
    if (savedFoods.length > 0) parts.push(`Foods: [${savedFoods.join(', ')}]`);

    return parts.join(' | ') || "No recognizable items";
  };

  const handleSubmit = async () => {
    if (!formData.email) return;

    setIsSubmitting(true);

    // Format the message for the webhook (Quiz Results)
    const destinationsList = formData.destinations.map(d => getOptionLabel('dest', d)).join(', ');
    const message = `
China Readiness Quiz Result:
- Payment: ${getOptionLabel('q1', formData.q1)}
- Network: ${getOptionLabel('q2', formData.q2)}
- Language: ${getOptionLabel('q3', formData.q3)}
- Must-Visit Destinations: ${destinationsList}
- Source: ${initialSource || 'Quiz'}
- User Name: ${formData.name || 'Anonymous'}
    `.trim();

    // Get the wishlist summary
    const wishlistSummary = getWishlistSummary();

    try {
      // Send to our server-side proxy to avoid exposing the Feishu webhook URL in the browser.
      const res = await fetch('/api/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          email: formData.email,
          wishlist: wishlistSummary
        }),
      });
      if (!res.ok) {
        const details = await res.text().catch(() => '');
        throw new Error(`Feishu proxy failed: ${res.status} ${details}`);
      }
    } catch (error) {
      console.error('Webhook failed:', error);
    } finally {
      setIsSubmitting(false);
      nextStep();
    }
  };

  const calculateScore = () => {
    let score = 0;
    [formData.q1, formData.q2, formData.q3].forEach(ans => {
      if (ans === 'C') score += 33;
      else if (ans === 'B') score += 15;
      else if (ans === 'A') score += 5;
    });
    return Math.min(Math.round(score), 100);
  };

  const score = calculateScore();
  const getStatus = () => {
    if (score > 80) return { label: 'China Ready!', color: 'text-green-500', icon: 'fa-check-circle' };
    if (score > 50) return { label: 'Moderate Prep Needed', color: 'text-yellow-500', icon: 'fa-info-circle' };
    return { label: 'High Anxiety Risk', color: 'text-red-500', icon: 'fa-triangle-exclamation' };
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-brand-blue transition-colors z-20">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>

        {step > 0 && step < 6 && (
          <div className="flex bg-gray-50 border-b border-gray-100">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`flex-1 h-1.5 transition-all ${step >= s ? 'bg-brand-orange' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        )}

        <div className="p-8 md:p-12">
          {step === 0 && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-orange-50 text-brand-orange rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                <i className="fa-solid fa-passport"></i>
              </div>
              <h2 className="text-3xl font-bold text-brand-blue mb-4">Are you ready for China? 🇨🇳</h2>
              <p className="text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto">
                90% of first-time travelers face payment or connection issues. Take this 45-second quiz to get your personalized <span className="text-brand-orange font-bold">Survival Score and Checklist</span>.
              </p>
              <button 
                onClick={nextStep}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-darkOrange shadow-lg transition-all"
              >
                Start Quiz
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">💳</span>
                <h3 className="text-xl font-bold text-brand-blue">Q1. Payment Guide</h3>
              </div>
              <p className="text-gray-600 mb-8 font-medium">How do you plan to pay for a taxi or a bottle of water in China?</p>
              <div className="space-y-4 mb-10">
                {[
                  { id: 'A', label: 'Cash (EUR/CNY) / Credit Card (Visa/Mastercard)' },
                  { id: 'B', label: 'Apple Pay / Google Pay' },
                  { id: 'C', label: 'Alipay / WeChat Pay (Already set up)' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => { setFormData({...formData, q1: opt.id}); nextStep(); }}
                    className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center ${
                      formData.q1 === opt.id ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-gray-100 hover:border-brand-orange/30'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold ${formData.q1 === opt.id ? 'border-brand-orange bg-brand-orange text-white' : 'border-gray-200 text-gray-400'}`}>
                      {opt.id}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">📶</span>
                <h3 className="text-xl font-bold text-brand-blue">Q2. Network Kit</h3>
              </div>
              <p className="text-gray-600 mb-8 font-medium">Do you need access to Google Maps, WhatsApp, Instagram, or Gmail while traveling?</p>
              <div className="space-y-4 mb-10">
                {[
                  { id: 'A', label: 'No, I’m doing a digital detox.' },
                  { id: 'B', label: 'Yes, I will use the hotel Wi-Fi or local roaming.' },
                  { id: 'C', label: 'Yes, I have a VPN or eSIM specifically for China' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => { setFormData({...formData, q2: opt.id}); nextStep(); }}
                    className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center ${
                      formData.q2 === opt.id ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-gray-100 hover:border-brand-orange/30'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold ${formData.q2 === opt.id ? 'border-brand-orange bg-brand-orange text-white' : 'border-gray-200 text-gray-400'}`}>
                      {opt.id}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={prevStep} className="text-gray-400 font-bold hover:text-brand-blue">Back</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">🗣️</span>
                <h3 className="text-xl font-bold text-brand-blue">Q3. Language Pack & Safety</h3>
              </div>
              <p className="text-gray-600 mb-8 font-medium">If you get lost and the taxi driver doesn't speak English, what will you do?</p>
              <div className="space-y-4 mb-10">
                {[
                  { id: 'A', label: 'Show them the hotel name in English on my phone.' },
                  { id: 'B', label: 'Use Google Translate.' },
                  { id: 'C', label: 'I have a bilingual address card or a specialized Chinese map app.' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => { setFormData({...formData, q3: opt.id}); nextStep(); }}
                    className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center ${
                      formData.q3 === opt.id ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-gray-100 hover:border-brand-orange/30'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold ${formData.q3 === opt.id ? 'border-brand-orange bg-brand-orange text-white' : 'border-gray-200 text-gray-400'}`}>
                      {opt.id}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={prevStep} className="text-gray-400 font-bold hover:text-brand-blue">Back</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">🗺️</span>
                <h3 className="text-xl font-bold text-brand-blue">Q4. Destinations</h3>
              </div>
              <p className="text-gray-600 mb-8 font-medium">Which destinations are on your "Must-Visit" list? (Select all that apply)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {[
                  { id: 'A', label: 'Great Wall / Terracotta Warriors' },
                  { id: 'B', label: 'Shanghai & Water Towns' },
                  { id: 'C', label: 'Pandas or Nature Landscapes' },
                  { id: 'D', label: 'Haven\'t decided yet' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => toggleDestination(opt.id)}
                    className={`p-4 text-left rounded-2xl border-2 transition-all flex items-center ${
                      formData.destinations.includes(opt.id) ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-gray-100 hover:border-brand-orange/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${formData.destinations.includes(opt.id) ? 'bg-brand-orange text-white' : 'border-2 border-gray-200'}`}>
                      {formData.destinations.includes(opt.id) && <i className="fa-solid fa-check text-xs"></i>}
                    </div>
                    <span className="text-sm font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex space-x-4">
                <button onClick={prevStep} className="flex-1 border-2 border-gray-100 text-gray-400 py-4 rounded-xl font-bold">Back</button>
                <button 
                  onClick={nextStep} 
                  disabled={formData.destinations.length === 0}
                  className="flex-2 bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-darkOrange shadow-lg transition-all w-2/3 disabled:opacity-50"
                >
                  Next: Get Score
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-brand-blue mb-4">Final Step: Receive Your Results</h2>
              <p className="text-gray-600 mb-8">Enter your email to calculate your final survival score and receive your custom China Travel Checklist.</p>
              
              <div className="space-y-4 mb-10">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    required
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all ${
                      formData.email && !isEmailValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  {formData.email && !isEmailValid && (
                    <p className="text-red-500 text-[10px] mt-1 font-bold">Please enter a valid email address.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button onClick={prevStep} className="flex-1 border-2 border-gray-100 text-gray-400 py-4 rounded-xl font-bold">Back</button>
                <button 
                  onClick={handleSubmit}
                  disabled={!isEmailValid || isSubmitting}
                  className="flex-2 bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-darkOrange shadow-lg transition-all w-2/3 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i> Generating...</>
                  ) : (
                    'Submit & View Score'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="text-center py-4 animate-scale-in">
              <h2 className="text-3xl font-bold text-brand-blue mb-8">Your Travel Readiness</h2>
              
              <div className="relative w-48 h-48 mx-auto mb-10">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-gray-100"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`stroke-current ${score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`}
                    strokeWidth="3"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-5xl font-extrabold text-brand-blue">{score}%</span>
                   <span className="text-[10px] uppercase font-bold text-gray-400">Score</span>
                </div>
              </div>

              <div className={`text-xl font-bold mb-6 flex items-center justify-center space-x-2 ${getStatus().color}`}>
                <i className={`fa-solid ${getStatus().icon}`}></i>
                <span>{getStatus().label}</span>
              </div>

              <p className="text-gray-500 mb-10 leading-relaxed max-sm mx-auto">
                {score < 60 
                  ? "Based on your answers, you might struggle with basic logistics in China. Don't worry, we've sent a survival checklist to your email!" 
                  : "You're off to a good start! We've sent a detailed checklist to your email to help you finalize those last few details."}
              </p>

              <div className="bg-brand-blue rounded-2xl p-6 text-white text-left mb-8">
                <h4 className="font-bold mb-2">Next Steps for You:</h4>
                <ul className="text-sm space-y-2 opacity-90">
                  <li>• Check <strong>{formData.email}</strong> for the checklist</li>
                  <li>• Schedule a free 15-min chat with a local butler</li>
                  <li>• Get your Alipay verified within 48 hours</li>
                </ul>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold shadow-lg hover:bg-brand-darkOrange transition-all"
              >
                Close & Explore Guides
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartFormModal;
