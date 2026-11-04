import type { CalcResult } from '../engine/types'
import { dealLevel, fmt, pct } from '../utils/helpers'

interface Props {
  result: CalcResult
  empty?: boolean
}

export default function ResultPanel({ result, empty }: Props) {
  const level = dealLevel(result.savedRate)
  const isLoss = result.totalSaved < 0

  if (empty) {
    return (
      <div className="card p-8 text-center animate-fade-up">
        <div className="text-4xl mb-3">📊</div>
        <h2 className="font-semibold text-slate-700">还等着你填数据</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          填好商品和优惠后，这里会实时显示
          <br />
          到手价、省了多少，以及每一层优惠的明细。
        </p>
        <div className="mt-5 text-xs text-slate-300 leading-relaxed">
          顺序：商品原价 → 会员/多件折 → 满减 → 优惠券 → 红包积分 → 运费
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h2 className="font-semibold text-slate-800 mb-3">📊 测算结果</h2>

      {/* 到手价大卡 */}
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-5">
        <div className="text-sm opacity-90">到手价（实付）</div>
        <div className="text-4xl font-bold mt-1">{fmt(result.finalPay)}</div>
        {result.shippingFee > 0 && (
          <div className="text-xs opacity-80 mt-1">其中运费 {fmt(result.shippingFee)}</div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm opacity-95">
          <span>
            原价 <s>{fmt(result.originalTotal)}</s>
          </span>
          <span className={isLoss ? 'text-rose-200' : ''}>
            {isLoss ? `多花 ${fmt(-result.totalSaved)}` : `省 ${fmt(result.totalSaved)}`}
          </span>
          <span className="tag bg-white/25 text-white">
            {isLoss ? `多花 ${pct(-result.savedRate)}` : `省 ${pct(result.savedRate)}`}
          </span>
          <span className={`tag ${level.cls}`}>{level.label}</span>
        </div>
      </div>

      {/* 逐层明细 */}
      <div className="mt-4">
        <div className="text-sm font-medium text-slate-600 mb-2">优惠明细（从上到下叠加）</div>
        <div className="space-y-1.5">
          {result.breakdown.map((b) => {
            const isAnchor = b.kind === 'goods'
            const isCashback = b.kind === 'cashback'
            const isShipping = b.kind === 'shipping'
            return (
              <div
                key={b.key}
                className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-slate-700">{b.label}</div>
                  {b.note && <div className="text-xs text-slate-400">{b.note}</div>}
                </div>
                <div className="text-right shrink-0 ml-2">
                  {isAnchor ? (
                    <span className="text-slate-500">{fmt(b.baseAmount)}</span>
                  ) : isShipping ? (
                    b.saved > 0 ? (
                      <span className="text-rose-500">+ {fmt(b.saved)}</span>
                    ) : (
                      <span className="text-emerald-600">包邮</span>
                    )
                  ) : isCashback ? (
                    <span className="text-sky-600">返 +{fmt(b.saved)}</span>
                  ) : b.saved > 0 ? (
                    <span className="text-emerald-600">- {fmt(b.saved)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                  {!isAnchor && b.baseAmount > 0 && (
                    <div className="text-xs text-slate-300">基数 {fmt(b.baseAmount)}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 会员回本 */}
      {result.member?.active && (
        <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
          <div className="text-sm font-medium text-indigo-700 mb-1">💎 会员回本</div>
          <div className="text-sm text-slate-600">{result.member.note}</div>
          {result.member.breakevenPurchases != null && (
            <div className="text-xs text-indigo-500 mt-1">
              约 {result.member.breakevenPurchases} 次同类消费回本
            </div>
          )}
        </div>
      )}

      {/* 凑单建议 */}
      {result.combo.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3">
          <div className="text-sm font-medium text-amber-700 mb-1">🧮 凑单建议</div>
          <ul className="space-y-1.5">
            {result.combo.map((c) => (
              <li key={c.promotionId} className="text-sm text-slate-600">
                <span className={c.worthIt ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                  {c.label}：
                </span>
                {c.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
