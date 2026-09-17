import { useCallback, useState } from 'react'

/**
 * Состояние, живущее только внутри текущего раунда: при смене idx автоматически
 * возвращается к initial — без useEffect и лишнего рендера со старыми данными.
 */
export function useRoundState(idx, initial) {
  const [state, setState] = useState({ idx, value: initial })
  const value = state.idx === idx ? state.value : initial
  const set = useCallback(
    (next) => setState((s) => ({ idx, value: typeof next === 'function' ? next(s.idx === idx ? s.value : initial) : next })),
    [idx, initial],
  )
  return [value, set]
}
