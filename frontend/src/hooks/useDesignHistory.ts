import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { DesignSnapshot } from '@/types'

interface HistoryState {
  past: DesignSnapshot[]
  present: DesignSnapshot | null
  future: DesignSnapshot[]
}

type HistoryAction =
  | { type: 'reset'; snapshot: DesignSnapshot }
  | { type: 'update'; snapshot: DesignSnapshot; push: boolean }
  | { type: 'undo' }
  | { type: 'redo' }

const MAX_HISTORY = 60

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'reset':
      return { past: [], present: action.snapshot, future: [] }
    case 'update':
      return {
        past: action.push && state.present
          ? [...state.past, state.present].slice(-MAX_HISTORY)
          : state.past,
        present: action.snapshot,
        future: [],
      }
    case 'undo': {
      if (!state.past.length) return state
      const previous = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: state.present ? [state.present, ...state.future].slice(0, MAX_HISTORY) : state.future,
      }
    }
    case 'redo': {
      if (!state.future.length) return state
      const next = state.future[0]
      return {
        past: state.present ? [...state.past, state.present].slice(-MAX_HISTORY) : state.past,
        present: next,
        future: state.future.slice(1),
      }
    }
    default:
      return state
  }
}

export function useDesignHistory(initial: DesignSnapshot | null = null) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initial,
    future: [],
  })
  const presentRef = useRef<DesignSnapshot | null>(initial)
  const lastPushRef = useRef(0)

  useEffect(() => {
    presentRef.current = state.present
  }, [state.present])

  const reset = useCallback((snapshot: DesignSnapshot) => {
    presentRef.current = snapshot
    lastPushRef.current = Date.now()
    dispatch({ type: 'reset', snapshot })
  }, [])

  const update = useCallback(
    (
      updater: DesignSnapshot | ((current: DesignSnapshot) => DesignSnapshot),
      options?: { history?: boolean; force?: boolean },
    ) => {
      const current = presentRef.current
      if (!current) return

      const next = typeof updater === 'function' ? updater(current) : updater
      const now = Date.now()
      const push = options?.history !== false && (options?.force || now - lastPushRef.current > 700)

      if (push) {
        lastPushRef.current = now
      }

      presentRef.current = next
      dispatch({ type: 'update', snapshot: next, push })
    },
    [],
  )

  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])

  return useMemo(
    () => ({
      snapshot: state.present,
      update,
      reset,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      historyLength: state.past.length,
    }),
    [state.present, state.past.length, state.future.length, update, reset, undo, redo],
  )
}
