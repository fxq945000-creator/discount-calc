import type { AppState } from '../store/state'

/** 把状态编码进 URL hash（base64），便于分享/跨设备 */
export function encodeState(state: AppState): string {
  const json = JSON.stringify(state)
  // 兼容中文：用 encodeURIComponent 再 btoa
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64
}

export function decodeState(hash: string): AppState | null {
  try {
    const b64 = hash.startsWith('#') ? hash.slice(1) : hash
    if (!b64) return null
    const json = decodeURIComponent(escape(atob(b64)))
    const obj = JSON.parse(json)
    if (obj && Array.isArray(obj.items) && Array.isArray(obj.promotions)) return obj as AppState
    return null
  } catch {
    return null
  }
}

export function buildShareUrl(state: AppState): string {
  const base = location.origin + location.pathname
  return `${base}#s=${encodeState(state)}`
}

export async function copyShareUrl(state: AppState): Promise<boolean> {
  const url = buildShareUrl(state)
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    // 降级方案
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}
