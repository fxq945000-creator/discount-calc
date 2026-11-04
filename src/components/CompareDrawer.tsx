import { useMemo } from 'react'
import { calculate } from '../engine/discountEngine'
import type { AppState, PlanData } from '../store/state'
import { dealLevel, fmt, pct } from '../utils/helpers'

type Slot = 'A' | 'B'

interface Props {
  open: boolean
  current: AppState
  onClose: () => void
  onSaveSlot: (slot: Slot) => void
  onLoadSlot: (slot: Slot) => void
  onClearSlot: (slot: Slot) => void
}

function SlotCard({
  label,
  plan,
  isBetter,
  onSave,
  onLoad,
  onClear
}: {
  label: string
  plan: PlanData | null
  isBetter: boolean
  onSave: () => void
  onLoad: () => void
  onClear: () => void
}) {
  const result = useMemo(() => (plan ? calculate(plan) : null), [plan])
  const itemCount = plan ? plan.items.reduce((n, i) => n + (i.quantity || 0), 0) : 0

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col ${
        isBetter ? 'border-brand bg-brand/5' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`tag ${isBetter ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          方案 {label}
        </span>
        {isBetter && <span className="text-xs text-brand font-medium">更划算</span>}
      </div>

      {!plan || !result ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="text-2xl mb-2 opacity-40">📄</div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            还没有内容
            <br />
            把当前方案存到这里
          </p>
          <button className="btn btn-primary text-xs" onClick={onSave}>
            存为 {label}
          </button>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-800 leading-tight">{fmt(result.finalPay)}</div>
          <div className="text-xs text-slate-400 mt-0.5">到手价</div>

          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">原价</span>
              <span className="text-slate-600">{fmt(result.originalTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">省</span>
              <span className={result.totalSaved >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                {result.totalSaved >= 0 ? fmt(result.totalSaved) : `-${fmt(-result.totalSaved)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">省率</span>
              <span className={result.savedRate >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                {result.savedRate >= 0 ? pct(result.savedRate) : `-${pct(-result.savedRate)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">运费</span>
              <span className="text-slate-600">
                {result.shippingFee > 0 ? fmt(result.shippingFee) : '包邮'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">内容</span>
              <span className="text-slate-600">
                {itemCount} 件 · {plan.promotions.length} 条优惠
              </span>
            </div>
          </div>

          <div className={`mt-2 tag ${dealLevel(result.savedRate).cls} self-start`}>
            {dealLevel(result.savedRate).label}
          </div>

          <div className="flex gap-1.5 mt-3">
            <button className="btn btn-ghost flex-1 text-xs" onClick={onLoad}>
              载入
            </button>
            <button className="btn btn-ghost text-xs" onClick={onSave} title="用当前内容覆盖">
              覆盖
            </button>
            <button className="btn btn-ghost text-xs text-rose-500" onClick={onClear} title="清空">
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CompareDrawer({
  open,
  current,
  onClose,
  onSaveSlot,
  onLoadSlot,
  onClearSlot
}: Props) {
  const { A, B } = current.compare

  const a = useMemo(() => (A ? calculate(A) : null), [A])
  const b = useMemo(() => (B ? calculate(B) : null), [B])

  let verdict = ''
  let betterSlot: Slot | null = null
  if (a && b) {
    const diff = Math.round((a.finalPay - b.finalPay) * 100) / 100
    if (Math.abs(diff) < 0.005) {
      verdict = '两个方案到手价相同，选省心的那个。'
    } else if (diff > 0) {
      betterSlot = 'B'
      verdict = `方案 B 更划算，比 A 少花 ${fmt(diff)}。`
    } else {
      betterSlot = 'A'
      verdict = `方案 A 更划算，比 B 少花 ${fmt(-diff)}。`
    }
  } else if (a || b) {
    verdict = '已存了一个方案，再把当前这套也存下来就能对比了。'
  } else {
    verdict = '先把「现在买」的方案存为 A，改完价格或优惠后再存为 B，就能看到差多少。'
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">⚖️ 方案对比</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
          把当前填写的内容存成方案 A 或 B，两套并排比较到手价。
        </p>

        <div className="grid grid-cols-2 gap-2">
          <SlotCard
            label="A"
            plan={A}
            isBetter={betterSlot === 'A'}
            onSave={() => onSaveSlot('A')}
            onLoad={() => onLoadSlot('A')}
            onClear={() => onClearSlot('A')}
          />
          <SlotCard
            label="B"
            plan={B}
            isBetter={betterSlot === 'B'}
            onSave={() => onSaveSlot('B')}
            onLoad={() => onLoadSlot('B')}
            onClear={() => onClearSlot('B')}
          />
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600 leading-relaxed">
          {verdict}
        </div>

        <div className="flex gap-2 mt-3">
          <button className="btn btn-ghost flex-1" onClick={() => onSaveSlot('A')}>
            当前存为 A
          </button>
          <button className="btn btn-ghost flex-1" onClick={() => onSaveSlot('B')}>
            当前存为 B
          </button>
        </div>
      </div>
    </div>
  )
}
