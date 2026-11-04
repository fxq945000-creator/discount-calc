import { useEffect, useMemo, useState } from 'react'
import ItemEditor from './components/ItemEditor'
import PromotionPanel from './components/PromotionPanel'
import ResultPanel from './components/ResultPanel'
import HistoryDrawer from './components/HistoryDrawer'
import Onboarding from './components/Onboarding'
import { calculate } from './engine/discountEngine'
import { PRESET_LIST } from './engine/presets'
import { emptyState, sampleState, type AppState } from './store/state'
import { hasSeenGuide, markGuideSeen } from './store/onboarding'
import { addHistory, clearHistory, deleteHistory, loadHistory, type HistoryEntry } from './store/storage'
import { copyShareUrl, decodeState } from './utils/share'
import { fmt } from './utils/helpers'

export default function App() {
  const [state, setState] = useState<AppState>(() => decodeState(location.hash) ?? emptyState())
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [drawer, setDrawer] = useState(false)
  const [guide, setGuide] = useState(false)
  const [toast, setToast] = useState('')

  const result = useMemo(() => calculate(state), [state])
  const isEmpty = state.items.length === 0

  // 首次访问（无分享链接）自动展示新手引导
  useEffect(() => {
    if (!location.hash && !hasSeenGuide()) setGuide(true)
  }, [])

  const closeGuide = () => {
    setGuide(false)
    markGuideSeen()
  }

  const loadSample = () => {
    setState(sampleState())
    setToast('已载入示例数据')
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const setItems = (items: AppState['items']) => setState((s) => ({ ...s, items }))
  const setPromos = (promotions: AppState['promotions']) => setState((s) => ({ ...s, promotions }))
  const setPreset = (preset: AppState['preset']) => setState((s) => ({ ...s, preset }))

  const onSave = () => {
    if (isEmpty) {
      setToast('先添加至少一件商品再保存')
      return
    }
    const title = window.prompt('给这次测算起个名字', `测算 ${new Date().toLocaleString('zh-CN')}`)
    if (title === null) return
    setHistory(
      addHistory({
        title: title.trim() || '未命名测算',
        state,
        summary: {
          originalTotal: result.originalTotal,
          finalPay: result.finalPay,
          totalSaved: result.totalSaved,
          savedRate: result.savedRate
        }
      })
    )
    setToast('已保存到历史')
  }

  const onShare = async () => {
    const ok = await copyShareUrl(state)
    setToast(ok ? '分享链接已复制，可发给朋友' : '复制失败，请手动复制地址栏链接')
  }

  const onLoadHistory = (e: HistoryEntry) => {
    setState(e.state)
    setDrawer(false)
    setToast('已载入历史')
  }

  return (
    <div className="min-h-full pb-24 lg:pb-4">
      {/* 顶部 */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-3 py-3 flex flex-wrap items-center gap-2">
          <div className="mr-auto">
            <h1 className="text-lg font-bold text-slate-800">折扣计算器</h1>
            <p className="text-xs text-slate-400">买得划不划算，一算就知道</p>
          </div>
          <label className="flex items-center gap-1 text-sm text-slate-600">
            规则
            <select
              className="input w-auto py-1"
              value={state.preset}
              onChange={(e) => setPreset(e.target.value as AppState['preset'])}
            >
              {PRESET_LIST.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-ghost" onClick={onSave}>
            保存
          </button>
          <button className="btn btn-ghost" onClick={() => setDrawer(true)}>
            历史
          </button>
          <button className="btn btn-ghost" onClick={onShare}>
            分享
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (isEmpty || confirm('清空当前所有商品和优惠？')) setState(emptyState())
            }}
          >
            清空
          </button>
          <button
            className="btn btn-ghost w-9 px-0"
            title="新手引导"
            aria-label="新手引导"
            onClick={() => setGuide(true)}
          >
            ?
          </button>
        </div>
      </header>

      {/* 主体 */}
      <main className="max-w-5xl mx-auto px-3 py-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <ItemEditor items={state.items} onChange={setItems} onLoadSample={loadSample} />
          <PromotionPanel promotions={state.promotions} onChange={setPromos} />
        </div>
        <div id="result" className="lg:col-span-5 lg:sticky lg:top-20 self-start">
          <ResultPanel result={result} empty={isEmpty} />
        </div>
      </main>

      {/* 移动端底部速览（无商品时不显示，保持首屏干净） */}
      {!isEmpty && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div>
            <div className="text-xs text-slate-400">到手价</div>
            <div className="text-2xl font-bold text-brand">{fmt(result.finalPay)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">省了</div>
            <div className="text-lg font-semibold text-emerald-600">{fmt(result.totalSaved)}</div>
          </div>
          <a href="#result" className="btn btn-primary">
            看明细
          </a>
        </div>
      )}

      {/* 历史抽屉 */}
      <HistoryDrawer
        open={drawer}
        list={history}
        onClose={() => setDrawer(false)}
        onLoad={onLoadHistory}
        onDelete={(id) => setHistory(deleteHistory(id))}
        onClear={() => {
          if (confirm('确定清空全部历史？')) setHistory(clearHistory())
        }}
      />

      {/* 新手引导 */}
      <Onboarding open={guide} onClose={closeGuide} onLoadSample={loadSample} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg animate-toast-in">
          {toast}
        </div>
      )}
    </div>
  )
}
