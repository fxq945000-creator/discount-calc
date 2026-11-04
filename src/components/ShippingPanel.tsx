import type { Shipping } from '../engine/types'
import { fmt } from '../utils/helpers'
import NumberInput from './NumberInput'

interface Props {
  shipping: Shipping
  /** 券后金额，用于提示离包邮门槛还差多少 */
  payAmount: number
  onChange: (s: Shipping) => void
}

export default function ShippingPanel({ shipping, payAmount, onChange }: Props) {
  const threshold = shipping.freeThreshold ?? 0
  const reached = threshold > 0 && payAmount >= threshold
  const gap = threshold > 0 && !reached ? Math.round((threshold - payAmount) * 100) / 100 : 0

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">🚚 运费</h2>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={shipping.enabled}
            onChange={(e) => onChange({ ...shipping, enabled: e.target.checked })}
          />
          需要付运费
        </label>
      </div>

      {!shipping.enabled ? (
        <p className="text-xs text-slate-400 mt-2">默认不计运费（多为包邮）。需要时勾选上面。</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <label className="text-xs text-slate-500">
              运费金额
              <NumberInput
                className="input mt-1"
                value={shipping.fee}
                min={0}
                placeholder="如 12"
                ariaLabel="运费金额"
                onChange={(v) => onChange({ ...shipping, fee: v ?? 0 })}
              />
            </label>
            <label className="text-xs text-slate-500">
              满额包邮（可选）
              <NumberInput
                className="input mt-1"
                value={shipping.freeThreshold}
                min={0}
                placeholder="如 99，留空不包邮"
                ariaLabel="满额包邮门槛"
                onChange={(v) => onChange({ ...shipping, freeThreshold: v })}
              />
            </label>
          </div>

          {threshold > 0 && (
            <p className={`text-xs mt-2 ${reached ? 'text-emerald-600' : 'text-amber-600'}`}>
              {reached
                ? `券后 ${fmt(payAmount)} 已满 ${fmt(threshold)}，自动包邮`
                : `券后 ${fmt(payAmount)}，还差 ${fmt(gap)} 可包邮（运费 ${fmt(shipping.fee)}）`}
            </p>
          )}
          {threshold === 0 && shipping.fee > 0 && (
            <p className="text-xs text-slate-400 mt-2">无论金额多少都要付 {fmt(shipping.fee)} 运费</p>
          )}
        </>
      )}
    </div>
  )
}
