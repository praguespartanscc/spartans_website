// Plain text written in the admin: a blank line starts a new paragraph, and web links become
// clickable. No HTML from the database is ever rendered.
export default function NewsBody({ text }: { text: string }) {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-5 text-[17px] leading-relaxed text-sand">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split('\n').map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {linkify(line)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function linkify(line: string) {
  const parts = line.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-words text-gold underline underline-offset-4 hover:text-gold-hi">
        {part.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
      </a>
    ) : (
      part
    ),
  );
}

// First sentence or so of a post, for cards and descriptions.
export function excerpt(text: string, max = 180): string {
  const flat = text.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,.]$/, '')}…`;
}
