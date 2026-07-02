import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

type TagPresetColor = 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple' | 'cyan' | 'gray';

interface CustomTagColor {
  backgroundColor: string;
  textColor: string;
}

type AppTagColor = TagPresetColor | CustomTagColor;

interface AppTagProps {
  children: ReactNode;
  color?: AppTagColor;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const TAG_COLOR_MAP: Record<TagPresetColor, CustomTagColor> = {
  blue: {
    backgroundColor: '#E1EEFF',
    textColor: '#105FC8',
  },
  green: {
    backgroundColor: '#E9F8F0',
    textColor: '#3CC47C',
  },
  red: {
    backgroundColor: '#FFECEC',
    textColor: '#F04438',
  },
  orange: {
    backgroundColor: '#FFF3E6',
    textColor: '#F79009',
  },
  yellow: {
    backgroundColor: '#FFF8DB',
    textColor: '#D89614',
  },
  purple: {
    backgroundColor: '#F3E8FF',
    textColor: '#7A35C9',
  },
  cyan: {
    backgroundColor: '#E6F8FF',
    textColor: '#0891B2',
  },
  gray: {
    backgroundColor: '#F1F4F9',
    textColor: '#667085',
  },
};

const isCustomColor = (color: AppTagColor): color is CustomTagColor =>
  typeof color === 'object' && color !== null;

export const Tag = ({ children, color = 'blue', style, textStyle }: AppTagProps) => {
  const colorConfig = isCustomColor(color) ? color : TAG_COLOR_MAP[color];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colorConfig.backgroundColor,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: colorConfig.textColor,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 22,
  },
  text: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 14,
  },
});
