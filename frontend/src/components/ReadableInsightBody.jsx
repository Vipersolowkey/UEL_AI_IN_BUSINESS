import { useMemo } from "react";

import { splitLongInsightText } from "../lib/splitLongInsightText";

function ModelTag({ modelUsed }) {
  if (!modelUsed) return null;
  return (
    <p className="mt-5 border-t border-[rgba(30,42,36,0.08)] pt-4">
      <span className="inline-flex items-center rounded-full border border-[rgba(61,122,106,0.25)] bg-[rgba(61,122,106,0.08)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--earth-secondary)]">
        Model · {modelUsed}
      </span>
    </p>
  );
}

export default function ReadableInsightBody({ text, modelUsed, className = "" }) {
  const parsed = useMemo(() => splitLongInsightText(text), [text]);

  if (parsed.kind === "empty") {
    return <p className={`text-sm text-[var(--earth-text-subtle)] ${className}`}>Chưa có nội dung phân tích.</p>;
  }

  if (parsed.kind === "bullets") {
    return (
      <div className={className}>
        <ul className="space-y-2.5">
          {parsed.items.map((item, index) => (
            <li
              key={index}
              className="flex gap-3 rounded-[18px] border border-[rgba(30,42,36,0.07)] bg-[rgba(255,255,255,0.72)] px-4 py-3 shadow-[0_2px_8px_rgba(30,42,36,0.04)]"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--earth-primary)] ring-4 ring-[rgba(184,90,50,0.12)]"
                aria-hidden
              />
              <span className="min-w-0 text-[0.9375rem] font-medium leading-relaxed text-[var(--earth-text)]">{item}</span>
            </li>
          ))}
        </ul>
        <ModelTag modelUsed={modelUsed} />
      </div>
    );
  }

  if (parsed.kind === "paragraphs") {
    return (
      <div className={`space-y-4 ${className}`}>
        {parsed.items.map((block, index) => (
          <p
            key={index}
            className="text-[0.9375rem] font-medium leading-[1.75] text-[var(--earth-text)] first:text-[1rem] first:leading-[1.72] first:tracking-tight"
          >
            {block}
          </p>
        ))}
        <ModelTag modelUsed={modelUsed} />
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-[0.9375rem] font-medium leading-[1.75] text-[var(--earth-text)]">{parsed.items[0]}</p>
      <ModelTag modelUsed={modelUsed} />
    </div>
  );
}
