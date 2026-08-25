import { designTokens } from 'design-system-native';
import { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface TncHtmlContentProps {
  html: string;
}

type InlinePart =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'br' };

type HtmlBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; parts: InlinePart[]; align?: 'left' | 'right' | 'center' }
  | { type: 'table'; rows: string[][] };

const parseAlign = (attrs: string | undefined): 'left' | 'right' | 'center' | undefined => {
  if (!attrs) {
    return undefined;
  }
  const alignMatch = /\balign\s*=\s*["']?(left|right|center)["']?/i.exec(attrs);
  if (alignMatch?.[1]) {
    return alignMatch[1].toLowerCase() as 'left' | 'right' | 'center';
  }
  const styleMatch = /text-align\s*:\s*(left|right|center)/i.exec(attrs);
  if (styleMatch?.[1]) {
    return styleMatch[1].toLowerCase() as 'left' | 'right' | 'center';
  }
  return undefined;
};

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const stripTags = (value: string) => decodeEntities(value.replace(/<[^>]+>/g, ''));

const parseInlineMarks = (value: string): InlinePart[] => {
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

  return parts.filter((part) => part.type === 'br' || part.value.length > 0);
};

/** 支持 strong/b 与 br（同段换行，不分段距） */
const parseInline = (value: string): InlinePart[] => {
  const segments = value.split(/<br\s*\/?>/gi);
  const parts: InlinePart[] = [];

  segments.forEach((segment, index) => {
    if (index > 0) {
      parts.push({ type: 'br' });
    }
    parts.push(...parseInlineMarks(segment));
  });

  return parts;
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

    const align = parseAlign(match[2]);
    blocks.push({
      type: 'paragraph',
      parts: parseInline(inner.trim()),
      ...(align ? { align } : {}),
    });
  }

  return blocks;
};

/**
 * 轻量 HTML 渲染：对接后端富文本字段。
 * 支持 h2/h3/p/strong/b/br/table。后续可替换为正式 HTML 渲染库。
 */
/** 「应用信息」块不参与引言首行缩进 */
const isAppInfoParagraph = (block: HtmlBlock): boolean => {
  if (block.type !== 'paragraph') {
    return false;
  }
  const first = block.parts.find((part) => part.type === 'text' || part.type === 'strong');
  return first?.value.startsWith('应用信息') ?? false;
};

const getParagraphPlainText = (block: Extract<HtmlBlock, { type: 'paragraph' }>): string =>
  block.parts.map((part) => (part.type === 'br' ? '\n' : part.value)).join('');

/** 段落所属三级编号分组（如 3.1.2 → "3.1"）；同行内二级标题+三级正文也算该组 */
const getTertiaryGroup = (block: HtmlBlock): string | null => {
  if (block.type !== 'paragraph') {
    return null;
  }
  for (const line of getParagraphPlainText(block).split('\n')) {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(line.trim());
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
  }
  return null;
};

/** 同一二级下连续三级编号段落后不保留分段距 */
const isTightBeforeNextTertiary = (block: HtmlBlock, next: HtmlBlock | undefined): boolean => {
  const group = getTertiaryGroup(block);
  const nextGroup = next ? getTertiaryGroup(next) : null;
  return group != null && nextGroup != null && group === nextGroup;
};

const startsWithParenList = (text: string): boolean => /^[（(]\d+[）)]/.test(text);

/**
 * 分号紧接内容、冒号引出的列表、连续（n）列表项：段间不分段距
 * （如「……；」接续下一段，或「……：」后接（1）（2））
 */
const isTightBeforeNextContinued = (block: HtmlBlock, next: HtmlBlock | undefined): boolean => {
  if (block.type !== 'paragraph' || next?.type !== 'paragraph') {
    return false;
  }
  const text = getParagraphPlainText(block).trim();
  const nextText = getParagraphPlainText(next).trim();
  if (!text || !nextText) {
    return false;
  }
  if (/[；;]\s*$/.test(text)) {
    return true;
  }
  if (/[：:]\s*$/.test(text) && startsWithParenList(nextText)) {
    return true;
  }
  if (startsWithParenList(text) && startsWithParenList(nextText)) {
    return true;
  }
  return false;
};

const isTightBeforeNextParagraph = (block: HtmlBlock, next: HtmlBlock | undefined): boolean =>
  isTightBeforeNextTertiary(block, next) || isTightBeforeNextContinued(block, next);

const collectTertiaryGroups = (blocks: HtmlBlock[]): Set<string> => {
  const groups = new Set<string>();
  for (const block of blocks) {
    const group = getTertiaryGroup(block);
    if (group) {
      groups.add(group);
    }
  }
  return groups;
};

/** 三级编号永不加粗；纯二级编号且无三级子项不加粗；带标题文案的二级保留加粗 */
const shouldRenderAsStrong = (value: string, tertiaryGroups: Set<string>): boolean => {
  const trimmed = value.trim();
  if (/^\d+\.\d+\.\d+/.test(trimmed)) {
    return false;
  }
  const secondary = /^(\d+)\.(\d+)(?!\.\d)\.?\s*(.*)$/.exec(trimmed);
  if (secondary) {
    const key = `${secondary[1]}.${secondary[2]}`;
    const title = (secondary[3] ?? '').trim();
    if (tertiaryGroups.has(key)) {
      return true;
    }
    // 如「7.1 技术不可用免责」：有标题文案则加粗；纯「1.1」不加粗
    return title.length > 0;
  }
  return true;
};

/** 仅「引言」标题下前三段正文需要首行缩进 */
const getIntroIndentIndexes = (blocks: HtmlBlock[]): Set<number> => {
  const indexes = new Set<number>();

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block?.type !== 'heading' || block.text !== '引言') {
      continue;
    }

    let count = 0;
    for (let j = i + 1; j < blocks.length && count < 3; j += 1) {
      const next = blocks[j];
      if (next?.type === 'heading') {
        break;
      }
      if (next?.type === 'paragraph' && !isAppInfoParagraph(next)) {
        indexes.add(j);
        count += 1;
      }
    }
  }

  return indexes;
};

export const TncHtmlContent = ({ html }: TncHtmlContentProps) => {
  const { colors } = useAppTheme();
  const blocks = useMemo(() => parseHtmlBlocks(html), [html]);
  const introIndentIndexes = useMemo(() => getIntroIndentIndexes(blocks), [blocks]);
  const tertiaryGroups = useMemo(() => collectTertiaryGroups(blocks), [blocks]);

  const textColor = { color: colors.text } as TextStyle;

  return (
    <View>
      {blocks.map((block, index) => {
        const prev = blocks[index - 1];
        const next = blocks[index + 1];
        // 标题与紧随正文/表格之间不分段距
        const followedByBody = next?.type === 'paragraph' || next?.type === 'table';
        const afterHeading = prev?.type === 'heading';

        if (block.type === 'heading') {
          return (
            <Text
              key={`h-${index}`}
              style={[
                block.level === 2 ? styles.h2 : styles.h3,
                followedByBody ? styles.headingTightBottom : null,
                textColor,
                styles.strong,
              ]}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === 'table') {
          return (
            <View
              key={`table-${index}`}
              style={[styles.table, afterHeading ? styles.tableAfterHeading : null]}
            >
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

        const indentPrefix = introIndentIndexes.has(index) ? '\u3000\u3000' : '';
        const tightBeforeNext = isTightBeforeNextParagraph(block, next);

        return (
          <Text
            key={`p-${index}`}
            style={[
              styles.paragraph,
              afterHeading ? styles.paragraphAfterHeading : null,
              tightBeforeNext ? styles.paragraphTightBottom : null,
              block.align ? { textAlign: block.align } : null,
              textColor,
            ]}
          >
            {indentPrefix}
            {block.parts.map((part, partIndex) => {
              if (part.type === 'br') {
                return '\n';
              }
              const isStrong =
                part.type === 'strong' && shouldRenderAsStrong(part.value, tertiaryGroups);
              return (
                <Text key={`part-${partIndex}`} style={isStrong ? styles.strong : undefined}>
                  {part.value}
                </Text>
              );
            })}
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
  headingTightBottom: {
    marginBottom: 0,
  },
  paragraph: {
    lineHeight: 28,
    marginBottom: 14,
  },
  paragraphAfterHeading: {
    marginTop: 0,
  },
  paragraphTightBottom: {
    marginBottom: 0,
  },
  strong: {
    fontWeight: '600',
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: designTokens.colors.gray[200],
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableAfterHeading: {
    marginTop: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: designTokens.colors.gray[200],
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
