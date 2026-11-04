import type {
  BreakdownEntry,
  CalcInput,
  CalcResult,
  ComboSuggestion,
  MemberInfo,
  MultiBuy
} from './types'
import { PRESETS } from './presets'

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

/** 单品多件多折：返回该商品在「单价 unit、数量 qty」下的折后小计 */
function applyMultiBuy(unit: number, qty: number, mb?: MultiBuy): number {
  if (!mb || qty <= 0) return unit * qty

  if (mb.type === 'secondHalf') {
    const half = Math.floor(qty / 2)
    const full = qty - half
    return full * unit + half * unit * 0.5
  }

  if (mb.type === 'buyNGetOneFree') {
    const n = mb.m && mb.m > 0 ? mb.m : 1
    const free = Math.floor(qty / (n + 1))
    const charged = qty - free
    return charged * unit
  }

  if (mb.type === 'fullMDiscount') {
    const m = mb.m && mb.m > 0 ? mb.m : 1
    const rate = mb.discountRate ?? 1
    if (qty >= m) return qty * unit * rate
    return qty * unit
  }

  return unit * qty
}

interface CoreResult {
  originalTotal: number
  goodsAmount: number
  finalPay: number
  breakdown: BreakdownEntry[]
  cashback: number
}

/**
 * 核心计算（不含会员回本/凑单，便于对“无会员”场景做二次计算）。
 * stripMember=true 时忽略所有会员价与会员折扣，用于测算会员收益。
 */
function calcCore(input: CalcInput, stripMember: boolean): CoreResult {
  const presetBase = PRESETS[input.preset ?? 'custom'].thresholdBase

  // 全局会员折扣率（多个会员折扣相乘）
  const memberRates = input.promotions
    .filter((p) => p.type === 'member' && !stripMember && p.memberDiscountRate)
    .map((p) => p.memberDiscountRate as number)
  const globalMemberRate =
    memberRates.length > 0 ? memberRates.reduce((a, b) => a * b, 1) : null

  const breakdown: BreakdownEntry[] = []
  let originalTotal = 0
  let goodsAmount = 0

  // —— 1. 单品层：会员价 → 会员折扣 → 多件多折 ——
  for (const item of input.items) {
    const qty = Math.max(0, Math.floor(item.quantity || 0))
    const p0 = Math.max(0, item.originalPrice || 0)
    originalTotal += p0 * qty

    // 会员专享价
    let p1 = p0
    let savedMP = 0
    if (!stripMember && item.isMemberPrice && item.memberPrice != null && item.memberPrice < p0) {
      p1 = item.memberPrice
      savedMP = (p0 - p1) * qty
    }

    // 全局会员折扣
    let p2 = p1
    let savedMD = 0
    if (globalMemberRate != null && globalMemberRate < 1) {
      p2 = p1 * globalMemberRate
      savedMD = (p1 - p2) * qty
    }

    // 多件多折
    const subWith = applyMultiBuy(p2, qty, item.multiBuy)
    const subWithout = p2 * qty
    const savedMB = subWithout - subWith

    goodsAmount += subWith

    if (savedMP > 0)
      breakdown.push({
        key: `mp-${item.id}`,
        label: `会员价 · ${item.name || '商品'}`,
        kind: 'memberPrice',
        baseAmount: round2(p0 * qty),
        saved: round2(savedMP),
        affectsPay: true,
        note: `专享价 ¥${round2(p1)}/件`
      })
    if (savedMD > 0)
      breakdown.push({
        key: `md-${item.id}`,
        label: `会员折扣 · ${item.name || '商品'}`,
        kind: 'member',
        baseAmount: round2(p1 * qty),
        saved: round2(savedMD),
        affectsPay: true,
        note: `会员折扣 ${Math.round(globalMemberRate! * 1000) / 100} 折`
      })
    if (savedMB > 0)
      breakdown.push({
        key: `mb-${item.id}`,
        label: `多件多折 · ${item.name || '商品'}`,
        kind: 'multiBuy',
        baseAmount: round2(p2 * qty),
        saved: round2(savedMB),
        affectsPay: true,
        note: multiBuyNote(item.multiBuy)
      })
  }

  // —— 2. 订单层：满减/满折 → 优惠券 → 红包/积分 → 返现 ——
  let running = goodsAmount
  let cashback = 0

  const orderPromos = input.promotions.filter(
    (p) => p.type === 'threshold' || p.type === 'coupon'
  )
  for (const p of orderPromos) {
    const baseOn = p.baseOn ?? presetBase
    const base = baseOn === 'running' ? running : goodsAmount
    const threshold = p.threshold ?? 0

    if (threshold > 0 && base < threshold) continue // 未达门槛，跳过

    let d = 0
    if (p.reduce != null) {
      d = p.reduce
    } else if (p.discountRate != null) {
      d = round2(base * (1 - p.discountRate))
    }
    if (d <= 0) continue

    running = Math.max(0, running - d)
    breakdown.push({
      key: `op-${p.id}`,
      label: p.label || (p.type === 'coupon' ? '优惠券' : '满减/满折'),
      kind: p.type,
      baseAmount: round2(base),
      saved: round2(d),
      affectsPay: true,
      note:
        threshold > 0
          ? `满 ¥${threshold} 生效`
          : undefined
    })
  }

  // 红包 / 积分 / 淘金币抵扣
  for (const p of input.promotions.filter((x) => x.type === 'deduct')) {
    const amt = p.amount ?? 0
    const cap = p.cap ?? Infinity
    let d = Math.min(amt, cap, running)
    if (d < 0) d = 0
    if (d <= 0) continue
    running = Math.max(0, running - d)
    breakdown.push({
      key: `de-${p.id}`,
      label: p.label || '红包/积分抵扣',
      kind: 'deduct',
      baseAmount: round2(running + d),
      saved: round2(d),
      affectsPay: true,
      note: p.cap != null ? `封顶 ¥${p.cap}` : undefined
    })
  }

  // 返现 / 返利（不计入到手价）
  for (const p of input.promotions.filter((x) => x.type === 'cashback')) {
    const cb = (running * (p.cashbackRate ?? 0)) + (p.cashbackAmount ?? 0)
    if (cb <= 0) continue
    cashback += cb
    breakdown.push({
      key: `cb-${p.id}`,
      label: p.label || '返现/返利',
      kind: 'cashback',
      baseAmount: round2(running),
      saved: round2(cb),
      affectsPay: false,
      note: '返现不计入到手价，作为实际收益'
    })
  }

  const finalPay = round2(Math.max(0, running))

  // 在明细开头放一个「商品原价合计」锚点，便于阅读
  breakdown.unshift({
    key: 'anchor-original',
    label: '商品原价合计',
    kind: 'goods',
    baseAmount: round2(originalTotal),
    saved: 0,
    affectsPay: false,
    note: `单品折后合计 ¥${round2(goodsAmount)}`
  })

  return { originalTotal, goodsAmount, finalPay, breakdown, cashback }
}

function multiBuyNote(mb?: MultiBuy): string {
  if (!mb) return ''
  if (mb.type === 'secondHalf') return '第二件半价'
  if (mb.type === 'buyNGetOneFree') return `买${mb.m ?? 1}免1`
  if (mb.type === 'fullMDiscount')
    return `满${mb.m ?? 1}件打${Math.round((mb.discountRate ?? 1) * 1000) / 100}折`
  return ''
}

/** 凑单建议：找出未达门槛的满减/券，给出差距与潜在优惠 */
function buildCombo(input: CalcInput, goodsAmount: number): ComboSuggestion[] {
  const presetBase = PRESETS[input.preset ?? 'custom'].thresholdBase
  const list: ComboSuggestion[] = []

  for (const p of input.promotions.filter(
    (x) => (x.type === 'threshold' || x.type === 'coupon') && x.threshold
  )) {
    const baseOn = p.baseOn ?? presetBase
    const base = baseOn === 'running' ? goodsAmount : goodsAmount
    const threshold = p.threshold as number
    if (base >= threshold) continue

    const gap = round2(threshold - base)
    const reduce = p.reduce != null ? p.reduce : p.discountRate != null ? round2(base * (1 - p.discountRate)) : 0
    const worthIt = reduce > gap
    list.push({
      promotionId: p.id,
      label: p.label || (p.type === 'coupon' ? '优惠券' : '满减/满折'),
      threshold,
      current: round2(base),
      gap,
      reduce: round2(reduce),
      worthIt,
      note: worthIt
        ? `还差 ¥${gap} 到门槛，凑到后可减 ¥${round2(reduce)}（若确实要买这些才划算）`
        : `还差 ¥${gap} 到门槛，凑到后仅减 ¥${round2(reduce)}，通常不建议为优惠硬凑`
    })
  }

  return list.sort((a, b) => a.gap - b.gap)
}

/** 会员回本信息：对比“无会员”场景，算出会员带来的节省 */
function buildMember(input: CalcInput): MemberInfo | undefined {
  const hasMemberPrice = input.items.some((i) => i.isMemberPrice && i.memberPrice != null)
  const memberPromo = input.promotions.find((p) => p.type === 'member')
  const hasMemberDiscount = !!memberPromo?.memberDiscountRate
  const active = hasMemberPrice || hasMemberDiscount
  if (!active) return undefined

  const withMember = calcCore(input, false).finalPay
  const withoutMember = calcCore(input, true).finalPay
  const saving = round2(withoutMember - withMember)

  const annualFee = memberPromo?.annualFee
  let breakevenPurchases: number | undefined
  let note: string
  if (saving <= 0) {
    note = '本次使用会员并未更便宜，建议核对会员价/折扣是否优于原价。'
  } else if (annualFee && annualFee > 0) {
    breakevenPurchases = Math.ceil(annualFee / saving)
    note = `本次会员省 ¥${saving}；年费 ¥${annualFee}，约 ${breakevenPurchases} 次同类消费即可回本。`
  } else {
    note = `本次会员省 ¥${saving}。`
  }

  return { active, saving, annualFee, breakevenPurchases, note }
}

/** 对外主函数：完整计算 */
export function calculate(input: CalcInput): CalcResult {
  const core = calcCore(input, false)
  const totalSaved = round2(core.originalTotal - core.finalPay)
  const savedRate = core.originalTotal > 0 ? round2((totalSaved / core.originalTotal) * 1000) / 1000 : 0

  return {
    originalTotal: round2(core.originalTotal),
    goodsAmount: round2(core.goodsAmount),
    finalPay: core.finalPay,
    totalSaved,
    savedRate,
    breakdown: core.breakdown,
    member: buildMember(input),
    combo: buildCombo(input, core.goodsAmount)
  }
}
