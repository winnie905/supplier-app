import { Pressable, StyleSheet, Text } from 'react-native';

import EditIcon from '@/assets/icons/edit.svg';

/** 记录卡右上角「编辑」入口：裁床 / 车位 / 装箱三页共用 */
export const RecordCardEditButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress} style={styles.button}>
    <EditIcon color="#6C829E" height={16} width={16} />
    <Text style={styles.label}>编辑</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  label: {
    color: '#6C829E',
    fontSize: 14,
  },
});
