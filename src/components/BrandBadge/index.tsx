import { Text } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

interface BrandBadgeProps {
  name: string;
}

/** 生产单列表 / 收发生产单信息卡共用品牌标签 */
export const BrandBadge = ({ name }: BrandBadgeProps) => (
  <View style={styles.row}>
    <View style={styles.label}>
      <Text style={styles.labelText}>品牌</Text>
    </View>
    <View style={styles.name}>
      <Text style={styles.nameText} numberOfLines={1}>
        {name}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 4,
  },
  label: {
    padding: 4,
    backgroundColor: '#FAE6CF',
  },
  name: {
    padding: 4,
    backgroundColor: '#FDF6EE',
  },
  labelText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#934509',
    fontWeight: '700',
  },
  nameText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#934509',
    fontWeight: '600',
  },
});
