import { useEffect, useState } from 'react'

interface BIPEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** 是否已以独立窗口/App 模式运行（即已安装） */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** iPhone / iPad 上的 Safari（iOS 不支持程序化安装，只能教程引导） */
function isIOS(): boolean {
  const ua = window.navigator.userAgent
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)
  )
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BIPEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferred(null)
      return
    }
    if (isIOS()) setShowIOSGuide(true)
    else setShowFallback(true)
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={onClick} title="添加到主屏幕">
        📲 安装
      </button>

      {/* iPhone 教程 */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800">添加到主屏幕 📱</h3>
            <p className="text-sm text-slate-500 mt-1">
              iPhone 请用 Safari 自带功能，三步完成：
            </p>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span>
                  点击浏览器底部工具栏的
                  <strong>「分享」按钮</strong>
                  <span className="text-slate-400">（方框加向上箭头 ↑）</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span>
                  在菜单中找到
                  <strong>「添加到主屏幕」</strong>
                  <span className="text-slate-400">（可能需要往下滑一滑）</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span>
                  点击右上角<strong>「添加」</strong>，桌面上就会出现折扣计算器图标 ✅
                </span>
              </li>
            </ol>
            <button className="btn btn-primary w-full mt-5" onClick={() => setShowIOSGuide(false)}>
              知道了
            </button>
          </div>
        </div>
      )}

      {/* 桌面/其他浏览器兜底提示 */}
      {showFallback && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center"
          onClick={() => setShowFallback(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800">添加到主屏幕 📱</h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              你的浏览器暂不支持一键安装。可以在浏览器的
              <strong>地址栏右侧</strong>或<strong>菜单（⋮ / ⋯）</strong>
              里找「安装应用 / 添加到主屏幕」选项。
            </p>
            <button
              className="btn btn-primary w-full mt-5"
              onClick={() => setShowFallback(false)}
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  )
}
