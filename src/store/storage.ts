import { normalizeState, toPlan, type AppState, type PlanData } from './state'

const HISTORY_KEY = 'dc_history_v1'
const DRAFT_KEY = 'dc_draft_v1'

/** 读取上次未提交的草稿（刷新/关页面后恢复） */
export function loadDraft(): AppState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return normalizeState(JSON.parse(raw))
  } catch {
    return null
  }
}

/** 保存草稿（自动保存，无需用户操作） */
export function saveDraft(state: AppState): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  } catch {
    /* 忽略写入失败（隐私模式/容量满） */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* 忽略 */
  }
}

export interface HistoryEntry {
  id: string
  title: string
  ts: number
  state: PlanData
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
    if (!Array.isArray(arr)) return []
    // 兼容旧记录（可能没有 shipping 字段）
    return arr
      .filter((e) => e && e.id && e.state && Array.isArray(e.state.items))
      .map((e) => ({ ...e, state: toPlan(normalizeState(e.state)) }))
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
