import React, { useMemo } from 'react';

interface LegalPageProps {
  title: string;
  subtitle: string;
  heroImage: string;
  content: string;
}

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

const HEADING_STOP_WORDS = new Set([
  'and',
  'or',
  'the',
  'a',
  'an',
  'of',
  'in',
  'to',
  'for',
  'with',
  'on',
  'at',
  'by',
  'from',
  'as'
]);

const normalizeContent = (content: string, title: string) => {
  let text = content.replace(/\r\n/g, '\n').trim();
  const firstLine = text.split('\n')[0]?.trim();
  if (firstLine && firstLine.toLowerCase() === title.toLowerCase()) {
    text = text.split('\n').slice(1).join('\n').replace(/^\n+/, '');
  }
  return text;
};

const isHeadingLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/[\[\]{}]/.test(trimmed)) return false;
  if (trimmed.length > 80) return false;
  if (/[.?!]$/.test(trimmed)) return false;
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (trimmed === trimmed.toUpperCase()) return true;

  const words = trimmed.split(/\s+/);
  return words.every((word) => {
    const cleaned = word.replace(/[^A-Za-z]/g, '');
    if (!cleaned) return true;
    if (cleaned === cleaned.toUpperCase()) return true;
    if (HEADING_STOP_WORDS.has(cleaned.toLowerCase())) return true;
    return /^[A-Z]/.test(cleaned);
  });
};

const toBlocks = (content: string): ContentBlock[] => {
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: 'paragraph', lines: [...paragraphBuffer] });
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listType && listBuffer.length > 0) {
      blocks.push({ type: listType, items: [...listBuffer] });
    }
    listBuffer = [];
    listType = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (isHeadingLine(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: trimmed });
      return;
    }

    if (/^-+\s+/.test(trimmed)) {
      if (listType && listType !== 'ul') flushList();
      if (!listType) listType = 'ul';
      listBuffer.push(trimmed.replace(/^-+\s+/, ''));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType && listType !== 'ol') flushList();
      if (!listType) listType = 'ol';
      listBuffer.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    if (listType) flushList();
    paragraphBuffer.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
};

const LegalPage: React.FC<LegalPageProps> = ({ title, subtitle, heroImage, content }) => {
  const blocks = useMemo(() => {
    const normalized = normalizeContent(content, title);
    return toBlocks(normalized);
  }, [content, title]);

  return (
    <div className="bg-white min-h-screen">
      <div className="relative h-[36vh] flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand-blue/60 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center text-white px-6 mt-16">
          <p className="uppercase tracking-[0.3em] text-xs font-semibold text-white/80 mb-4">LyrikTrip</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">{subtitle}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
          <div className="space-y-6">
            {blocks.map((block, index) => {
              if (block.type === 'heading') {
                return (
                  <h2 key={`heading-${index}`} className="text-2xl md:text-3xl font-bold text-brand-blue pt-6 first:pt-0">
                    {block.text}
                  </h2>
                );
              }

              if (block.type === 'ul') {
                return (
                  <ul key={`ul-${index}`} className="list-disc pl-6 space-y-2 text-gray-700 leading-7">
                    {block.items.map((item, itemIndex) => (
                      <li key={`ul-item-${index}-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                );
              }

              if (block.type === 'ol') {
                return (
                  <ol key={`ol-${index}`} className="list-decimal pl-6 space-y-2 text-gray-700 leading-7">
                    {block.items.map((item, itemIndex) => (
                      <li key={`ol-item-${index}-${itemIndex}`}>{item}</li>
                    ))}
                  </ol>
                );
              }

              return (
                <p key={`p-${index}`} className="text-gray-700 leading-7">
                  {block.lines.map((line, lineIndex) => (
                    <React.Fragment key={`line-${index}-${lineIndex}`}>
                      {line}
                      {lineIndex < block.lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
