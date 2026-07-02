import { Box, Card, Pressable, Text, VStack } from 'design-system-native';
import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface WorkspaceModuleCardProps {
  accentColor: string;
  onPress?: () => void;
  title: string;
  imageSrc?: ImageSourcePropType | undefined;
}

export const WorkspaceModuleCard = ({ onPress, title, imageSrc }: WorkspaceModuleCardProps) => {
  const { colors, tokens } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={[styles.card]}>
        <VStack style={styles.content}>
          {imageSrc ? (
            <Image source={imageSrc} style={styles.image} />
          ) : (
            <Box
              style={[
                styles.iconBox,
                {
                  backgroundColor: colors.backgroundMuted,
                },
              ]}
            />
          )}
          <Text
            strong
            style={{
              color: colors.text,
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              paddingTop: tokens.spacing.sm,
            }}
          >
            {title}
          </Text>
        </VStack>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 158,

    // 去掉边框
    borderWidth: 0,
    borderColor: 'transparent',

    // 去掉 iOS 阴影
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,

    // 去掉 Android 阴影
    elevation: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconBox: {
    borderRadius: 14,
    height: 92,
    width: 92,
  },
  pressable: {
    flex: 1,
  },
  image: {
    width: 92,
    height: 92,
  },
});
