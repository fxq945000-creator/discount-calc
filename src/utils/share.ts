import { normalizeState, type AppState, type PlanData } from '../store/state'

/** UTF-8 安全的 base64 编码（分享链接里含中文商品名） */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** 只序列化方案数据，不把对比快照塞进链接 */
function planOf(state: PlanData): PlanData {
  return {
    preset: state.preset,
    items: state.items,
    promotions: state.promotions,
    shipping: state.shipping
  }
}

/** 把状态编码进 URL hash（base64），便于分享/跨设备 */
export function encodeState(state: PlanData): string {
  return utf8ToBase64(JSON.stringify(planOf(state)))
}

export function decodeState(hash: string): AppState | null {
  try {
    const b64 = hash.startsWith('#') ? hash.slice(1) : hash
    if (!b64) return null
    // 兼容旧的 #s=xxx 写法
    const payload = b64.startsWith('s=') ? b64.slice(2) : b64
    if (!payload) return null
    const obj = JSON.parse(base64ToUtf8(payload))
    if (!obj || !Array.isArray(obj.items) || !Array.isArray(obj.promotions)) return null
    return normalizeState(obj)
  } catch {
    return null
  }
}

export function buildShareUrl(state: PlanData): string {
  const base = location.origin + location.pathname
  return `${base}#s=${encodeState(state)}`
}

export async function copyShareUrl(state: PlanData): Promise<boolean> {
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
