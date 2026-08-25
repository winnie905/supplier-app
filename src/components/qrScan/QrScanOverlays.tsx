import {
  Button,
  designTokens,
  Pressable,
  SafeAreaHeader,
  Spinner,
  Text,
} from 'design-system-native';
import { memo } from 'react';
import { Image, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WhiteBackIcon from '@/assets/icons/white_back.svg';
import { QrCodeMarker } from '@/components/QrCodeMarker';
import type { QrScanDetectedCode } from '@/components/qrScan/types';
import type { AlbumPhase, QrCodeCandidate } from '@/types';
import { STACK_HEADER_TOOLBAR_HEIGHT } from '@/utils/app';

// ---------------------------------------------------------------------------
// 权限兜底
// ---------------------------------------------------------------------------

interface QrScanFallbackProps {
  backgroundColor: string;
  buttonText: string;
  contentText: string;
  onBack: () => void;
  spacingMd: number;
  textColor: string;
}

export const QrScanFallback = memo(
  ({
    backgroundColor,
    buttonText,
    contentText,
    onBack,
    spacingMd,
    textColor,
  }: QrScanFallbackProps) => (
    <View style={[fallbackStyles.container, { backgroundColor }]}>
      <Text style={{ color: textColor, marginBottom: spacingMd }}>{contentText}</Text>
      <Button onPress={onBack}>{buttonText}</Button>
    </View>
  ),
);

QrScanFallback.displayName = 'QrScanFallback';

const fallbackStyles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
});

// ---------------------------------------------------------------------------
// 多码 marker 叠加层
// ---------------------------------------------------------------------------

export type { QrScanDetectedCode } from '@/components/qrScan/types';

interface QrScanDetectedCodesOverlayProps<T extends QrScanDetectedCode> {
  codes: T[];
  onSelectCode: (code: T) => void;
  multiCodeHintText?: string | undefined;
  /** 是否显示多码提示，默认 true（有 hint 文案且 codes > 1 时） */
  showMultiCodeHint?: boolean;
}

function QrScanDetectedCodesOverlayInner<T extends QrScanDetectedCode>({
  codes,
  onSelectCode,
  multiCodeHintText,
  showMultiCodeHint = true,
}: QrScanDetectedCodesOverlayProps<T>) {
  const insets = useSafeAreaInsets();

  if (codes.length === 0) {
    return null;
  }

  return (
    <>
      {codes.map((code) => (
        <QrCodeMarker
          key={code.id}
          x={code.x}
          y={code.y}
          width={code.width}
          height={code.height}
          onPress={() => onSelectCode(code)}
        />
      ))}

      {showMultiCodeHint && codes.length > 1 && multiCodeHintText ? (
        <View style={[detectedStyles.multiCodeHint, { bottom: insets.bottom + 80 }]}>
          <RNText style={detectedStyles.multiCodeHintText}>{multiCodeHintText}</RNText>
        </View>
      ) : null}
    </>
  );
}

export const QrScanDetectedCodesOverlay = memo(
  QrScanDetectedCodesOverlayInner,
) as typeof QrScanDetectedCodesOverlayInner;

const detectedStyles = StyleSheet.create({
  multiCodeHint: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  multiCodeHintText: { color: '#fff', fontSize: 14 },
});

// ---------------------------------------------------------------------------
// 相册多码：全屏图片 + 无坐标兜底列表
// ---------------------------------------------------------------------------

/** 相册复核时替代相机预览，避免原生 Camera 遮挡 JS overlay */
export const QrScanAlbumImageLayer = memo(
  ({ imageUri, onBack }: { imageUri: string; onBack: () => void }) => (
    <View style={albumStyles.imageLayer}>
      <Image resizeMode="contain" source={{ uri: imageUri }} style={albumStyles.imageLayerImage} />
      <SafeAreaHeader absolute compensateTopBleed contentSpacing={0}>
        <Pressable hitSlop={12} onPress={onBack} style={albumStyles.backButton}>
          <WhiteBackIcon style={{ height: 24, width: 24 }} />
        </Pressable>
      </SafeAreaHeader>
    </View>
  ),
);

QrScanAlbumImageLayer.displayName = 'QrScanAlbumImageLayer';

export const QrScanAlbumFallbackList = ({
  candidates,
  onSelect,
}: {
  candidates: QrCodeCandidate[];
  onSelect: (candidate: QrCodeCandidate) => void;
}) => {
  const getCandidateDisplayText = (candidate: QrCodeCandidate, index: number) => {
    const rawValue = candidate.rawValue?.trim();
    return rawValue || `二维码 ${index + 1}`;
  };

  if (candidates.length === 0) {
    return null;
  }

  return (
    <View style={albumStyles.fallbackPanel}>
      <Text style={albumStyles.fallbackTitle}>识别到多个二维码，请选择一个</Text>
      <ScrollView
        style={albumStyles.fallbackList}
        contentContainerStyle={albumStyles.fallbackListContent}
        showsVerticalScrollIndicator={false}
      >
        {candidates.map((candidate, index) => (
          <Pressable
            key={`${candidate.barcodeType}-${candidate.rawValue}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`选择二维码 ${index + 1}`}
            onPress={() => onSelect(candidate)}
            style={albumStyles.fallbackButton}
          >
            <Text numberOfLines={1} style={albumStyles.fallbackButtonText}>
              {getCandidateDisplayText(candidate, index)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const AlbumLoadingOverlay = memo(
  ({
    analyzingText,
    openingText,
    phase,
    spacingMd,
  }: {
    analyzingText: string;
    openingText: string;
    phase: AlbumPhase;
    spacingMd: number;
  }) => {
    if (phase === 'idle') return null;

    return (
      <View style={albumStyles.loading}>
        <Spinner size="large" />
        <Text style={{ color: designTokens.colors.gray[0], marginTop: spacingMd }}>
          {phase === 'picking' ? openingText : analyzingText}
        </Text>
      </View>
    );
  },
);

AlbumLoadingOverlay.displayName = 'AlbumLoadingOverlay';

interface QrScanAlbumLayerProps {
  albumPhase: AlbumPhase;
  analyzingText: string;
  openingText: string;
  spacingMd: number;
}

/** 相册识别 loading（picking / analyzing） */
export const QrScanAlbumLayer = memo(
  ({ albumPhase, analyzingText, openingText, spacingMd }: QrScanAlbumLayerProps) => (
    <AlbumLoadingOverlay
      analyzingText={analyzingText}
      openingText={openingText}
      phase={albumPhase}
      spacingMd={spacingMd}
    />
  ),
);

QrScanAlbumLayer.displayName = 'QrScanAlbumLayer';

const albumStyles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    zIndex: 200,
  },
  imageLayer: {
    backgroundColor: '#000000',
    flex: 1,
    overflow: 'hidden',
  },
  imageLayerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    alignItems: 'flex-start',
    height: STACK_HEADER_TOOLBAR_HEIGHT,
    justifyContent: 'center',
    minWidth: STACK_HEADER_TOOLBAR_HEIGHT,
  },
  fallbackPanel: {
    backgroundColor: 'rgba(17,24,39,0.92)',
    borderRadius: 12,
    bottom: 20,
    left: 16,
    maxHeight: 260,
    padding: 12,
    position: 'absolute',
    right: 16,
    zIndex: 210,
  },
  fallbackTitle: {
    color: designTokens.colors.gray[0],
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  fallbackList: { maxHeight: 200 },
  fallbackListContent: { gap: 8 },
  fallbackButton: {
    backgroundColor: designTokens.colors.gray[0],
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  fallbackButtonText: { color: '#111827', fontSize: 14 },
});
