import { useEffect, useState } from 'react'

interface Step {
  icon: string
  tag: string
  title: string
  desc: string
  hint?: string
}

const STEPS: Step[] = [
  {
    icon: '🛒',
    tag: '第 1 步',
    title: '把要买的东西加进来',
    desc: '填上原价和数量就够了。如果有会员价、第二件半价、买 N 免 1，也在这一步顺手设好。',
    hint: '不用一次填完，边加边看右边结果就会变'
  },
  {
    icon: '🏷️',
    tag: '第 2 步',
    title: '把优惠一条条加上',
    desc: '满 200 减 30、店铺券、平台券、跨店满减、红包、积分抵扣，手上有几条就加几条。',
    hint: '没有优惠就跳过，直接看裸价最省事'
  },
  {
    icon: '📊',
    tag: '第 3 步',
    title: '看到手价和省了多少',
    desc: '每一步优惠都标了「基数」，也就是按哪个金额算的。你可以逐层核对，不会被各种规则绕晕。',
    hint: '差一点到门槛时，还会提示要不要凑单、凑了划不划算'
  },
  {
    icon: '💾',
    tag: '第 4 步',
    title: '存下来、发给朋友',
    desc: '满意的方案点「保存」进历史；点「分享」生成一条链接，对方打开就是同样的测算。',
    hint: '数据只存在你自己的浏览器里，不会上传到任何服务器'
  }
]

interface Props {
  open: boolean
  onClose: () => void
  onLoadSample: () => void
}

export default function Onboarding({ open, onClose, onLoadSample }: Props) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (open) setIdx(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setIdx((v) => Math.min(v + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setIdx((v) => Math.max(v - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const step = STEPS[idx]
  const isLast = idx === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* 进度与关闭 */}
        <div className="flex items-center justify-between px-5 pt-4 shrink-0">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`第 ${i + 1} 步`}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? 'w-6 bg-brand' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
            <span className="text-xs text-slate-400 ml-2">
              {idx + 1} / {STEPS.length}
            </span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1 py-1"
            onClick={onClose}
            aria-label="关闭引导"
          >
            ✕
          </button>
        </div>

        {/* 内容（可滚动） */}
        <div key={idx} className="px-6 pt-5 animate-fade-up overflow-y-auto flex-1">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-3xl">
            {step.icon}
          </div>
          <div className="text-xs font-medium text-brand mt-4">{step.tag}</div>
          <h3 className="text-xl font-bold text-slate-800 mt-1">{step.title}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
          {step.hint && (
            <p className="text-xs text-slate-500 mt-3 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed">
              💡 {step.hint}
            </p>
          )}
        </div>

        {/* 操作区（固定在底部） */}
        <div className="px-6 pt-4 pb-6 flex items-center gap-2 shrink-0">
          {idx > 0 ? (
            <button className="btn btn-ghost" onClick={() => setIdx(idx - 1)}>
              上一步
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={onClose}>
              跳过
            </button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  onLoadSample()
                  onClose()
                }}
              >
                先看示例
              </button>
              <button className="btn btn-primary px-5" onClick={onClose}>
                开始填写
              </button>
            </>
          ) : (
            <button className="btn btn-primary px-5" onClick={() => setIdx(idx + 1)}>
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
