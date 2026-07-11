import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { QRCodeScanner } from 'design-system-native/qr-code-scanner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';

import { qrCodeScanImage } from '@/components/images';
import { useToast } from '@/components/toast/Toast';
import { useLogisticsQrScanTexts } from '@/hooks/useLogisticsQrScan';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingQrErrorModal } from '@/sections/receiving/ReceivingQrErrorModal';
import { receivingService } from '@/services/receiving/receivingService';
import { navPerf, navPerfModuleLoad, navPerfScheduleProbes } from '@/utils/navPerf';

navPerfModuleLoad('QrScanScreenPage');

type QrScanScreenPageProps = LogisticsScreenProps<'QrScan'>;

export const QrScanScreenPage = ({ navigation }: QrScanScreenPageProps) => {
  const firstRenderLogged = useRef(false);
  if (!firstRenderLogged.current) {
    firstRenderLogged.current = true;
    navPerf('qrScan', 'first-render');
    navPerfScheduleProbes('qrScan', 'first-render');
  }

  const isFocused = useIsFocused();
  const texts = useLogisticsQrScanTexts();
  const { showToast } = useToast();
  const [qrErrorVisible, setQrErrorVisible] = useState(false);
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [resolving, setResolving] = useState(false);
  // 先挂载扫码 UI（active=false），再激活相机，避免 HAL 冷启动堵死首帧
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const laidOutRef = useRef(false);
  const scannerLaidOutRef = useRef(false);

  useEffect(() => {
    navPerf('qrScan', 'mount-effect', { isFocused });
  }, [isFocused]);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setScannerReady(true);
        navPerf('qrScan', 'scanner-armed');
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    if (!scannerReady) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setCameraActive(true);
        navPerf('qrScan', 'camera-armed');
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [scannerReady]);

  useFocusEffect(
    useCallback(() => {
      navPerf('qrScan', 'focus-effect-start');
      navigation.setOptions({ statusBarStyle: 'light' });
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }

      const tabNavigation = navigation.getParent();
      tabNavigation?.setOptions({ tabBarStyle: { display: 'none' } });
      navPerf('qrScan', 'focus-effect-end');

      return () => {
        tabNavigation?.setOptions({ tabBarStyle: undefined });
        navPerf('qrScan', 'blur');
      };
    }, [navigation]),
  );

  const handleScanValue = useCallback(
    async (value: string) => {
      if (resolving) return;
      setResolving(true);
      try {
        const detail = await receivingService.resolveQrCode(value);
        if (!detail) {
          setQrErrorMessage('未识别到有效二维码，请确认二维码是否正确');
          setQrErrorVisible(true);
          return;
        }
        await receivingService.selectProductionColor(detail.id);
        showToast('已选中生产色', { duration: 3000 });
        navigation.goBack();
      } catch {
        setQrErrorMessage('网络连接异常，请确保网络连接正常');
        setQrErrorVisible(true);
      } finally {
        setResolving(false);
      }
    },
    [navigation, resolving, showToast],
  );

  const handlePerfPhase = useCallback((phase: string, extra?: Record<string, unknown>) => {
    navPerf('qrScan', phase, extra);
  }, []);

  const renderBodyEnded = useRef(false);
  if (!renderBodyEnded.current) {
    renderBodyEnded.current = true;
    navPerf('qrScan', 'render-body-end', { scannerReady });
  }

  return (
    <View
      style={styles.root}
      onLayout={() => {
        if (laidOutRef.current) return;
        laidOutRef.current = true;
        navPerf('qrScan', 'root-layout');
      }}
    >
      {scannerReady ? (
        <View
          style={styles.scanner}
          onLayout={() => {
            if (scannerLaidOutRef.current) return;
            scannerLaidOutRef.current = true;
            navPerf('qrScan', 'scanner-layout');
          }}
        >
          <QRCodeScanner
            active={isFocused && cameraActive}
            backIconVariant="white"
            enableAlbum
            enableAutoZoom
            enablePinchZoom
            enableTorch
            onBack={() => navigation.goBack()}
            onError={() => showToast('识别失败', { duration: 3000 })}
            onMultiCodePress={(marker) => {
              void handleScanValue(marker.value);
            }}
            onPerfPhase={handlePerfPhase}
            onScan={(result) => {
              void handleScanValue(result.value);
            }}
            scanFrameImage={qrCodeScanImage}
            style={styles.scanner}
            texts={texts}
          />
        </View>
      ) : null}

      <ReceivingQrErrorModal
        visible={qrErrorVisible}
        message={qrErrorMessage}
        okText={qrErrorMessage.includes('网络') ? '重试' : '重新扫描'}
        onOk={() => setQrErrorVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scanner: {
    flex: 1,
  },
});
