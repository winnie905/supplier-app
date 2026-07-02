import { Box } from 'design-system-native';
import { useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  ComplianceTable,
  ComplianceTableCellText,
  type TableColumn,
} from '@/components/ComplianceTable';
import { PRIVACY_SDK_SHARE_LIST } from '@/constants/legalContent';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthScreenProps } from '@/navigation/types';

type SdkShareListPageProps = AuthScreenProps<'SdkShareList'>;

interface SdkShareLink {
  label: string;
  url: string;
}

interface SdkShareRow {
  key: string;
  name: string;
  operator: string;
  purpose: string;
  infoTypes: string;
  permissions: string;
  links: SdkShareLink[];
}

const COLUMN_WIDTHS = {
  name: 180,
  operator: 220,
  purpose: 240,
  infoTypes: 240,
  permissions: 200,
  links: 220,
} as const;

export const SdkShareListPage = (_props: SdkShareListPageProps) => {
  const { colors } = useAppTheme();
  const listData = PRIVACY_SDK_SHARE_LIST;

  const rows = useMemo<SdkShareRow[]>(
    () =>
      listData.rows.map((row) => ({
        ...row,
        links: row.links.map((link) => ({ ...link })),
      })),
    [listData.rows],
  );

  const handleOpenLink = useCallback(async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    }
  }, []);

  const renderLinks = useCallback(
    (links: SdkShareLink[]) => {
      return (
        <View>
          {links.map((link, index) => (
            <View key={link.url}>
              {index > 0 ? <View style={styles.linkSpacer} /> : null}
              <Pressable onPress={() => void handleOpenLink(link.url)}>
                <ComplianceTableCellText style={[styles.linkText, { color: colors.primary }]}>
                  {link.label}
                </ComplianceTableCellText>
              </Pressable>
            </View>
          ))}
        </View>
      );
    },
    [colors.primary, handleOpenLink],
  );

  const columns = useMemo<TableColumn<SdkShareRow>[]>(
    () => [
      {
        key: 'name',
        title: listData.columns.name,
        dataIndex: 'name',
        width: COLUMN_WIDTHS.name,
      },
      {
        key: 'operator',
        title: listData.columns.operator,
        dataIndex: 'operator',
        width: COLUMN_WIDTHS.operator,
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
      },
      {
        key: 'permissions',
        title: listData.columns.permissions,
        dataIndex: 'permissions',
        width: COLUMN_WIDTHS.permissions,
      },
      {
        key: 'links',
        title: listData.columns.links,
        dataIndex: 'links',
        width: COLUMN_WIDTHS.links,
        render: (_value, record) => renderLinks(record.links),
      },
    ],
    [listData.columns, renderLinks],
  );

  return (
    <Box style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        <ComplianceTable columns={columns} dataSource={rows} rowKey="key" />
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
  linkText: {
    textDecorationLine: 'underline',
    width: '100%',
  },
  linkSpacer: {
    height: 8,
  },
});
