import { useMemo } from 'react';

import { QrScanPage } from '@/components/qrScan';
import { useToast } from '@/components/toast/Toast';
import { QR_SCAN_STRINGS } from '@/constants/legalContent';
import type { QrCodeInfo } from '@/hooks/useQrScanFlow';
import { useQrScanFlow } from '@/hooks/useQrScanFlow';
import type { LogisticsScreenProps } from '@/navigation/types';

type QrScanScreenPageProps = LogisticsScreenProps<'QrScan'>;

export const QrScanScreenPage = ({ navigation }: QrScanScreenPageProps) => {
  const { showToast } = useToast();

  const texts = useMemo(
    () => ({
      back: QR_SCAN_STRINGS.back,
      scanRequestingPermission: QR_SCAN_STRINGS.scanRequestingPermission,
      scanNoPermission: QR_SCAN_STRINGS.scanNoPermission,
      scanTip: QR_SCAN_STRINGS.scanTip,
      scanTorch: QR_SCAN_STRINGS.scanTorch,
    }),
    [],
  );

  const handleSuccess = (codeInfo: QrCodeInfo) => {
    showToast(`${QR_SCAN_STRINGS.scanSuccess}: ${codeInfo.value ?? ''}`);
    navigation.goBack();
  };

  const flow = useQrScanFlow({
    onBack: () => navigation.goBack(),
    onSingle: handleSuccess,
    onMultiple: (codeInfos) => {
      if (codeInfos[0]) {
        handleSuccess(codeInfos[0]);
      }
    },
    onInvalid: () => {
      showToast('无效二维码');
    },
  });

  return (
    <QrScanPage
      cameraActive={flow.cameraActive}
      codeScanner={flow.codeScanner}
      device={flow.device}
      hasCameraAccess={flow.hasCameraAccess}
      isRequesting={flow.isRequesting}
      onBack={flow.handleBack}
      onPreviewLayout={flow.onPreviewLayout}
      onToggleTorch={flow.handleToggleTorch}
      texts={texts}
      torchOn={flow.torchOn}
      backIconVariant="white"
      cameraPreset="cover"
    />
  );
};
