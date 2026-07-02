import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

const DEFAULT_DURATION = 2000;
interface ToastOptions {
  duration?: number;
  containerStyle?: ViewStyle;
  overlayStyle?: ViewStyle;
  textStyle?: TextStyle;
}

interface ToastItem {
  id: string;
  message: React.ReactNode;
  options: ToastOptions;
}

interface ToastContextType {
  showToast: (message: string | React.ReactNode, options?: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setCurrentToast(null));
  }, [opacity]);

  const showToast = useCallback(
    (message: string | React.ReactNode, options: ToastOptions = {}) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const id = Date.now().toString();
      const duration = options.duration ?? DEFAULT_DURATION;

      let content: React.ReactNode;
      if (typeof message === 'string') {
        content = <Text style={[styles.defaultText, options.textStyle]}>{message}</Text>;
      } else {
        content = message;
      }

      setCurrentToast({ id, message: content, options });

      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [opacity, hideToast],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {currentToast && (
        <Animated.View
          style={[styles.overlay, { opacity }, currentToast.options.overlayStyle]}
          pointerEvents="box-none"
        >
          <View style={[styles.container, currentToast.options.containerStyle]}>
            {currentToast.message}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(41, 44, 51, 0.85)',
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 14,
    color: '#ffffff',
  },
});
