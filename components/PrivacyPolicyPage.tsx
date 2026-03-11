import React from 'react';
import LegalPage from './LegalPage';
import privacyPolicyContent from '../data/privacy_policy.md?raw';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="Learn how we collect, use, and protect your personal information."
      heroImage="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1600"
      content={privacyPolicyContent}
    />
  );
};

export default PrivacyPolicyPage;
