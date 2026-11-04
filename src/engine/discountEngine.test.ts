import { describe, it, expect } from 'vitest'
import { calculate } from './discountEngine'
import type { CalcInput, Item, Promotion } from './types'

let seq = 0
const item = (p: Partial<Item>): Item => ({
  id: `i${seq++}`,
  name: p.name ?? '商品',
  originalPrice: p.originalPrice ?? 100,
  quantity: p.quantity ?? 1,
  isMemberPrice: p.isMemberPrice ?? false,
  memberPrice: p.memberPrice,
  multiBuy: p.multiBuy
})
const promo = (p: Partial<Promotion> & Pick<Promotion, 'type' | 'scope'>): Promotion => ({
  id: `p${seq++}`,
  ...p
})
const input = (items: Item[], promotions: Promotion[] = [], preset?: CalcInput['preset']): CalcInput => ({
  items,
  promotions,
  preset
})

describe('基础计算', () => {
  it('无促销时到手价=原价', () => {
    const r = calculate(input([item({ originalPrice: 50, quantity: 2 })]))
    expect(r.originalTotal).toBe(100)
    expect(r.goodsAmount).toBe(100)
    expect(r.finalPay).toBe(100)
    expect(r.totalSaved).toBe(0)
    expect(r.savedRate).toBe(0)
  })
})

describe('会员专享价', () => {
  it('会员价比原价低时生效', () => {
    const r = calculate(
      input([item({ originalPrice: 100, quantity: 1, isMemberPrice: true, memberPrice: 80 })])
    )
    expect(r.finalPay).toBe(80)
    expect(r.totalSaved).toBe(20)
  })
})

describe('单品多件多折', () => {
  it('第二件半价：3件', () => {
    // full=2, half=1 => 2*100 + 1*50 = 250
    const r = calculate(input([item({ originalPrice: 100, quantity: 3, multiBuy: { type: 'secondHalf' } })]))
    expect(r.goodsAmount).toBe(250)
    expect(r.finalPay).toBe(250)
  })
  it('买2免1：3件只收2件', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 3, multiBuy: { type: 'buyNGetOneFree', m: 2 } })]))
    expect(r.goodsAmount).toBe(200)
  })
  it('满3件打8折', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 3, multiBuy: { type: 'fullMDiscount', m: 3, discountRate: 0.8 } })]))
    expect(r.goodsAmount).toBe(240)
  })
  it('不满件数不打折', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 2, multiBuy: { type: 'fullMDiscount', m: 3, discountRate: 0.8 } })]))
    expect(r.goodsAmount).toBe(200)
  })
})

describe('满减 / 满折', () => {
  it('满200减30，达到门槛', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 3 })], [promo({ type: 'threshold', scope: 'shop', threshold: 200, reduce: 30 })]))
    expect(r.goodsAmount).toBe(300)
    expect(r.finalPay).toBe(270)
  })
  it('未满门槛不减', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 1 })], [promo({ type: 'threshold', scope: 'shop', threshold: 200, reduce: 30 })]))
    expect(r.finalPay).toBe(100)
  })
  it('满300打9折', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 4 })], [promo({ type: 'threshold', scope: 'shop', threshold: 300, discountRate: 0.9 })]))
    // base=400, reduce=40 => 360
    expect(r.finalPay).toBe(360)
  })
})

describe('优惠券', () => {
  it('满100减20券', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 2 })], [promo({ type: 'coupon', scope: 'platform', threshold: 100, reduce: 20 })]))
    expect(r.finalPay).toBe(180)
  })
})

describe('红包 / 积分抵扣', () => {
  it('红包抵扣且有封顶', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 1 })], [promo({ type: 'deduct', scope: 'order', amount: 50, cap: 30 })]))
    expect(r.finalPay).toBe(70) // 封顶30
  })
  it('抵扣不超过应付', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 1 })], [promo({ type: 'deduct', scope: 'order', amount: 200 })]))
    expect(r.finalPay).toBe(0)
  })
})

describe('返现不计入到手价', () => {
  it('5%返现', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 1 })], [promo({ type: 'cashback', scope: 'order', cashbackRate: 0.05 })]))
    expect(r.finalPay).toBe(100)
    const cb = r.breakdown.find((b) => b.kind === 'cashback')
    expect(cb?.saved).toBe(5)
  })
})

describe('叠加顺序', () => {
  it('会员价 + 满减 + 券 + 红包', () => {
    // 会员价80, 满200减30(基数goods=80*3=240达标减30=210), 券满100减10(210-10=200), 红包20(200-20=180)
    const r = calculate(
      input(
        [item({ originalPrice: 100, quantity: 3, isMemberPrice: true, memberPrice: 80 })],
        [
          promo({ type: 'threshold', scope: 'shop', threshold: 200, reduce: 30 }),
          promo({ type: 'coupon', scope: 'platform', threshold: 100, reduce: 10 }),
          promo({ type: 'deduct', scope: 'order', amount: 20 })
        ]
      )
    )
    expect(r.goodsAmount).toBe(240)
    expect(r.finalPay).toBe(180)
    expect(r.totalSaved).toBe(120)
  })
})

describe('凑单建议', () => {
  it('未满门槛给出差距与优惠', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 1 })], [promo({ type: 'threshold', scope: 'shop', threshold: 200, reduce: 30 })]))
    expect(r.combo.length).toBe(1)
    expect(r.combo[0].gap).toBe(100)
    expect(r.combo[0].reduce).toBe(30)
    expect(r.combo[0].worthIt).toBe(false)
  })
  it('已达门槛无建议', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 3 })], [promo({ type: 'threshold', scope: 'shop', threshold: 200, reduce: 30 })]))
    expect(r.combo.length).toBe(0)
  })
})

describe('会员回本', () => {
  it('会员年费回本次数', () => {
    const r = calculate(
      input(
        [item({ originalPrice: 100, quantity: 1, isMemberPrice: true, memberPrice: 90 })],
        [promo({ type: 'member', scope: 'order', annualFee: 100 })]
      )
    )
    expect(r.member?.active).toBe(true)
    expect(r.member?.saving).toBe(10)
    expect(r.member?.breakevenPurchases).toBe(10) // 100/10
  })
  it('无会员时无回本信息', () => {
    const r = calculate(input([item({ originalPrice: 100 })]))
    expect(r.member).toBeUndefined()
  })
})

describe('省率', () => {
  it('计算百分比', () => {
    const r = calculate(input([item({ originalPrice: 100, quantity: 2 })], [promo({ type: 'threshold', scope: 'shop', threshold: 100, reduce: 20 })]))
    expect(r.totalSaved).toBe(20)
    expect(r.savedRate).toBeCloseTo(0.1, 5)
  })
})

describe('折扣率容错（填 9 = 9 折）', () => {
  it('满折填 9 视为 0.9，而不是反向加价', () => {
    const r = calculate(
      input(
        [item({ originalPrice: 100, quantity: 1 })],
        [promo({ type: 'threshold', scope: 'order', discountRate: 9 })]
      )
    )
    expect(r.finalPay).toBe(90)
  })
  it('满 M 件打折填 8 视为 8 折', () => {
    const r = calculate(
      input([item({ originalPrice: 100, quantity: 3, multiBuy: { type: 'fullMDiscount', m: 3, discountRate: 8 } })])
    )
    expect(r.goodsAmount).toBe(240)
  })
  it('会员折扣填 95（>10 视为无效）不加价', () => {
    const r = calculate(
      input(
        [item({ originalPrice: 100, quantity: 1 })],
        [promo({ type: 'member', scope: 'order', memberDiscountRate: 95 })]
      )
    )
    expect(r.finalPay).toBe(100)
  })
  it('满减金额超过计费基数时封顶', () => {
    const r = calculate(
      input(
        [item({ originalPrice: 50, quantity: 1 })],
        [promo({ type: 'threshold', scope: 'shop', threshold: 50, reduce: 80 })]
      )
    )
    expect(r.finalPay).toBe(0)
  })
})

describe('运费与包邮', () => {
  it('未包邮时运费计入到手价，省额可为负', () => {
    const r = calculate({
      items: [item({ originalPrice: 50 })],
      promotions: [],
      shipping: { enabled: true, fee: 12 }
    })
    expect(r.goodsPay).toBe(50)
    expect(r.shippingFee).toBe(12)
    expect(r.finalPay).toBe(62)
    expect(r.freeShipping).toBe(false)
    expect(r.totalSaved).toBe(-12)
  })

  it('满额包邮时运费为 0', () => {
    const r = calculate({
      items: [item({ originalPrice: 120 })],
      promotions: [],
      shipping: { enabled: true, fee: 12, freeThreshold: 99 }
    })
    expect(r.shippingFee).toBe(0)
    expect(r.finalPay).toBe(120)
    expect(r.freeShipping).toBe(true)
  })

  it('包邮门槛按券后金额判断', () => {
    // 原价 120，满 120 减 30 → 券后 90 < 99 不包邮
    const r = calculate({
      items: [item({ originalPrice: 120 })],
      promotions: [promo({ type: 'threshold', scope: 'shop', threshold: 120, reduce: 30 })],
      shipping: { enabled: true, fee: 12, freeThreshold: 99 }
    })
    expect(r.goodsPay).toBe(90)
    expect(r.shippingFee).toBe(12)
    expect(r.finalPay).toBe(102)
  })

  it('凑单到包邮门槛的判断也按券后金额', () => {
    // 原价 120 - 满 120 减 30 = 90，门槛 99：差 9
    const r = calculate({
      items: [item({ originalPrice: 120 })],
      promotions: [promo({ type: 'threshold', scope: 'shop', threshold: 120, reduce: 30 })],
      shipping: { enabled: true, fee: 12, freeThreshold: 99 }
    })
    expect(r.shippingFee).toBe(12)
    expect(r.finalPay).toBe(102)
  })

  it('不启用运费时无影响', () => {
    const r = calculate({
      items: [item({ originalPrice: 50 })],
      promotions: [],
      shipping: { enabled: false, fee: 12 }
    })
    expect(r.finalPay).toBe(50)
    expect(r.freeShipping).toBe(true)
    expect(r.totalSaved).toBe(0)
  })

  it('不传 shipping 时行为与旧版一致', () => {
    const r = calculate(input([item({ originalPrice: 80 })]))
    expect(r.finalPay).toBe(80)
    expect(r.shippingFee).toBe(0)
    expect(r.freeShipping).toBe(true)
  })
})
