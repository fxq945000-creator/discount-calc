import type { Item, PresetKey, Promotion, Shipping } from '../engine/types'

/** 单个方案的数据（可被快照、对比、分享） */
export interface PlanData {
  preset: PresetKey
  items: Item[]
  promotions: Promotion[]
  shipping: Shipping
}

/** 对比槽位：可分别存两套方案 */
export interface CompareSlot {
  A: PlanData | null
  B: PlanData | null
}

/** 全局状态 = 当前方案 + 对比快照 */
export interface AppState extends PlanData {
  compare: CompareSlot
}

let n = 0
const id = (p: string) => `${p}${++n}`

export function defaultShipping(): Shipping {
  return { enabled: false, fee: 0, freeThreshold: undefined }
}

/** 深拷贝方案数据（避免快照与当前编辑共享引用） */
export function toPlan(s: PlanData): PlanData {
  return {
    preset: s.preset,
    items: s.items.map((i) => ({
      ...i,
      multiBuy: i.multiBuy ? { ...i.multiBuy } : undefined
    })),
    promotions: s.promotions.map((p) => ({ ...p })),
    shipping: { ...s.shipping }
  }
}

/** 空白初始状态：默认无任何商品与优惠，保持纯净 */
export function emptyState(): AppState {
  return {
    preset: 'taobao',
    items: [],
    promotions: [],
    shipping: defaultShipping(),
    compare: { A: null, B: null }
  }
}

/** 示例数据：仅在用户主动点击「看示例 / 载入示例」时使用，不再作为初始状态 */
export function sampleState(): AppState {
  return {
    preset: 'taobao',
    items: [
      {
        id: id('i'),
        name: '运动鞋',
        originalPrice: 299,
        quantity: 1,
        isMemberPrice: false,
        multiBuy: undefined
      },
      {
        id: id('i'),
        name: '袜子（买2免1）',
        originalPrice: 39,
        quantity: 3,
        isMemberPrice: false,
        multiBuy: { type: 'buyNGetOneFree', m: 2 }
      }
    ],
    promotions: [
      { id: id('p'), type: 'member', scope: 'order', label: '88VIP 折扣', memberDiscountRate: 0.9, annualFee: 88 },
      { id: id('p'), type: 'threshold', scope: 'shop', label: '店铺满300减40', threshold: 300, reduce: 40 },
      { id: id('p'), type: 'coupon', scope: 'platform', label: '平台券满200减15', threshold: 200, reduce: 15 },
      { id: id('p'), type: 'deduct', scope: 'order', label: '红包', amount: 10 }
    ],
    shipping: { enabled: true, fee: 12, freeThreshold: 199 },
    compare: { A: null, B: null }
  }
}

/**
 * 容错归一化：兼容旧分享链接 / 旧草稿（没有 shipping、compare 字段），
 * 同时防御被改坏的链接导致渲染崩溃。
 */
export function normalizeState(raw: unknown): AppState {
  const o = (raw ?? {}) as Record<string, unknown>
  const base = emptyState()
  if (!Array.isArray(o.items) || !Array.isArray(o.promotions)) return base

  const preset = typeof o.preset === 'string' ? (o.preset as PresetKey) : 'taobao'

  const shippingRaw = o.shipping as Partial<Shipping> | undefined
  const shipping: Shipping = shippingRaw
    ? {
        enabled: !!shippingRaw.enabled,
        fee: Number.isFinite(shippingRaw.fee) ? Math.max(0, Number(shippingRaw.fee)) : 0,
        freeThreshold:
          Number.isFinite(shippingRaw.freeThreshold) && Number(shippingRaw.freeThreshold) > 0
            ? Number(shippingRaw.freeThreshold)
            : undefined
      }
    : defaultShipping()

  return {
    preset,
    items: o.items as Item[],
    promotions: o.promotions as Promotion[],
    shipping,
    compare: { A: null, B: null }
  }
}
