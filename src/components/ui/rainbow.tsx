"use client";

import React from "react";
import {commentColor, functionColor, numberColor, objectColor, selectorColor} from "~/components/ui/highlight";

interface RainbowBracesProps {
  json: object | string;
  className?: string;
}

const BRACE_COLORS = [
  "text-red-400",
  "text-orange-400",
  "text-amber-400",
  "text-yellow-400",
  "text-lime-400",
  "text-green-400",
  "text-emerald-400",
  "text-teal-400",
  "text-cyan-400",
  "text-sky-400",
  "text-blue-400",
  "text-indigo-400",
  "text-violet-400",
  "text-purple-400",
  "text-fuchsia-400",
  "text-pink-400",
  "text-rose-400",
  "text-slate-400",
  "text-gray-400",
  "text-zinc-400",
  "text-neutral-400",
  "text-stone-400",
];

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const formatJsonWithRainbowBraces = (obj: any, indent = 0): React.ReactNode[] => {
  const colorIndex = indent % BRACE_COLORS.length;
  const color = BRACE_COLORS[colorIndex];
  const nextColor = BRACE_COLORS[(indent + 1) % BRACE_COLORS.length];

  if (typeof obj === 'string') {
    return [<span key="string" className={`${objectColor}`}>"{obj}"</span>];
  }

  if (typeof obj === 'number') {
    return [<span key="number" className={`${numberColor}`}>{obj}</span>];
  }

  if (typeof obj === 'boolean') {
    return [<span key="boolean" className={`${functionColor}`}>{obj.toString()}</span>];
  }

  if (obj === null) {
    return [<span key="null" className={`${commentColor}`}>null</span>];
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return [
        <span key="open" className={color}>[</span>,
        <span key="close" className={color}>]</span>
      ];
    }

    const elements: React.ReactNode[] = [];
    elements.push(<span key="open" className={color}>[</span>);
      elements.push(<br key="open-br" />);

    obj.forEach((item, index) => {
      const indentStr = '  '.repeat(indent + 1);
      const idx = index;
      elements.push(<span key={`indent-${idx}`}>{indentStr}</span>);
      elements.push(...formatJsonWithRainbowBraces(item, indent + 1));

      if (index < obj.length - 1) {
        elements.push(<span key={`comma-${idx}`} className={`${commentColor}`}>,</span>);
      }
      elements.push(<br key={`br-${idx}`} />);
    });

    const indentStr = '  '.repeat(indent);
    elements.push(<span key="close-indent">{indentStr}</span>);
    elements.push(<span key="close" className={color}>]</span>);

    return elements;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return [
        <span key="open" className={color}>{"{"}</span>,
          <span key="close" className={color}>{"}"}</span>
      ];
    }

    const elements: React.ReactNode[] = [];
    elements.push(<span key="open" className={color}>{"{"}</span>);
    elements.push(<br key="open-br" />);

    keys.forEach((key, index) => {
      const indentStr = '  '.repeat(indent + 1);
      const idx = index;
      elements.push(<span key={`indent-${idx}`}>{indentStr}</span>);
      elements.push(<span key={`key-${idx}`} className={`${selectorColor}`}>"{key}"</span>);
      elements.push(<span key={`colon-${idx}`} className={`${commentColor}`}>: </span>);
      elements.push(...formatJsonWithRainbowBraces(obj[key], indent + 1));

      if (index < keys.length - 1) {
        elements.push(<span key={`comma-${idx}`} className={`${commentColor}`}>,</span>);
      }
      elements.push(<br key={`br-${idx}`} />);
    });

    const indentStr = '  '.repeat(indent);
    elements.push(<span key="close-indent">{indentStr}</span>);
    elements.push(<span key="close" className={color}>{"}"}</span>);

    return elements;
  }

  return [<span key="unknown">{String(obj)}</span>];
};

export function RainbowBraces({ json, className = "" }: RainbowBracesProps) {
  const jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
  const formattedElements = formatJsonWithRainbowBraces(jsonObj);

  return (
    <pre className={`font-mono text-sm ${className}`}>
  <code>
    {formattedElements.map((element, index) =>
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        React.cloneElement(element as React.ReactElement, { key: index })
      )}
  </code>
  </pre>
);
}