import type { HistoryEntry } from '../store/storage'
import { fmt, pct } from '../utils/helpers'

interface Props {
  open: boolean
  list: HistoryEntry[]
  onClose: () => void
  onLoad: (e: HistoryEntry) => void
  onDelete: (id: string) => void
  onClear: () => void
}

export default function HistoryDrawer({ open, list, onClose, onLoad, onDelete, onClear }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">🕘 历史记录</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            关闭
          </button>
        </div>
        {list.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">暂无记录，算完点“保存”即可留档。</p>
        )}
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-700 truncate">{e.title}</div>
                <div className="text-emerald-600 text-sm">省 {pct(e.summary.savedRate)}</div>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {new Date(e.ts).toLocaleString('zh-CN')}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                到手 <span className="font-semibold">{fmt(e.summary.finalPay)}</span> · 原价{' '}
                {fmt(e.summary.originalTotal)}
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary flex-1" onClick={() => onLoad(e)}>
                  载入
                </button>
                <button
                  className="btn btn-ghost text-rose-500"
                  onClick={() => onDelete(e.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
        {list.length > 0 && (
          <button className="btn btn-ghost w-full mt-3 text-rose-500" onClick={onClear}>
            清空全部
          </button>
        )}
      </div>
    </div>
  )
}
