import { useEffect, useState } from 'react';
import { Camera } from 'react-native-vision-camera';

export const useCameraAccess = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isGranted, setIsGranted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const request = async () => {
      setIsRequesting(true);
      try {
        const current = Camera.getCameraPermissionStatus();
        if (current === 'granted') {
          if (mounted) {
            setIsGranted(true);
          }
          return;
        }

        const next = await Camera.requestCameraPermission();
        if (mounted) {
          setIsGranted(next === 'granted');
        }
      } finally {
        if (mounted) {
          setIsRequesting(false);
        }
      }
    };

    void request();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    isCameraGranted: isGranted,
    isRequesting,
  };
};
