import type { AppState } from './state'

const HISTORY_KEY = 'dc_history_v1'

export interface HistoryEntry {
  id: string
  title: string
  ts: number
  state: AppState
  summary: {
    originalTotal: number
    finalPay: number
    totalSaved: number
    savedRate: number
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function persist(list: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 忽略写入失败 */
  }
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'ts'>): HistoryEntry[] {
  const list = loadHistory()
  const full: HistoryEntry = { ...entry, id: 'h' + Date.now().toString(36), ts: Date.now() }
  list.unshift(full)
  persist(list.slice(0, 50))
  return loadHistory()
}

export function deleteHistory(id: string): HistoryEntry[] {
  const list = loadHistory().filter((h) => h.id !== id)
  persist(list)
  return list
}

export function clearHistory(): HistoryEntry[] {
  persist([])
  return []
}
