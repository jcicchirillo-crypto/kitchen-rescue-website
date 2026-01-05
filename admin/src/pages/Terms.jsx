import { BUSINESS } from "../config/business";
import { TERMS_MARKDOWN } from "../content/terms";

export default function TermsPage() {
  // Process markdown template string with business info
  const processedContent = TERMS_MARKDOWN
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) {
        return `<h1 class="text-3xl font-bold mt-8 mb-4">${line.substring(2)}</h1>`;
      }
      if (line.startsWith('## ')) {
        return `<h2 class="text-xl font-semibold mt-6 mb-3">${line.substring(3)}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-lg font-semibold mt-4 mb-2">${line.substring(4)}</h3>`;
      }
      if (line.startsWith('- ')) {
        return `<li class="ml-6">${line.substring(2)}</li>`;
      }
      if (line.trim() === '') {
        return '';
      }
      return `<p class="mt-2">${line}</p>`;
    })
    .join('\n')
    .replace(/(<li[^>]*>.*?<\/li>)/g, (match, p1, offset, string) => {
      // Wrap consecutive list items in <ul>
      const prev = string.substring(Math.max(0, offset - 50), offset);
      const next = string.substring(offset + match.length, offset + match.length + 50);
      if (!prev.includes('<ul') && !prev.includes('</ul>')) {
        return `<ul class="list-disc pl-6 mt-2">${match}`;
      }
      if (!next.includes('<li') && !next.includes('<ul')) {
        return `${match}</ul>`;
      }
      return match;
    });

  return (
    <div id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10">
      <div 
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
}
