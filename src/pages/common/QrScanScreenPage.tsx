import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useToast } from 'design-system-native';
import { QRCodeScanner } from 'design-system-native/qr-code-scanner';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';

import { qrCodeScanImage } from '@/components/images';
import { INVALID_PRODUCTION_QR_MODAL } from '@/constants/receiving';
import { useLogisticsQrScanTexts } from '@/hooks/useLogisticsQrScan';
import type { LogisticsScreenProps } from '@/navigation/types';
import { ReceivingQrErrorModal } from '@/sections/receiving/ReceivingQrErrorModal';
import { receivingService } from '@/services/receiving/receivingService';

type QrScanScreenPageProps = LogisticsScreenProps<'QrScan'>;

export const QrScanScreenPage = ({ navigation }: QrScanScreenPageProps) => {
  const isFocused = useIsFocused();
  const texts = useLogisticsQrScanTexts();
  const toast = useToast();
  const [qrErrorVisible, setQrErrorVisible] = useState(false);
  const [qrErrorTitle, setQrErrorTitle] = useState('提示');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [qrErrorOkText, setQrErrorOkText] = useState('重新扫描');
  const [resolving, setResolving] = useState(false);
  // 先挂载扫码 UI（active=false），再激活相机，避免 HAL 冷启动堵死首帧
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setScannerReady(true);
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
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [scannerReady]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ statusBarStyle: 'light' });
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }

      const tabNavigation = navigation.getParent();
      tabNavigation?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        tabNavigation?.setOptions({ tabBarStyle: undefined });
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
          setQrErrorTitle(INVALID_PRODUCTION_QR_MODAL.title);
          setQrErrorMessage(INVALID_PRODUCTION_QR_MODAL.message);
          setQrErrorOkText('重新扫描');
          setQrErrorVisible(true);
          return;
        }
        await receivingService.selectProductionColor(detail.id);
        toast.show({ title: '已选中生产色', duration: 3000 });
        navigation.goBack();
      } catch {
        setQrErrorTitle('提示');
        setQrErrorMessage('网络连接异常，请确保网络连接正常');
        setQrErrorOkText('重试');
        setQrErrorVisible(true);
      } finally {
        setResolving(false);
      }
    },
    [navigation, resolving, toast],
  );

  return (
    <View style={styles.root}>
      {scannerReady ? (
        <View style={styles.scanner}>
          <QRCodeScanner
            active={isFocused && cameraActive}
            backIconVariant="white"
            enableAlbum
            enableAutoZoom
            enablePinchZoom
            enableTorch
            onBack={() => navigation.goBack()}
            onError={() => toast.show({ title: '识别失败', duration: 3000 })}
            onMultiCodePress={(marker) => {
              void handleScanValue(marker.value);
            }}
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
        title={qrErrorTitle}
        message={qrErrorMessage}
        okText={qrErrorOkText}
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
