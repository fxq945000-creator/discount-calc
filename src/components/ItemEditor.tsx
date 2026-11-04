import type { Item, MultiBuy, MultiBuyType } from '../engine/types'
import { uid } from '../utils/helpers'

interface Props {
  items: Item[]
  onChange: (items: Item[]) => void
  onLoadSample?: () => void
}

const MULTI_OPTIONS: { value: MultiBuyType | 'none'; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'secondHalf', label: '第二件半价' },
  { value: 'buyNGetOneFree', label: '买 N 免 1' },
  { value: 'fullMDiscount', label: '满 M 件打折' }
]

export default function ItemEditor({ items, onChange, onLoadSample }: Props) {
  const update = (id: string, patch: Partial<Item>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))
  const add = () =>
    onChange([
      ...items,
      { id: uid('i'), name: '', originalPrice: 0, quantity: 1, isMemberPrice: false }
    ])

  const setMulti = (id: string, type: MultiBuyType | 'none', cur?: MultiBuy) => {
    if (type === 'none') return update(id, { multiBuy: undefined })
    if (cur?.type === type) return
    const base: MultiBuy = cur ?? { type }
    const mb: MultiBuy =
      type === 'secondHalf'
        ? { type }
        : type === 'buyNGetOneFree'
          ? { type, m: base.m ?? 2 }
          : { type, m: base.m ?? 3, discountRate: base.discountRate ?? 0.8 }
    update(id, { multiBuy: mb })
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">🛒 商品清单</h2>
        <button className="btn btn-primary" onClick={add}>
          + 添加商品
        </button>
      </div>

      {items.length === 0 && (
        <div className="py-8 text-center animate-fade-up">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-sm font-medium text-slate-600">还没有商品</p>
          <p className="text-xs text-slate-400 mt-1">先加一件要买的东西，填上原价和数量就行</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button className="btn btn-primary" onClick={add}>
              + 添加第一个商品
            </button>
            {onLoadSample && (
              <button className="btn btn-ghost" onClick={onLoadSample}>
                看看示例
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
            <div className="flex gap-2 items-center">
              <input
                className="input flex-1"
                placeholder="商品名称（可选）"
                value={it.name}
                onChange={(e) => update(it.id, { name: e.target.value })}
              />
              <button
                className="btn btn-ghost px-2.5 text-rose-500"
                title="删除"
                onClick={() => remove(it.id)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="text-xs text-slate-500">
                原价（单价）
                <input
                  className="input mt-1"
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.originalPrice}
                  onChange={(e) => update(it.id, { originalPrice: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs text-slate-500">
                数量
                <input
                  className="input mt-1"
                  type="number"
                  min="1"
                  step="1"
                  value={it.quantity}
                  onChange={(e) =>
                    update(it.id, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })
                  }
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={it.isMemberPrice}
                  onChange={(e) => update(it.id, { isMemberPrice: e.target.checked })}
                />
                会员价
              </label>
              {it.isMemberPrice && (
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  会员单价
                  <input
                    className="input w-24"
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.memberPrice ?? ''}
                    placeholder="如 80"
                    onChange={(e) =>
                      update(it.id, { memberPrice: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2 mt-2">
              <label className="text-xs text-slate-500">
                多件多折
                <select
                  className="input mt-1"
                  value={it.multiBuy?.type ?? 'none'}
                  onChange={(e) => setMulti(it.id, e.target.value as MultiBuyType | 'none', it.multiBuy)}
                >
                  {MULTI_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {it.multiBuy?.type === 'buyNGetOneFree' && (
                <label className="text-xs text-slate-500">
                  买几件
                  <input
                    className="input w-20 mt-1"
                    type="number"
                    min="1"
                    value={it.multiBuy.m ?? 2}
                    onChange={(e) =>
                      update(it.id, { multiBuy: { ...it.multiBuy!, m: Math.max(1, Number(e.target.value)) } })
                    }
                  />
                </label>
              )}
              {it.multiBuy?.type === 'fullMDiscount' && (
                <>
                  <label className="text-xs text-slate-500">
                    满几件
                    <input
                      className="input w-20 mt-1"
                      type="number"
                      min="1"
                      value={it.multiBuy.m ?? 3}
                      onChange={(e) =>
                        update(it.id, { multiBuy: { ...it.multiBuy!, m: Math.max(1, Number(e.target.value)) } })
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    打几折
                    <input
                      className="input w-20 mt-1"
                      type="number"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={it.multiBuy.discountRate ?? 0.8}
                      onChange={(e) =>
                        update(it.id, {
                          multiBuy: { ...it.multiBuy!, discountRate: Math.min(1, Math.max(0.01, Number(e.target.value))) }
                        })
                      }
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
