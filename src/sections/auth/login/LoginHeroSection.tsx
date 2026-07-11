import { Text, VStack } from 'design-system-native';
import { StyleSheet, View } from 'react-native';

export const LoginHeroSection = () => {
  return (
    <View style={styles.header}>
      <VStack style={styles.textStack}>
        <Text style={styles.hello}>Hello!</Text>
        <Text style={styles.subtitle}>欢迎登录 D&J Supplier</Text>
      </VStack>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 46,
  },
  textStack: {
    gap: 19,
  },
  hello: {
    color: '#0E2D5B',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  subtitle: {
    color: '#061B37',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
});
