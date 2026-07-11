import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useFactoryExceptions } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingStatusBadge } from '@/sections/receiving/ReceivingStatusBadge';
import type { FactoryException } from '@/types/receiving';

type ExceptionReplyListPageProps = LogisticsScreenProps<'ExceptionReplyList'>;

const ExceptionCard = ({ item }: { item: FactoryException }) => {
  const pending = item.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.cardTitle}>
        <View style={styles.titleLeft}>
          {pending ? <ReceivingStatusBadge compact label="待回复" tone="orange" /> : null}
          <Text style={styles.titleText} numberOfLines={1}>
            {item.reporter}提交了异常
          </Text>
        </View>
        <Text style={styles.timeText}>{item.reportedAt}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.row}>
          <Text style={styles.label}>异常内容：</Text>
          <Text style={styles.value}>{item.content}</Text>
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>问题描述：</Text>
          <Text style={styles.value}>
            {item.type ? `【${item.type}】` : ''}
            {item.description}
          </Text>
        </Text>
      </View>

      {item.replyContent ? (
        <View style={styles.replyBox}>
          <Text style={styles.replyText}>
            回复：{item.replyContent}
            {item.repliedAt ? ` (回复时间${item.repliedAt})` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export const ExceptionReplyListPage = ({ route }: ExceptionReplyListPageProps) => {
  const { productionColorId, module } = route.params;
  const { items } = useFactoryExceptions(productionColorId, module);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>暂无异常记录</Text>}
      renderItem={({ item }) => <ExceptionCard item={item} />}
      style={styles.root}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  list: {
    padding: 10,
    gap: 10,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: 80,
    color: '#8A98AD',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEFF7',
  },
  titleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  titleText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#021626',
  },
  timeText: {
    fontSize: 12,
    color: '#8A98AD',
    flexShrink: 0,
  },
  cardBody: {
    gap: 6,
  },
  row: {
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    color: '#8A98AD',
  },
  value: {
    color: '#4B5D73',
  },
  replyBox: {
    backgroundColor: '#EEF5FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#105FC8',
  },
});
