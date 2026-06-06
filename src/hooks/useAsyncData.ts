import { useState, useEffect, useRef } from 'react'

type AsyncState<T> =
  | { data: null; loading: true; error: false }
  | { data: T; loading: false; error: false }
  | { data: null; loading: false; error: true }

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = []
): AsyncState<T> {
  // state
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: false })

  // ref
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  // fetch
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ data: null, loading: true, error: false })
    fetcherRef.current()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: false }) })
      .catch(() => { if (!cancelled) setState({ data: null, loading: false, error: true }) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
