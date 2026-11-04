import type { Promotion, PromotionType, Scope } from '../engine/types'
import { uid } from '../utils/helpers'

interface Props {
  promotions: Promotion[]
  onChange: (promotions: Promotion[]) => void
}

const QUICK: { type: PromotionType; label: string }[] = [
  { type: 'threshold', label: '满减/满折' },
  { type: 'coupon', label: '优惠券' },
  { type: 'member', label: '会员/折扣' },
  { type: 'deduct', label: '红包/积分' },
  { type: 'cashback', label: '返现/返利' }
]

function newPromo(type: PromotionType): Promotion {
  const base = { id: uid('p'), type, scope: 'shop' as Scope }
  switch (type) {
    case 'threshold':
      return { ...base, label: '满减', threshold: 200, reduce: 30 }
    case 'coupon':
      return { ...base, label: '优惠券', scope: 'platform', threshold: 100, reduce: 10 }
    case 'member':
      return { ...base, label: '会员折扣', scope: 'order', memberDiscountRate: 0.9, annualFee: 0 }
    case 'deduct':
      return { ...base, label: '红包', scope: 'order', amount: 10 }
    case 'cashback':
      return { ...base, label: '返现', scope: 'order', cashbackRate: 0 }
  }
}

export default function PromotionPanel({ promotions, onChange }: Props) {
  const update = (id: string, patch: Partial<Promotion>) =>
    onChange(promotions.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => onChange(promotions.filter((p) => p.id !== id))
  const add = (type: PromotionType) => onChange([...promotions, newPromo(type)])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">🏷️ 促销 / 优惠</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK.map((q) => (
          <button key={q.type} className="btn btn-ghost" onClick={() => add(q.type)}>
            + {q.label}
          </button>
        ))}
      </div>

      {promotions.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center">还没加优惠，用上面按钮添加。</p>
      )}

      <div className="space-y-3">
        {promotions.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
            <div className="flex gap-2 items-center">
              <span className="tag bg-brand/10 text-brand">{typeLabel(p.type)}</span>
              <input
                className="input flex-1"
                placeholder="备注（如：店铺满减）"
                value={p.label ?? ''}
                onChange={(e) => update(p.id, { label: e.target.value })}
              />
              <button
                className="btn btn-ghost px-2.5 text-rose-500"
                title="删除"
                onClick={() => remove(p.id)}
              >
                ✕
              </button>
            </div>

            {(p.type === 'threshold' || p.type === 'coupon') && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  范围
                  <select
                    className="input mt-1"
                    value={p.scope}
                    onChange={(e) => update(p.id, { scope: e.target.value as Scope })}
                  >
                    <option value="shop">店铺</option>
                    <option value="platform">平台</option>
                    <option value="order">订单</option>
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  满 X 元
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={p.threshold ?? ''}
                    onChange={(e) => update(p.id, { threshold: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  减 Y 元
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={p.reduce ?? ''}
                    placeholder="填减额或打折"
                    onChange={(e) =>
                      update(p.id, {
                        reduce: e.target.value === '' ? undefined : Number(e.target.value),
                        discountRate: undefined
                      })
                    }
                  />
                </label>
                <label className="text-xs text-slate-500">
                  或打几折
                  <input
                    className="input mt-1"
                    type="number"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={p.discountRate ?? ''}
                    placeholder="0.9 = 9折"
                    onChange={(e) =>
                      update(p.id, {
                        discountRate: e.target.value === '' ? undefined : Number(e.target.value),
                        reduce: undefined
                      })
                    }
                  />
                </label>
              </div>
            )}

            {p.type === 'member' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  会员折扣（0.9=9折）
                  <input
                    className="input mt-1"
                    type="number"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={p.memberDiscountRate ?? ''}
                    onChange={(e) => update(p.id, { memberDiscountRate: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  会员年费（回本测算）
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={p.annualFee ?? ''}
                    onChange={(e) => update(p.id, { annualFee: Number(e.target.value) })}
                  />
                </label>
              </div>
            )}

            {p.type === 'deduct' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  抵扣额
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={p.amount ?? ''}
                    onChange={(e) => update(p.id, { amount: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  封顶（可选）
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={p.cap ?? ''}
                    placeholder="不填不封顶"
                    onChange={(e) =>
                      update(p.id, { cap: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </label>
              </div>
            )}

            {p.type === 'cashback' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  返现比例（0.05=5%）
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={p.cashbackRate ?? ''}
                    onChange={(e) => update(p.id, { cashbackRate: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  固定返现额
                  <input
                    className="input mt-1"
                    type="number"
                    min="0"
                    value={p.cashbackAmount ?? ''}
                    placeholder="可选"
                    onChange={(e) =>
                      update(p.id, { cashbackAmount: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function typeLabel(t: PromotionType): string {
  switch (t) {
    case 'threshold':
      return '满减/满折'
    case 'coupon':
      return '优惠券'
    case 'member':
      return '会员'
    case 'deduct':
      return '抵扣'
    case 'cashback':
      return '返现'
  }
}
