import { useState, useEffect, useCallback, useRef } from "react"

interface FetchListOptions {
  url: string
  params?: Record<string, string>
  debounceMs?: number
}

interface FetchListResult<T> {
  data: T[]
  total: number
  totalPages: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFetchList<T>({ url, params }: FetchListOptions): FetchListResult<T> {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const query = new URLSearchParams(params || {}).toString()
      const res = await fetch(`${url}${query ? `?${query}` : ""}`, {
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch")
      const json = await res.json()

      if (!controller.signal.aborted) {
        setData(json.members || json.payments || json.memberships || json.activities || json.attendance || json.data || [])
        setTotal(json.total || 0)
        setTotalPages(json.totalPages || 1)
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setError((err as Error).message)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [url, JSON.stringify(params)])

  useEffect(() => {
    fetchData()
    return () => abortRef.current?.abort()
  }, [fetchData])

  return { data, total, totalPages, loading, error, refetch: fetchData }
}
