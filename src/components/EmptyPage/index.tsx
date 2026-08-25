import { designTokens, Image } from 'design-system-native';
import { StyleSheet, Text, View } from 'react-native';

import { emptyPageImage } from '@/components/images';

interface EmptyPageProps {
  description?: string;
}

export const EmptyPage = ({ description }: EmptyPageProps) => {
  return (
    <View style={styles.container}>
      <Image source={emptyPageImage} style={styles.image} />
      <Text style={[styles.description]}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    color: designTokens.colors.gray[500],
    lineHeight: 22,
    fontWeight: '600',
  },
});
