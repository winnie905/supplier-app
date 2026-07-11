import { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface TncHtmlContentProps {
  html: string;
}

type InlinePart = { type: 'text'; value: string } | { type: 'strong'; value: string };

type HtmlBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; parts: InlinePart[] }
  | { type: 'table'; rows: string[][] };

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const stripTags = (value: string) => decodeEntities(value.replace(/<[^>]+>/g, ''));

const parseInline = (value: string): InlinePart[] => {
  const parts: InlinePart[] = [];
  const regex = /<(strong|b)>(.*?)<\/\1>/gis;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: stripTags(value.slice(lastIndex, match.index)) });
    }
    parts.push({ type: 'strong', value: stripTags(match[2] ?? '') });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    parts.push({ type: 'text', value: stripTags(value.slice(lastIndex)) });
  }

  return parts.filter((part) => part.value.length > 0);
};

const parseTable = (tableHtml: string): string[][] => {
  const rows: string[][] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowMatch[1] ?? '')) !== null) {
      cells.push(stripTags(cellMatch[2] ?? '').trim());
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
};

const parseHtmlBlocks = (html: string): HtmlBlock[] => {
  const blocks: HtmlBlock[] = [];
  const regex = /<(h2|h3|p|table)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const tag = (match[1] ?? '').toLowerCase();
    const inner = match[3] ?? '';

    if (tag === 'h2' || tag === 'h3') {
      blocks.push({
        type: 'heading',
        level: tag === 'h2' ? 2 : 3,
        text: stripTags(inner),
      });
      continue;
    }

    if (tag === 'table') {
      blocks.push({ type: 'table', rows: parseTable(inner) });
      continue;
    }

    blocks.push({ type: 'paragraph', parts: parseInline(inner) });
  }

  return blocks;
};

/**
 * 轻量 HTML 渲染：对接后端富文本字段。
 * 支持 h2/h3/p/strong/b/table。后续可替换为正式 HTML 渲染库。
 */
export const TncHtmlContent = ({ html }: TncHtmlContentProps) => {
  const { colors } = useAppTheme();
  const blocks = useMemo(() => parseHtmlBlocks(html), [html]);

  const textColor = { color: colors.text } as TextStyle;

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={`h-${index}`}
              style={[block.level === 2 ? styles.h2 : styles.h3, textColor, styles.strong]}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === 'table') {
          return (
            <View key={`table-${index}`} style={styles.table}>
              {block.rows.map((row, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  style={[styles.tableRow, rowIndex === 0 ? styles.tableHeaderRow : null]}
                >
                  {row.map((cell, cellIndex) => (
                    <Text
                      key={`cell-${cellIndex}`}
                      style={[
                        styles.tableCell,
                        textColor,
                        rowIndex === 0 ? styles.strong : null,
                        { flex: 1 } as ViewStyle,
                      ]}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={`p-${index}`} style={[styles.paragraph, textColor]}>
            {block.parts.map((part, partIndex) =>
              part.type === 'strong' ? (
                <Text key={`part-${partIndex}`} style={styles.strong}>
                  {part.value}
                </Text>
              ) : (
                <Text key={`part-${partIndex}`}>{part.value}</Text>
              ),
            )}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  h2: {
    fontSize: 20,
    lineHeight: 30,
    marginBottom: 16,
  },
  h3: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: 8,
    marginBottom: 12,
  },
  paragraph: {
    lineHeight: 28,
    marginBottom: 14,
  },
  strong: {
    fontWeight: '700',
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DADEE5',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DADEE5',
  },
  tableHeaderRow: {
    backgroundColor: '#F5F7FA',
  },
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    lineHeight: 20,
    fontSize: 13,
  },
});
