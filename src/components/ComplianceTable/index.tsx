import { type TableColumn, type TableProps, Text } from 'design-system-native';
import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

const TABLE_BORDER_COLOR = '#000000';
const TABLE_HEADER_BACKGROUND = '#F5F5F5';
const DEFAULT_COLUMN_WIDTH = 120;

const getRowKey = <RecordType extends object>(
  record: RecordType,
  index: number,
  rowKey: TableProps<RecordType>['rowKey'],
) => {
  if (!rowKey) {
    return String(index);
  }

  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }

  return String(record[rowKey]);
};

const isTextLikeNode = (content: ReactNode) => {
  return (
    content === null ||
    content === undefined ||
    typeof content === 'string' ||
    typeof content === 'number' ||
    typeof content === 'boolean'
  );
};

const getColumnWidth = (width?: number) => width ?? DEFAULT_COLUMN_WIDTH;

const getColumnCellStyle = (width: number, isLastColumn: boolean) => [
  styles.cell,
  { width },
  isLastColumn ? styles.lastColumn : null,
];

interface ComplianceTableCellTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: 'body' | 'header';
}

export const ComplianceTableCellText = ({
  children,
  style,
  variant = 'body',
}: ComplianceTableCellTextProps) => {
  const { colors } = useAppTheme();

  return (
    <Text
      style={[
        variant === 'header' ? styles.headerText : styles.bodyText,
        variant === 'body' ? { color: colors.text } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export const ComplianceTable = <RecordType extends object>({
  columns,
  dataSource,
  emptyText,
  rowKey,
  style,
}: TableProps<RecordType>) => {
  const { colors } = useAppTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={style}>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          {columns.map((column, columnIndex) => {
            const columnWidth = getColumnWidth(column.width);
            const isLastColumn = columnIndex === columns.length - 1;

            return (
              <View
                key={column.key}
                style={[...getColumnCellStyle(columnWidth, isLastColumn), styles.headerCell]}
              >
                <ComplianceTableCellText variant="header">{column.title}</ComplianceTableCellText>
              </View>
            );
          })}
        </View>

        {dataSource.length === 0 ? (
          <View style={styles.emptyCell}>
            <Text style={{ color: colors.textMuted }}>{emptyText ?? ''}</Text>
          </View>
        ) : (
          dataSource.map((record, rowIndex) => (
            <View key={getRowKey(record, rowIndex, rowKey)} style={styles.bodyRow}>
              {columns.map((column, columnIndex) => {
                const columnWidth = getColumnWidth(column.width);
                const isLastColumn = columnIndex === columns.length - 1;
                const isLastRow = rowIndex === dataSource.length - 1;
                const value = column.dataIndex ? record[column.dataIndex] : undefined;
                const content: ReactNode = column.render
                  ? column.render(value, record, rowIndex)
                  : value === null || value === undefined
                    ? ''
                    : typeof value === 'string' ||
                        typeof value === 'number' ||
                        typeof value === 'boolean'
                      ? value
                      : String(value);

                return (
                  <View
                    key={`${column.key}-${rowIndex}`}
                    style={[
                      ...getColumnCellStyle(columnWidth, isLastColumn),
                      styles.bodyCell,
                      isLastRow ? styles.lastRowCell : null,
                    ]}
                  >
                    {isTextLikeNode(content) ? (
                      <ComplianceTableCellText>{content}</ComplianceTableCellText>
                    ) : (
                      content
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export type { TableColumn };

const styles = StyleSheet.create({
  table: {
    borderColor: TABLE_BORDER_COLOR,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    backgroundColor: TABLE_HEADER_BACKGROUND,
    flexDirection: 'row',
  },
  bodyRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  cell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: TABLE_BORDER_COLOR,
    borderRightWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerCell: {
    backgroundColor: TABLE_HEADER_BACKGROUND,
  },
  bodyCell: {
    backgroundColor: '#FFFFFF',
  },
  lastColumn: {
    borderRightWidth: 0,
  },
  lastRowCell: {
    borderBottomWidth: 0,
  },
  headerText: {
    color: '#000000',
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'left',
    width: '100%',
  },
  bodyText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
    width: '100%',
  },
  emptyCell: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
});
