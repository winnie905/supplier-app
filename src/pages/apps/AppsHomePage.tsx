import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Pressable, Text } from 'design-system-native';
import { useId, useState } from 'react';
import {
  Image,
  ImageBackground,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { appsBackgroundImage, companyImage, orderSearchEntryImage } from '@/components/images';
import { APPS_COMPANY_NAME, APPS_ENTRIES, type AppsEntryKey } from '@/constants/apps';
import { ROUTES } from '@/constants/routes';
import type { AppsScreenProps } from '@/navigation/types';
import { getSafeAreaTopInset } from '@/utils/app';

type AppsHomePageProps = AppsScreenProps<'AppsHome'>;

const ENTRY_CARD_HEIGHT = 89;

const EntryListChrome = ({
  width,
  height,
  gradientId,
}: {
  width: number;
  height: number;
  gradientId: string;
}) => {
  if (width <= 0 || height <= 0) return null;

  const fillId = `${gradientId}-fill`;
  const strokeId = `${gradientId}-stroke`;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {/* background: linear-gradient(180deg, #ffffffcc 0%, #ffffff80 98%) */}
        <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" />
          <Stop offset="0.98" stopColor="#FFFFFF" stopOpacity="0.5" />
        </LinearGradient>
        {/* border-image: linear-gradient(180deg, #ffffff 0%, #ffffff00 100%) */}
        <LinearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect
        x={0.5}
        y={0.5}
        width={Math.max(width - 1, 0)}
        height={Math.max(height - 1, 0)}
        rx={12}
        ry={12}
        fill={`url(#${fillId})`}
        stroke={`url(#${strokeId})`}
        strokeWidth={1}
      />
    </Svg>
  );
};

const EntryCardChrome = ({
  width,
  height,
  gradientId,
}: {
  width: number;
  height: number;
  gradientId: string;
}) => {
  if (width <= 0 || height <= 0) return null;

  const fillId = `${gradientId}-fill`;
  const strokeId = `${gradientId}-stroke`;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {/* background: linear-gradient(107deg, #eff5ff 0%, #f5fafd 91%) */}
        <LinearGradient id={fillId} x1="0.022" y1="0.354" x2="0.978" y2="0.646">
          <Stop offset="0" stopColor="#EFF5FF" />
          <Stop offset="0.91" stopColor="#F5FAFD" />
        </LinearGradient>
        {/* border-image: linear-gradient(180deg, #ffffff 0%, #ffffff00 100%) */}
        <LinearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect
        x={0.5}
        y={0.5}
        width={Math.max(width - 1, 0)}
        height={Math.max(height - 1, 0)}
        rx={8}
        ry={8}
        fill={`url(#${fillId})`}
        stroke={`url(#${strokeId})`}
        strokeWidth={1}
      />
    </Svg>
  );
};

export const AppsHomePage = ({ navigation }: AppsHomePageProps) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const topInset = getSafeAreaTopInset(insets.top);
  const gradientId = useId().replace(/:/g, '');
  const [listSize, setListSize] = useState({ width: 0, height: 0 });

  const handlePressEntry = (key: AppsEntryKey) => {
    if (key === 'order_search') {
      navigation.navigate(ROUTES.APPS.PRODUCTION_ORDERS);
    }
  };

  const onListLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setListSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  return (
    <ImageBackground resizeMode="cover" source={appsBackgroundImage} style={styles.page}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 8, paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>应用</Text>

        <View style={styles.companyBlock}>
          <View style={styles.companyRow}>
            <Image source={companyImage} style={styles.companyIcon} />
            <Text numberOfLines={1} style={styles.companyName}>
              {APPS_COMPANY_NAME}
            </Text>
          </View>
          <Text style={styles.welcome}>欢迎使用 D&J Supplier</Text>
        </View>

        <View style={styles.entryList} onLayout={onListLayout}>
          <EntryListChrome
            width={listSize.width}
            height={listSize.height}
            gradientId={gradientId}
          />
          {APPS_ENTRIES.map((entry) => {
            const cardWidth = Math.max(listSize.width - 24, 0);
            return (
              <Pressable
                key={entry.key}
                accessibilityRole="button"
                disabled={!entry.enabled}
                onPress={() => handlePressEntry(entry.key)}
                style={styles.entryCard}
              >
                <EntryCardChrome
                  width={cardWidth}
                  height={ENTRY_CARD_HEIGHT}
                  gradientId={`${gradientId}-${entry.key}`}
                />
                <View style={styles.entryTextCol}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entrySubtitle}>{entry.subtitle}</Text>
                </View>
                <Image
                  resizeMode="contain"
                  source={orderSearchEntryImage}
                  style={styles.entryImage}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  pageTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  companyBlock: {
    gap: 6,
    marginBottom: 28,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  companyIcon: {
    width: 26,
    height: 26,
  },
  companyName: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  welcome: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  entryList: {
    borderRadius: 12,
    padding: 12,
    gap: 16,
    overflow: 'hidden',
  },
  entryCard: {
    height: ENTRY_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  entryTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingRight: 120,
    zIndex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#061B37',
  },
  entrySubtitle: {
    fontSize: 14,
    color: '#7D92AF',
  },
  entryImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: ENTRY_CARD_HEIGHT,
    width: ENTRY_CARD_HEIGHT * (408 / 267),
  },
});
