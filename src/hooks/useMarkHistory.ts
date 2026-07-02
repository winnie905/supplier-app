import { useCallback, useMemo, useReducer } from 'react';

import type { NormalizedRect } from '@/types/mark';

const DEFAULT_RECT: NormalizedRect = { nh: 0, nw: 0, nx: 0, ny: 0 };

interface MarkHistoryState {
  history: NormalizedRect[];
  index: number;
}

type MarkHistoryAction =
  | { type: 'commit'; rect: NormalizedRect }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; rect?: NormalizedRect };

const markHistoryReducer = (
  state: MarkHistoryState,
  action: MarkHistoryAction,
): MarkHistoryState => {
  switch (action.type) {
    case 'commit': {
      const current = state.history[state.index] ?? DEFAULT_RECT;
      const next = action.rect;

      // 相同矩形不重复入栈，避免历史记录污染
      const isSame =
        current.nx === next.nx &&
        current.ny === next.ny &&
        current.nw === next.nw &&
        current.nh === next.nh;

      if (isSame) {
        return state;
      }

      const trimmed = state.history.slice(0, state.index + 1);
      trimmed.push(next);

      return {
        history: trimmed,
        index: trimmed.length - 1,
      };
    }

    case 'undo':
      return {
        ...state,
        index: Math.max(0, state.index - 1),
      };

    case 'redo':
      return {
        ...state,
        index: Math.min(state.history.length - 1, state.index + 1),
      };

    case 'reset': {
      const rect = action.rect ?? DEFAULT_RECT;
      return {
        history: [rect],
        index: 0,
      };
    }

    default:
      return state;
  }
};

export const useMarkHistory = () => {
  const [state, dispatch] = useReducer(markHistoryReducer, {
    history: [DEFAULT_RECT],
    index: 0,
  });

  const currentRect = state.history[state.index] ?? DEFAULT_RECT;

  const commitRect = useCallback((rect: NormalizedRect) => {
    dispatch({ type: 'commit', rect });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'redo' });
  }, []);

  const reset = useCallback((rect?: NormalizedRect) => {
    dispatch({ type: 'reset', rect: rect ?? DEFAULT_RECT });
  }, []);

  const undoEnabled = state.index > 0;
  const redoEnabled = state.index < state.history.length - 1;

  return useMemo(
    () => ({
      commitRect,
      currentRect,
      history: state.history,
      index: state.index,
      redo,
      redoEnabled,
      reset,
      undo,
      undoEnabled,
    }),
    [
      commitRect,
      currentRect,
      redo,
      redoEnabled,
      reset,
      state.history,
      state.index,
      undo,
      undoEnabled,
    ],
  );
};
