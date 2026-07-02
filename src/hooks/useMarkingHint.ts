import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 管理“画框提示气泡”的显示时机。
 * 进入画框模式时显示 3 秒，退出或卸载时清理定时器。
 */
export const useMarkingHint = () => {
  const [isMarking, setIsMarking] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHintTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showHint = useCallback(
    (duration = 3000) => {
      clearHintTimer();
      setHintVisible(true);

      timerRef.current = setTimeout(() => {
        setHintVisible(false);
        timerRef.current = null;
      }, duration);
    },
    [clearHintTimer],
  );

  const toggleMarking = useCallback(() => {
    setIsMarking((prev) => {
      const next = !prev;

      if (next) {
        showHint();
      } else {
        clearHintTimer();
        setHintVisible(false);
      }

      return next;
    });
  }, [clearHintTimer, showHint]);

  useEffect(() => {
    return () => {
      clearHintTimer();
    };
  }, [clearHintTimer]);

  return {
    hintVisible,
    isMarking,
    setHintVisible,
    toggleMarking,
  };
};
