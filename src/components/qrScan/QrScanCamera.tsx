import { HStack, Pressable, Text, VStack } from 'design-system-native';
import { memo, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Reanimated, { runOnJS, useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  CameraDevice,
  CameraDeviceFormat,
  CameraProps,
  CodeScanner,
} from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';

import BackIcon from '@/assets/icons/back.svg';
import FlashlightIcon from '@/assets/icons/flashlight.svg';
import PhotographIcon from '@/assets/icons/photograph.svg';
import WhiteBackIcon from '@/assets/icons/white_back.svg';
import { qrCodeScanImage } from '@/components/images';
import { SafeAreaHeader } from '@/components/SafeAreaHeader';
import { getSafeAreaTopInset, STACK_HEADER_TOOLBAR_HEIGHT } from '@/utils/app';

export interface QrScanCameraOptions {
  format?: CameraDeviceFormat;
  resizeMode?: 'cover' | 'contain';
  video?: boolean;
  photo?: boolean;
  audio?: boolean;
  exposure?: number;
  enableZoomGesture?: boolean;
  zoom?: number;
  /** 单一 zoom 数据源：手势与自动变焦都写入它，相机据此显示 */
  zoomShared?: SharedValue<number>;
  /** 手势缩放下限（设备实际 minZoom） */
  minZoom?: number;
  /** 手势缩放上限（设备实际 maxZoom，不受自动变焦 3x/4x 限制） */
  maxZoom?: number;
  /** 手势开始：用于立即停止自动变焦 */
  onGestureStart?: () => void;
  /** 手势结束：用于进入自动变焦冷却 */
  onGestureEnd?: () => void;
}

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type DynamicZoomCameraProps = CameraProps & {
  zoomShared?: SharedValue<number>;
  minZoom?: number;
  maxZoom?: number;
  onGestureStart?: (() => void) | undefined;
  onGestureEnd?: (() => void) | undefined;
};

/**
 * 相机封装：zoomShared 作为唯一 zoom 数据源。
 * - 自动变焦在 JS 线程写 zoomShared；
 * - 自定义捏合手势在 UI 线程写 zoomShared（夹紧到设备 [minZoom, maxZoom]）；
 * - 相机通过 animatedProps 读取 zoomShared，避免 React 重渲染与多套 zoom 互相覆盖。
 */
const DynamicZoomCamera = memo(
  ({
    zoomShared,
    minZoom = 1,
    maxZoom = 1,
    onGestureStart,
    onGestureEnd,
    zoom,
    ...props
  }: DynamicZoomCameraProps) => {
    const savedZoom = useSharedValue(zoomShared?.value ?? 1);

    const animatedProps = useAnimatedProps<Partial<CameraProps>>(() => {
      if (!zoomShared) {
        return {};
      }
      return { zoom: zoomShared.value };
    });

    const pinch = useMemo(
      () =>
        Gesture.Pinch()
          .onStart(() => {
            'worklet';
            if (!zoomShared) {
              return;
            }
            savedZoom.value = zoomShared.value;
            if (onGestureStart) {
              runOnJS(onGestureStart)();
            }
          })
          .onUpdate((e) => {
            'worklet';
            if (!zoomShared) {
              return;
            }
            const next = savedZoom.value * e.scale;
            zoomShared.value = Math.min(Math.max(next, minZoom), maxZoom);
          })
          .onEnd(() => {
            'worklet';
            if (onGestureEnd) {
              runOnJS(onGestureEnd)();
            }
          }),
      [maxZoom, minZoom, onGestureEnd, onGestureStart, savedZoom, zoomShared],
    );

    if (!zoomShared) {
      return <Camera {...props} {...(zoom !== undefined ? { zoom } : {})} />;
    }

    return (
      <GestureDetector gesture={pinch}>
        <ReanimatedCamera {...props} animatedProps={animatedProps} />
      </GestureDetector>
    );
  },
);

DynamicZoomCamera.displayName = 'DynamicZoomCamera';

// ---------------------------------------------------------------------------
// 扫描框遮罩
// ---------------------------------------------------------------------------

const ScanMaskOverlay = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const scannerBoxSize = 260;

  return (
    <View style={maskStyles.overlay}>
      <View style={[maskStyles.scanBox, { width: scannerBoxSize, height: scannerBoxSize }]}>
        <Image source={qrCodeScanImage} style={maskStyles.qrCodeScanImage} />
        <Animated.View style={[maskStyles.scanningLine, { transform: [{ translateY }] }]} />
      </View>
    </View>
  );
};

const maskStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  scanBox: { position: 'relative' },
  scanningLine: {
    backgroundColor: 'rgba(25, 118, 210, 0.75)',
    borderRadius: 999,
    elevation: 4,
    height: 2,
    left: '10%',
    position: 'absolute',
    shadowColor: 'rgba(25, 118, 210, 0.5)',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: '80%',
  },
  qrCodeScanImage: { height: '100%', width: '100%' },
});

// ---------------------------------------------------------------------------
// 手电筒 / 底部操作
// ---------------------------------------------------------------------------

interface TorchToggleProps {
  activeColor: string;
  fontSize: number;
  inactiveColor: string;
  isOn: boolean;
  label: string;
  onPress: () => void;
}

const TorchToggle = memo(
  ({ activeColor, fontSize, inactiveColor, isOn, label, onPress }: TorchToggleProps) => {
    const color = isOn ? activeColor : inactiveColor;
    return (
      <View style={torchStyles.container}>
        <Pressable style={torchStyles.actionItem} onPress={onPress}>
          <FlashlightIcon color={color} />
          <Text style={{ color, fontSize }}>{label}</Text>
        </Pressable>
      </View>
    );
  },
);

TorchToggle.displayName = 'TorchToggle';

const torchStyles = StyleSheet.create({
  actionItem: { alignItems: 'center', gap: 6 },
  container: { alignSelf: 'center', marginTop: 150, position: 'absolute', top: '50%' },
});

interface BottomActionsProps {
  albumFontSize: number;
  albumText?: string | undefined;
  onPickFromAlbum?: (() => void) | undefined;
  paddingXl: number;
  showAlbumButton?: boolean;
  showScanTip?: boolean;
  textColor: string;
  tipText: string;
}

const BottomActions = memo(
  ({
    albumFontSize,
    albumText,
    onPickFromAlbum,
    paddingXl,
    showAlbumButton = false,
    showScanTip = true,
    textColor,
    tipText,
  }: BottomActionsProps) => {
    const insets = useSafeAreaInsets();

    return (
      <VStack style={[bottomStyles.container, { paddingBottom: insets.bottom }]}>
        {showScanTip ? (
          <Text style={{ color: textColor, textAlign: 'center' }}>{tipText}</Text>
        ) : null}

        {showAlbumButton && albumText && onPickFromAlbum ? (
          <HStack justifyContent="flex-end" style={{ padding: paddingXl }}>
            <Pressable style={bottomStyles.albumActionItem} onPress={onPickFromAlbum}>
              <PhotographIcon color={textColor} height={18} width={18} />
              <Text style={{ color: textColor, fontSize: albumFontSize }}>{albumText}</Text>
            </Pressable>
          </HStack>
        ) : null}
      </VStack>
    );
  },
);

BottomActions.displayName = 'BottomActions';

const bottomStyles = StyleSheet.create({
  albumActionItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 999,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  container: { bottom: 0, left: 0, position: 'absolute', right: 0 },
});

// ---------------------------------------------------------------------------
// 相机层 / 容器
// ---------------------------------------------------------------------------

interface QrScanCameraLayerProps {
  activeColor: string;
  albumFontSize: number;
  albumText?: string | undefined;
  backIconVariant?: 'default' | 'white';
  cameraActive: boolean;
  cameraOptions?: QrScanCameraOptions | undefined;
  codeScanner: CodeScanner;
  device: CameraDevice;
  inactiveColor: string;
  isTorchOn: boolean;
  onBack: () => void;
  onPickFromAlbum?: (() => void) | undefined;
  onToggleTorch: () => void;
  /** 预览视图实测尺寸（dp），用于二维码坐标映射 */
  onPreviewLayout?: ((size: { width: number; height: number }) => void) | undefined;
  paddingXl: number;
  scanTipText?: string;
  showAlbumButton?: boolean;
  showScanMask?: boolean;
  showScanTip?: boolean;
  torchFontSize: number;
  torchLabel: string;
}

export const QrScanCameraLayer = memo(
  ({
    activeColor,
    albumFontSize,
    albumText,
    backIconVariant = 'default',
    cameraActive,
    cameraOptions,
    codeScanner,
    device,
    inactiveColor,
    isTorchOn,
    onBack,
    onPickFromAlbum,
    onToggleTorch,
    onPreviewLayout,
    paddingXl,
    scanTipText,
    showAlbumButton = false,
    showScanMask = true,
    showScanTip = true,
    torchFontSize,
    torchLabel,
  }: QrScanCameraLayerProps) => {
    const BackButtonIcon = backIconVariant === 'white' ? WhiteBackIcon : BackIcon;

    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      onPreviewLayout?.({ width, height });
    };

    return (
      <View style={cameraStyles.layer} onLayout={handleLayout}>
        <DynamicZoomCamera
          key={cameraOptions?.format ? device.id : undefined}
          codeScanner={codeScanner}
          device={device}
          isActive={cameraActive}
          photo={cameraOptions?.photo ?? false}
          style={StyleSheet.absoluteFill}
          torch={cameraActive && isTorchOn ? 'on' : 'off'}
          {...(cameraOptions?.format ? { format: cameraOptions.format } : {})}
          {...(cameraOptions?.resizeMode ? { resizeMode: cameraOptions.resizeMode } : {})}
          {...(cameraOptions?.video !== undefined ? { video: cameraOptions.video } : {})}
          {...(cameraOptions?.audio !== undefined ? { audio: cameraOptions.audio } : {})}
          {...(cameraOptions?.exposure !== undefined ? { exposure: cameraOptions.exposure } : {})}
          {...(cameraOptions?.zoomShared ? { zoomShared: cameraOptions.zoomShared } : {})}
          {...(cameraOptions?.minZoom !== undefined ? { minZoom: cameraOptions.minZoom } : {})}
          {...(cameraOptions?.maxZoom !== undefined ? { maxZoom: cameraOptions.maxZoom } : {})}
          {...(cameraOptions?.onGestureStart
            ? { onGestureStart: cameraOptions.onGestureStart }
            : {})}
          {...(cameraOptions?.onGestureEnd ? { onGestureEnd: cameraOptions.onGestureEnd } : {})}
          {...(cameraOptions?.zoom !== undefined ? { zoom: cameraOptions.zoom } : {})}
          {...(cameraOptions?.enableZoomGesture !== undefined
            ? { enableZoomGesture: cameraOptions.enableZoomGesture }
            : {})}
        />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {cameraActive && showScanMask ? <ScanMaskOverlay /> : null}

          <SafeAreaHeader absolute compensateTopBleed contentSpacing={0}>
            <Pressable hitSlop={12} onPress={onBack} style={cameraStyles.backButton}>
              {backIconVariant === 'white' ? (
                <BackButtonIcon style={{ width: 24, height: 24 }} />
              ) : (
                <BackButtonIcon width={20} height={20} color="#FFFFFF" />
              )}
            </Pressable>
          </SafeAreaHeader>

          {cameraActive ? (
            <TorchToggle
              activeColor={activeColor}
              fontSize={torchFontSize}
              inactiveColor={inactiveColor}
              isOn={isTorchOn}
              label={torchLabel}
              onPress={onToggleTorch}
            />
          ) : null}

          {cameraActive && (showScanTip || showAlbumButton) ? (
            <BottomActions
              albumFontSize={albumFontSize}
              albumText={albumText}
              onPickFromAlbum={onPickFromAlbum}
              paddingXl={paddingXl}
              showAlbumButton={showAlbumButton}
              showScanTip={showScanTip}
              textColor={inactiveColor}
              tipText={scanTipText ?? ''}
            />
          ) : null}
        </View>
      </View>
    );
  },
);

QrScanCameraLayer.displayName = 'QrScanCameraLayer';

export const QrScanCameraContainer = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const topBleed = getSafeAreaTopInset(insets.top);

  return (
    <View style={[cameraStyles.container, topBleed > 0 && { marginTop: -topBleed }]}>
      {children}
    </View>
  );
};

const cameraStyles = StyleSheet.create({
  container: { backgroundColor: '#000000', flex: 1 },
  layer: { flex: 1, overflow: 'hidden' },
  backButton: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    height: STACK_HEADER_TOOLBAR_HEIGHT,
    justifyContent: 'center',
    minWidth: STACK_HEADER_TOOLBAR_HEIGHT,
  },
});
