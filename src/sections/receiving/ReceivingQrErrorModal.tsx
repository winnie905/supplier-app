import { AppModal } from '@/components/AppModal';

interface ReceivingQrErrorModalProps {
  visible: boolean;
  message: string;
  okText?: string;
  onOk: () => void;
}

export const ReceivingQrErrorModal = ({
  visible,
  message,
  okText = '重新扫描',
  onOk,
}: ReceivingQrErrorModalProps) => (
  <AppModal
    visible={visible}
    onClose={onOk}
    title="提示"
    content={message}
    okText={okText}
    onOk={onOk}
  />
);
