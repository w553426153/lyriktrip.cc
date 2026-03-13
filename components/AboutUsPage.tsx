import React, { useMemo } from 'react';
import LegalPage from './LegalPage';
import aboutContentRaw from '../data/about_us.md?raw';

const normalizeAboutContent = (content: string) => {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\*(.*?)\*/g, '$1')
    .split('\n')
    .map((line) => line.replace(/^#{1,6}\s+/, '').trimEnd())
    .filter((line) => !/^---+$/.test(line.trim()))
    .join('\n');
};

const AboutUsPage: React.FC = () => {
  const content = useMemo(() => normalizeAboutContent(aboutContentRaw), [aboutContentRaw]);

  return (
    <LegalPage
      title="About Us"
      subtitle="How we keep payment clear, support steady, and travel decisions confident."
      heroImage="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1600"
      content={content}
    />
  );
};

export default AboutUsPage;
