import { Modal } from 'design-system-native';

interface ReceivingQrErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  okText?: string;
  onOk: () => void;
}

export const ReceivingQrErrorModal = ({
  visible,
  title = '提示',
  message,
  okText = '重新扫描',
  onOk,
}: ReceivingQrErrorModalProps) => (
  <Modal
    visible={visible}
    onClose={onOk}
    title={title}
    content={message}
    okText={okText}
    onOk={onOk}
  />
);
