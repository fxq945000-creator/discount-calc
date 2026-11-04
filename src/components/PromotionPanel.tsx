import type { Promotion, PromotionType, Scope } from '../engine/types'
import { normalizeRateInput, rateLabel, uid } from '../utils/helpers'
import NumberInput from './NumberInput'

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
        <div className="py-6 text-center animate-fade-up">
          <div className="text-3xl mb-2">🎫</div>
          <p className="text-sm font-medium text-slate-600">还没有优惠</p>
          <p className="text-xs text-slate-400 mt-1">
            有满减、券、会员折扣就点上面加一条；没有也能算，直接看裸价
          </p>
        </div>
      )}

      <div className="space-y-3">
        {promotions.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
            <div className="flex gap-2 items-center">
              <span className="tag bg-brand/10 text-brand shrink-0">{typeLabel(p.type)}</span>
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
                  <NumberInput
                    className="input mt-1"
                    value={p.threshold}
                    min={0}
                    placeholder="如 200"
                    ariaLabel="满多少元"
                    onChange={(v) => update(p.id, { threshold: v ?? 0 })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  减 Y 元
                  <NumberInput
                    className="input mt-1"
                    value={p.reduce}
                    min={0}
                    placeholder="填减额或打折"
                    ariaLabel="减多少元"
                    onChange={(v) => update(p.id, { reduce: v, discountRate: undefined })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  或打几折
                  <NumberInput
                    className="input mt-1"
                    value={p.discountRate}
                    min={0.1}
                    max={1}
                    normalize={normalizeRateInput}
                    placeholder="9 = 9折"
                    ariaLabel="打几折"
                    onChange={(v) =>
                      update(p.id, {
                        discountRate: v == null ? undefined : normalizeRateInput(v),
                        reduce: undefined
                      })
                    }
                  />
                  {p.discountRate != null && (
                    <span className="text-[11px] text-brand">
                      = {rateLabel(normalizeRateInput(p.discountRate))}
                    </span>
                  )}
                </label>
              </div>
            )}

            {p.type === 'member' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  会员折扣
                  <NumberInput
                    className="input mt-1"
                    value={p.memberDiscountRate}
                    min={0.1}
                    max={1}
                    normalize={normalizeRateInput}
                    placeholder="9 = 9折"
                    ariaLabel="会员折扣"
                    onChange={(v) => update(p.id, { memberDiscountRate: normalizeRateInput(v ?? 1) })}
                  />
                  <span className="text-[11px] text-brand">
                    = {rateLabel(normalizeRateInput(p.memberDiscountRate ?? 1))}
                  </span>
                </label>
                <label className="text-xs text-slate-500">
                  会员年费（回本测算）
                  <NumberInput
                    className="input mt-1"
                    value={p.annualFee}
                    min={0}
                    placeholder="如 88"
                    ariaLabel="会员年费"
                    onChange={(v) => update(p.id, { annualFee: v ?? 0 })}
                  />
                </label>
              </div>
            )}

            {p.type === 'deduct' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  抵扣额
                  <NumberInput
                    className="input mt-1"
                    value={p.amount}
                    min={0}
                    placeholder="如 10"
                    ariaLabel="抵扣额"
                    onChange={(v) => update(p.id, { amount: v ?? 0 })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  封顶（可选）
                  <NumberInput
                    className="input mt-1"
                    value={p.cap}
                    min={0}
                    placeholder="不填不封顶"
                    ariaLabel="抵扣封顶"
                    onChange={(v) => update(p.id, { cap: v })}
                  />
                </label>
              </div>
            )}

            {p.type === 'cashback' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-slate-500">
                  返现比例（%）
                  <NumberInput
                    className="input mt-1"
                    value={p.cashbackRate != null ? Math.round(p.cashbackRate * 1000) / 10 : undefined}
                    min={0}
                    max={100}
                    placeholder="如 5 表示 5%"
                    ariaLabel="返现比例百分比"
                    onChange={(v) => update(p.id, { cashbackRate: (v ?? 0) / 100 })}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  固定返现额
                  <NumberInput
                    className="input mt-1"
                    value={p.cashbackAmount}
                    min={0}
                    placeholder="可选"
                    ariaLabel="固定返现额"
                    onChange={(v) => update(p.id, { cashbackAmount: v })}
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
