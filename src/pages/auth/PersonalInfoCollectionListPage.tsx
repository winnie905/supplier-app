import { Box } from 'design-system-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  ComplianceTable,
  ComplianceTableCellText,
  type TableColumn,
} from '@/components/ComplianceTable';
import { PRIVACY_PERSONAL_INFO_COLLECTION_LIST } from '@/constants/legalContent';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthScreenProps } from '@/navigation/types';

type PersonalInfoCollectionListPageProps = AuthScreenProps<'PersonalInfoCollectionList'>;

interface PersonalInfoCollectionRow {
  key: string;
  scenario: string;
  purpose: string;
  infoTypes: string[];
  permissions: string;
  sensitivity: string;
}

const COLUMN_WIDTHS = {
  scenario: 140,
  purpose: 220,
  infoTypes: 220,
  permissions: 200,
  sensitivity: 160,
} as const;

export const PersonalInfoCollectionListPage = (_props: PersonalInfoCollectionListPageProps) => {
  const { colors } = useAppTheme();
  const listData = PRIVACY_PERSONAL_INFO_COLLECTION_LIST;

  const rows = useMemo<PersonalInfoCollectionRow[]>(
    () =>
      listData.rows.map((row) => ({
        ...row,
        infoTypes: [...row.infoTypes],
      })),
    [listData.rows],
  );

  const renderBulletList = (items: string[]) => {
    return (
      <View style={styles.bulletList}>
        {items.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <ComplianceTableCellText style={styles.bullet}>•</ComplianceTableCellText>
            <ComplianceTableCellText style={styles.bulletText}>{item}</ComplianceTableCellText>
          </View>
        ))}
      </View>
    );
  };

  const columns = useMemo<TableColumn<PersonalInfoCollectionRow>[]>(
    () => [
      {
        key: 'scenario',
        title: listData.columns.scenario,
        dataIndex: 'scenario',
        width: COLUMN_WIDTHS.scenario,
      },
      {
        key: 'purpose',
        title: listData.columns.purpose,
        dataIndex: 'purpose',
        width: COLUMN_WIDTHS.purpose,
      },
      {
        key: 'infoTypes',
        title: listData.columns.infoTypes,
        dataIndex: 'infoTypes',
        width: COLUMN_WIDTHS.infoTypes,
        render: (_value, record) => renderBulletList(record.infoTypes),
      },
      {
        key: 'permissions',
        title: listData.columns.permissions,
        dataIndex: 'permissions',
        width: COLUMN_WIDTHS.permissions,
      },
      {
        key: 'sensitivity',
        title: listData.columns.sensitivity,
        dataIndex: 'sensitivity',
        width: COLUMN_WIDTHS.sensitivity,
      },
    ],
    [listData.columns],
  );

  return (
    <Box style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        <ComplianceTable
          columns={columns}
          dataSource={rows}
          rowKey="key"
        />
      </ScrollView>
    </Box>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bulletList: {
    width: '100%',
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    width: '100%',
  },
  bullet: {
    lineHeight: 22,
    width: 14,
  },
  bulletText: {
    flex: 1,
    flexShrink: 1,
    width: '100%',
  },
});
