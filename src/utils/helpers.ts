/** 生成短 id */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/** 金额格式化：¥1,234.50 */
export function fmt(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return (
    '¥' +
    v.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  )
}

/** 百分比格式化：12.3% */
export function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

/** 根据省率给出划算等级（含运费导致「反而多花」的情况） */
export function dealLevel(savedRate: number): { label: string; cls: string } {
  if (savedRate < 0) return { label: '反而多花', cls: 'bg-rose-100 text-rose-600' }
  if (savedRate >= 0.3) return { label: '超划算', cls: 'bg-emerald-100 text-emerald-700' }
  if (savedRate >= 0.15) return { label: '挺划算', cls: 'bg-green-100 text-green-700' }
  if (savedRate >= 0.05) return { label: '一般', cls: 'bg-amber-100 text-amber-700' }
  if (savedRate > 0) return { label: '略省', cls: 'bg-slate-100 text-slate-600' }
  return { label: '没优惠', cls: 'bg-slate-100 text-slate-500' }
}

/**
 * 折扣输入容错：用户习惯填「9」表示 9 折，统一换算成 0.9。
 * 返回值范围 (0, 1]。
 */
export function normalizeRateInput(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1 && n <= 10) return Math.round((n / 10) * 1000) / 1000
  if (n > 10) return 1
  return n
}

/** 折扣率展示：0.9 → 9 折；0.85 → 8.5 折 */
export function rateLabel(rate: number): string {
  const v = Math.round(rate * 1000) / 100
  return `${v} 折`
}
