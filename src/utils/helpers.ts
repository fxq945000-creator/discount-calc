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

/** 根据省率给出划算等级 */
export function dealLevel(savedRate: number): { label: string; cls: string } {
  if (savedRate >= 0.3) return { label: '超划算', cls: 'bg-emerald-100 text-emerald-700' }
  if (savedRate >= 0.15) return { label: '挺划算', cls: 'bg-green-100 text-green-700' }
  if (savedRate >= 0.05) return { label: '一般', cls: 'bg-amber-100 text-amber-700' }
  if (savedRate > 0) return { label: '略省', cls: 'bg-slate-100 text-slate-600' }
  return { label: '没优惠', cls: 'bg-slate-100 text-slate-500' }
}
