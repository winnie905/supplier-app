import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CameraDevice, CodeScanner } from 'react-native-vision-camera';

import {
  QrScanCameraContainer,
  QrScanCameraLayer,
  type QrScanCameraOptions,
} from '@/components/qrScan/QrScanCamera';
import {
  QrScanAlbumFallbackList,
  QrScanAlbumImageLayer,
  QrScanAlbumLayer,
  QrScanDetectedCodesOverlay,
  QrScanFallback,
} from '@/components/qrScan/QrScanOverlays';
import type {
  QrScanDetectedCode,
  QrScanPageAlbumState,
  QrScanPageTexts,
} from '@/components/qrScan/types';
import { useQrScanCameraFormat } from '@/components/qrScan/useQrScanCameraFormat';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { QrCodeCandidate } from '@/types';

export type {
  QrScanDetectedCode,
  QrScanPageAlbumState,
  QrScanPageTexts,
} from '@/components/qrScan/types';

export interface QrScanPageProps<T extends QrScanDetectedCode = QrScanDetectedCode> {
  device: CameraDevice | undefined;
  hasCameraAccess: boolean;
  isRequesting: boolean;
  cameraActive: boolean;
  codeScanner: CodeScanner;
  torchOn: boolean;
  onBack: () => void;
  onToggleTorch: () => void;
  /** 是否显示相册入口，默认不显示 */
  showAlbumButton?: boolean;
  onPickFromAlbum?: (() => void) | undefined;
  texts: QrScanPageTexts;
  albumState?: QrScanPageAlbumState<QrCodeCandidate>;
  /** 多码标记叠加层 */
  detectedCodes?: T[];
  onSelectDetectedCode?: (code: T) => void;
  /** 预览视图实测尺寸回调，用于二维码坐标映射 */
  onPreviewLayout?: ((size: { width: number; height: number }) => void) | undefined;
  multiCodeHintText?: string | undefined;
  /** 是否显示扫描框遮罩，默认 true */
  showScanMask?: boolean;
  /** 是否显示底部扫描提示，默认 true */
  showScanTip?: boolean;
  /** 返回按钮样式 */
  backIconVariant?: 'default' | 'white';
  /**
   * 相机预设：cover 为高清 cover 预览（含 format / exposure 等配置）
   * 默认 default，使用基础相机参数
   */
  cameraPreset?: 'default' | 'cover';
  /** 自定义相机参数，优先级高于 cameraPreset；传入时可避免 QrScanPage 内重复解析 format */
  cameraOptions?: QrScanCameraOptions | undefined;
  /** cover 模式下外部已解析 format 时传入，配合 cameraOptions 跳过页内 format hook */
  coverHasFormat?: boolean;
  children?: ReactNode;
}

export function QrScanPage<T extends QrScanDetectedCode = QrScanDetectedCode>({
  device,
  hasCameraAccess,
  isRequesting,
  cameraActive,
  codeScanner,
  torchOn,
  onBack,
  onToggleTorch,
  showAlbumButton = false,
  onPickFromAlbum,
  texts,
  albumState,
  detectedCodes,
  onSelectDetectedCode,
  onPreviewLayout,
  multiCodeHintText,
  showScanMask = true,
  showScanTip = true,
  backIconVariant = 'default',
  cameraPreset = 'default',
  cameraOptions: cameraOptionsProp,
  coverHasFormat: coverHasFormatProp,
  children,
}: QrScanPageProps<T>) {
  const { colors, tokens } = useAppTheme();
  const shouldResolveCoverFormat = cameraPreset === 'cover' && !cameraOptionsProp;
  const coverCamera = useQrScanCameraFormat(shouldResolveCoverFormat ? device : undefined);
  const resolvedCameraOptions = cameraOptionsProp ?? coverCamera.cameraOptions;
  const resolvedCoverHasFormat = coverHasFormatProp ?? coverCamera.hasFormat;
  const resolvedHasCameraAccess =
    hasCameraAccess && (cameraPreset !== 'cover' || resolvedCoverHasFormat);

  const albumImageUri = albumState?.albumImageUri ?? null;
  const albumReview = albumState?.albumReview ?? null;
  const showAlbumImage = Boolean(albumImageUri);
  const showAlbumFallback =
    showAlbumImage &&
    (detectedCodes?.length ?? 0) === 0 &&
    (albumReview?.candidates.length ?? 0) > 0;

  if (!resolvedHasCameraAccess || !device) {
    return (
      <QrScanFallback
        backgroundColor={colors.background}
        buttonText={texts.back}
        contentText={isRequesting ? texts.scanRequestingPermission : texts.scanNoPermission}
        onBack={onBack}
        spacingMd={tokens.spacing.md}
        textColor={colors.textMuted}
      />
    );
  }

  return (
    <QrScanCameraContainer>
      {showAlbumImage && albumImageUri ? (
        <QrScanAlbumImageLayer imageUri={albumImageUri} onBack={onBack} />
      ) : (
        <QrScanCameraLayer
          activeColor={colors.primary}
          albumFontSize={tokens.typography.fontSize.sm}
          albumText={texts.album}
          backIconVariant={backIconVariant}
          cameraActive={cameraActive}
          codeScanner={codeScanner}
          device={device}
          inactiveColor={colors.textInverse}
          isTorchOn={torchOn}
          onBack={onBack}
          onPickFromAlbum={onPickFromAlbum}
          onToggleTorch={onToggleTorch}
          onPreviewLayout={onPreviewLayout}
          paddingXl={tokens.spacing.xl}
          scanTipText={texts.scanTip}
          showAlbumButton={showAlbumButton}
          showScanMask={showScanMask}
          showScanTip={showScanTip}
          torchFontSize={tokens.typography.fontSize.sm}
          torchLabel={texts.scanTorch}
          {...(resolvedCameraOptions ? { cameraOptions: resolvedCameraOptions } : {})}
        />
      )}

      {albumState && texts.albumAnalyzing && texts.albumOpening ? (
        <QrScanAlbumLayer
          albumPhase={albumState.albumPhase}
          analyzingText={texts.albumAnalyzing}
          openingText={texts.albumOpening}
          spacingMd={tokens.spacing.md}
        />
      ) : null}

      {detectedCodes && detectedCodes.length > 0 && onSelectDetectedCode ? (
        <View pointerEvents="box-none" style={pageStyles.detectedCodesOverlay}>
          <QrScanDetectedCodesOverlay
            codes={detectedCodes}
            onSelectCode={onSelectDetectedCode}
            {...(multiCodeHintText ? { multiCodeHintText } : {})}
          />
        </View>
      ) : null}

      {showAlbumFallback && albumReview && albumState ? (
        <QrScanAlbumFallbackList
          candidates={albumReview.candidates}
          onSelect={albumState.onSelectAlbumCandidate}
        />
      ) : null}

      {children}
    </QrScanCameraContainer>
  );
}

const pageStyles = StyleSheet.create({
  detectedCodesOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
  },
});
