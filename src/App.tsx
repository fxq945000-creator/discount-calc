import { useEffect, useMemo, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import ItemEditor from './components/ItemEditor'
import PromotionPanel from './components/PromotionPanel'
import ShippingPanel from './components/ShippingPanel'
import ResultPanel from './components/ResultPanel'
import HistoryDrawer from './components/HistoryDrawer'
import CompareDrawer from './components/CompareDrawer'
import Onboarding from './components/Onboarding'
import { calculate } from './engine/discountEngine'
import { PRESET_LIST } from './engine/presets'
import { emptyState, sampleState, toPlan, type AppState } from './store/state'
import { hasSeenGuide, markGuideSeen } from './store/onboarding'
import {
  addHistory,
  clearHistory,
  deleteHistory,
  loadDraft,
  loadHistory,
  saveDraft,
  type HistoryEntry
} from './store/storage'
import { copyShareUrl, decodeState } from './utils/share'
import { fmt } from './utils/helpers'

type Slot = 'A' | 'B'

export default function App() {
  // 初始化优先级：分享链接 > 本地草稿 > 空白
  const [state, setState] = useState<AppState>(() => {
    const shared = decodeState(location.hash)
    if (shared) return shared
    return loadDraft() ?? emptyState()
  })
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [drawer, setDrawer] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [guide, setGuide] = useState(false)
  const [toast, setToast] = useState('')
  const [needUpdate, setNeedUpdate] = useState(false)
  const updateSW = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  const result = useMemo(() => calculate(state), [state])
  const isEmpty = state.items.length === 0

  // 分享链接已载入：清掉 hash，避免「看明细」等锚点覆盖，也避免刷新重复载入
  useEffect(() => {
    if (location.hash.startsWith('#s=')) {
      window.history.replaceState(null, '', location.pathname + location.search)
    }
  }, [])

  // 草稿自动保存（防抖），刷新/关页面后自动恢复
  useEffect(() => {
    const t = setTimeout(() => saveDraft(state), 400)
    return () => clearTimeout(t)
  }, [state])

  // 首次访问（无分享、无草稿）自动展示新手引导
  useEffect(() => {
    if (!location.hash && !hasSeenGuide() && state.items.length === 0) setGuide(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // PWA 新版本提示
  useEffect(() => {
    updateSW.current = registerSW({
      onNeedRefresh() {
        setNeedUpdate(true)
      }
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const setItems = (items: AppState['items']) => setState((s) => ({ ...s, items }))
  const setPromos = (promotions: AppState['promotions']) => setState((s) => ({ ...s, promotions }))
  const setPreset = (preset: AppState['preset']) => setState((s) => ({ ...s, preset }))
  const setShipping = (shipping: AppState['shipping']) => setState((s) => ({ ...s, shipping }))

  const closeGuide = () => {
    setGuide(false)
    markGuideSeen()
  }

  const loadSample = () => {
    setState((s) => ({ ...sampleState(), compare: s.compare }))
    setToast('已载入示例数据')
  }

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
        state: toPlan(state),
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
    setState((s) => ({ ...s, ...e.state }))
    setDrawer(false)
    setToast('已载入历史')
  }

  const saveSlot = (slot: Slot) => {
    setState((s) => ({ ...s, compare: { ...s.compare, [slot]: toPlan(s) } }))
    setToast(`当前方案已存为 ${slot}`)
  }

  const loadSlot = (slot: Slot) => {
    setState((s) => {
      const p = s.compare[slot]
      return p ? { ...s, ...toPlan(p) } : s
    })
    setCompareOpen(false)
    setToast(`已载入方案 ${slot}`)
  }

  const clearSlot = (slot: Slot) =>
    setState((s) => ({ ...s, compare: { ...s.compare, [slot]: null } }))

  // 用 scrollIntoView 替代 #result 锚点：不写 URL，避免覆盖分享 hash
  const scrollToResult = () =>
    document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className={isEmpty ? 'min-h-full pb-4' : 'min-h-full pb-24 lg:pb-4'}>
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
          <button className="btn btn-ghost" onClick={() => setCompareOpen(true)}>
            对比
            {(state.compare.A || state.compare.B) && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-brand inline-block" />
            )}
          </button>
          <button className="btn btn-ghost" onClick={onShare}>
            分享
          </button>
          <button
            className="btn btn-ghost"
            disabled={isEmpty}
            onClick={() => {
              if (confirm('清空当前所有商品和优惠？')) {
                setState((s) => ({ ...emptyState(), compare: s.compare }))
              }
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
          <ShippingPanel shipping={state.shipping} payAmount={result.goodsPay} onChange={setShipping} />
        </div>
        <div id="result" className="lg:col-span-5 lg:sticky lg:top-20 self-start scroll-mt-20">
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
            <div
              className={`text-lg font-semibold ${result.totalSaved >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}
            >
              {result.totalSaved >= 0 ? fmt(result.totalSaved) : `-${fmt(-result.totalSaved)}`}
            </div>
          </div>
          <button className="btn btn-primary" onClick={scrollToResult}>
            看明细
          </button>
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

      {/* 方案对比 */}
      <CompareDrawer
        open={compareOpen}
        current={state}
        onClose={() => setCompareOpen(false)}
        onSaveSlot={saveSlot}
        onLoadSlot={loadSlot}
        onClearSlot={clearSlot}
      />

      {/* 新手引导 */}
      <Onboarding open={guide} onClose={closeGuide} onLoadSample={loadSample} />

      {/* PWA 新版本提示 */}
      {needUpdate && (
        <div className="fixed bottom-24 lg:bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 bg-slate-800 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl animate-toast-in">
          <span className="text-sm whitespace-nowrap">有新版本可用</span>
          <button
            className="btn bg-white text-slate-800 px-3 py-1 text-xs"
            onClick={() => updateSW.current?.(true)}
          >
            立即更新
          </button>
          <button className="text-slate-400 text-xs" onClick={() => setNeedUpdate(false)}>
            稍后
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg animate-toast-in">
          {toast}
        </div>
      )}
    </div>
  )
}
