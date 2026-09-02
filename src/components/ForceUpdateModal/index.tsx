import { Modal, Text, useToast } from 'design-system-native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { forceUpdateImage } from '@/components/images';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { VersionCheckResponse } from '@/types/version';
import { openUpdateTarget } from '@/utils/app/version';

interface ForceUpdateModalProps {
  visible: boolean;
  policy: VersionCheckResponse;
}

const HEADER_IMAGE_RATIO = 390 / 1020;

export function ForceUpdateModal({ visible, policy }: ForceUpdateModalProps) {
  const { colors } = useAppTheme();
  const toast = useToast();
  const [headerWidth, setHeaderWidth] = useState(0);
  const [updating, setUpdating] = useState(false);
  const headerHeight = headerWidth > 0 ? headerWidth * HEADER_IMAGE_RATIO : 0;
  const updateContents = policy.updateContents;
  const latestVersion = policy.latestVersion;

  const handleUpgrade = async () => {
    if (updating) {
      return;
    }

    setUpdating(true);
    try {
      await openUpdateTarget();
    } catch (error) {
      console.error('openUpdateTarget error:', error);
      toast.show({ title: '无法打开下载页，请稍后重试' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      bare
      visible={visible}
      animationType="fade"
      closeOnBackdropPress={false}
      onClose={() => undefined}
      backdropStyle={styles.backdrop}
    >
      <View
        onLayout={(event) => {
          setHeaderWidth(event.nativeEvent.layout.width);
        }}
        style={styles.wrap}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            {headerWidth > 0 ? (
              <Image
                resizeMode="stretch"
                source={forceUpdateImage}
                style={{ width: headerWidth, height: headerHeight }}
              />
            ) : null}
            <View style={styles.versionTag}>
              <Text style={[styles.versionTagText, { color: colors.textInverse }]}>
                {`新版本：${latestVersion}`}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.contentsLabel}>更新内容：</Text>
            <ScrollView
              contentContainerStyle={styles.contentsList}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.contentsScroll}
            >
              {updateContents.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.contentRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                  <Text style={styles.contentText}>{item}</Text>
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => {
                void handleUpgrade();
              }}
              style={styles.upgradeButton}
            >
              <Svg
                height="100%"
                pointerEvents="none"
                preserveAspectRatio="none"
                style={StyleSheet.absoluteFill}
                width="100%"
              >
                <Defs>
                  <LinearGradient id="forceUpdateUpgrade" x1="1" y1="0" x2="0" y2="0">
                    <Stop offset="0" stopColor="#105FC8" />
                    <Stop offset="1" stopColor="#2579E7" />
                  </LinearGradient>
                </Defs>
                <Rect fill="url(#forceUpdateUpgrade)" height="100%" width="100%" />
              </Svg>
              <Text style={[styles.upgradeButtonText, { color: colors.textInverse }]}>
                {updating ? '跳转中…' : '立即升级'}
              </Text>
            </Pressable>
            <Text style={styles.tip}>当前版本已停止服务，请升级至最新版本</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  wrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  header: {
    position: 'relative',
    width: '100%',
  },
  versionTag: {
    position: 'absolute',
    left: 20,
    bottom: 28,
    borderRadius: 104,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#4B9EFF',
  },
  versionTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  contentsLabel: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#061B37',
  },
  contentsScroll: {
    maxHeight: 239,
  },
  contentsList: {
    gap: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 23,
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 9.5,
  },
  contentText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: '#061B37',
  },
  upgradeButton: {
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 18,
  },
  tip: {
    marginTop: 12,
    fontSize: 14,
    color: '#50637B',
    textAlign: 'center',
  },
});
