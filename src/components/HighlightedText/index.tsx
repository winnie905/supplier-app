import { useMemo } from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';

export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

/** 按关键字切分文本，供高亮渲染（大小写不敏感） */
export const splitHighlightSegments = (text: string, keyword: string): HighlightSegment[] => {
  const q = keyword.trim();
  if (!q) return [{ text, highlight: false }];

  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const segments: HighlightSegment[] = [];
  let start = 0;
  let index = lowerText.indexOf(lowerQ, start);

  while (index !== -1) {
    if (index > start) {
      segments.push({ text: text.slice(start, index), highlight: false });
    }
    segments.push({ text: text.slice(index, index + q.length), highlight: true });
    start = index + q.length;
    index = lowerText.indexOf(lowerQ, start);
  }

  if (start < text.length) {
    segments.push({ text: text.slice(start), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
};

interface HighlightedTextProps {
  text: string;
  keyword: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
}

export const HighlightedText = ({ text, keyword, style, highlightStyle }: HighlightedTextProps) => {
  const parts = useMemo(() => splitHighlightSegments(text, keyword), [keyword, text]);

  return (
    <Text style={style}>
      {parts.map((part, partIndex) => (
        <Text key={`${part.text}-${partIndex}`} style={part.highlight ? highlightStyle : style}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
};
