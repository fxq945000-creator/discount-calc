const GUIDE_KEY = 'dc_guide_seen_v1'

/** 是否已看过新手引导 */
export function hasSeenGuide(): boolean {
  try {
    return localStorage.getItem(GUIDE_KEY) === '1'
  } catch {
    return false
  }
}

/** 标记已看过（用户关闭引导时调用） */
export function markGuideSeen(): void {
  try {
    localStorage.setItem(GUIDE_KEY, '1')
  } catch {
    /* 忽略写入失败（隐私模式等） */
  }
}

/** 重置引导状态，下次刷新会重新弹出 */
export function resetGuide(): void {
  try {
    localStorage.removeItem(GUIDE_KEY)
  } catch {
    /* 忽略 */
  }
}
