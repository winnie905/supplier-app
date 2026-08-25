import { designTokens } from 'design-system-native';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

import { emptyPageImage } from '@/components/images';
import { useFactoryExceptions } from '@/hooks/receiving/useReceiving';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ExceptionReplyCard } from '@/sections/receiving/exception/ExceptionReplyCard';

type ExceptionReplyListPageProps = LogisticsScreenProps<'ExceptionReplyList'>;

const ExceptionReplyEmpty = () => (
  <View style={styles.empty}>
    <Image resizeMode="contain" source={emptyPageImage} style={styles.emptyImage} />
    <Text style={styles.emptyText}>暂无记录</Text>
  </View>
);

export const ExceptionReplyListPage = ({ route }: ExceptionReplyListPageProps) => {
  const { productionColorId, module } = route.params;
  const { items } = useFactoryExceptions(productionColorId, module);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<ExceptionReplyEmpty />}
      renderItem={({ item }) => <ExceptionReplyCard item={item} />}
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
    alignItems: 'center',
  },
  emptyImage: {
    marginTop: 90,
    width: 200,
    height: 200,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.gray[500],
  },
});
