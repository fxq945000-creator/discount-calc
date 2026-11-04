import type { Item, PresetKey, Promotion } from '../engine/types'

/** 全局状态 */
export interface AppState {
  preset: PresetKey
  items: Item[]
  promotions: Promotion[]
}

let n = 0
const id = (p: string) => `${p}${++n}`

export function emptyState(): AppState {
  return { preset: 'taobao', items: [], promotions: [] }
}

/** 默认演示数据，帮助用户理解用法（可一键清空） */
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
    ]
  }
}
