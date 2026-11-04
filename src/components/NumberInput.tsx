import { useEffect, useRef, useState } from 'react'

interface Props {
  value?: number
  onChange: (v: number | undefined) => void
  placeholder?: string
  min?: number
  max?: number
  /** 失焦时的归一化，如把「9」换算成 0.9 */
  normalize?: (v: number) => number
  className?: string
  ariaLabel?: string
}

/**
 * 数字输入框：
 * - 值为 0 / 空时显示占位符，而不是恼人的 “0”（不用先删掉才能输入）
 * - 聚焦自动全选，直接覆盖输入
 * - 移动端唤起数字键盘
 * - 失焦时统一归一化（范围、折扣换算）
 */
export default function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  normalize,
  className,
  ariaLabel
}: Props) {
  const [text, setText] = useState(() => (value == null || value === 0 ? '' : String(value)))
  const focused = useRef(false)

  useEffect(() => {
    if (focused.current) return
    setText(value == null || value === 0 ? '' : String(value))
  }, [value])

  return (
    <input
      className={className ?? 'input'}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => {
        focused.current = true
        e.target.select()
      }}
      onBlur={() => {
        focused.current = false
        const t = text.trim()
        if (t === '' || t === '.') {
          setText('')
          onChange(undefined)
          return
        }
        let v = Number(t)
        if (!Number.isFinite(v)) {
          setText('')
          onChange(undefined)
          return
        }
        if (normalize) v = normalize(v)
        if (min != null) v = Math.max(min, v)
        if (max != null) v = Math.min(max, v)
        v = Math.round(v * 1000) / 1000
        setText(v === 0 ? '' : String(v))
        onChange(v)
      }}
      onChange={(e) => {
        const t = e.target.value
        if (!/^\d*\.?\d*$/.test(t)) return
        setText(t)
        if (t === '') {
          onChange(undefined)
          return
        }
        const v = Number(t)
        if (Number.isFinite(v)) onChange(v)
      }}
    />
  )
}
