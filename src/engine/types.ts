// 折扣计算器的核心数据类型定义

/** 单品多件多折的类型 */
export type MultiBuyType = 'secondHalf' | 'buyNGetOneFree' | 'fullMDiscount'

/** 单品多件多折规则 */
export interface MultiBuy {
  type: MultiBuyType
  /** fullMDiscount 用：满 m 件 */
  m?: number
  /** fullMDiscount 用：打几折（0.8 = 8 折） */
  discountRate?: number
}

/** 商品 */
export interface Item {
  id: string
  name: string
  /** 原价（单价） */
  originalPrice: number
  quantity: number
  /** 是否走会员专享价 */
  isMemberPrice: boolean
  /** 会员专享单价 */
  memberPrice?: number
  /** 单品多件多折 */
  multiBuy?: MultiBuy
}

/** 促销类型 */
export type PromotionType =
  | 'threshold' // 满减 / 满折（店铺或平台）
  | 'coupon' // 优惠券（店铺券 / 平台券 / 折扣券）
  | 'member' // 会员折扣 / 会员费（用于回本测算）
  | 'deduct' // 红包 / 积分 / 淘金币抵扣
  | 'cashback' // 返现 / 返利（不计入到手价）

/** 作用范围 */
export type Scope = 'shop' | 'platform' | 'order'

/** 促销规则 */
export interface Promotion {
  id: string
  type: PromotionType
  label?: string
  scope: Scope
  /** 门槛口径：按商品金额(goods) 还是按实时递减金额(running) 计算门槛 */
  baseOn?: 'goods' | 'running'

  // —— threshold / coupon 共用 ——
  /** 满 X */
  threshold?: number
  /** 减 Y（满减金额 / 券面额） */
  reduce?: number
  /** 折扣率（满折 / 折扣券，0.9 = 9 折） */
  discountRate?: number

  // —— member ——
  /** 会员折扣率（如 0.95 = 95 折），作用于所有商品单价 */
  memberDiscountRate?: number
  /** 会员年费（仅用于回本测算） */
  annualFee?: number

  // —— deduct ——
  /** 抵扣额（红包 / 积分 / 淘金币） */
  amount?: number
  /** 抵扣封顶（绝对金额） */
  cap?: number

  // —— cashback ——
  /** 返现比例（如 0.05 = 返 5%） */
  cashbackRate?: number
  /** 固定返现额 */
  cashbackAmount?: number
}

/** 规则预设 */
export type PresetKey = 'taobao' | 'jd' | 'pdd' | 'custom'

export interface CalcInput {
  items: Item[]
  promotions: Promotion[]
  preset?: PresetKey
}

/** 计算明细中的一步 */
export interface BreakdownEntry {
  key: string
  label: string
  kind: PromotionType | 'memberPrice' | 'multiBuy' | 'goods'
  /** 计费基数（这一步用来判断/计算的金额） */
  baseAmount: number
  /** 本步优惠金额（正数 = 减钱）；返现为返现额（affectsPay=false） */
  saved: number
  /** 是否影响最终到手价（返现不影响） */
  affectsPay: boolean
  note?: string
}

/** 凑单建议 */
export interface ComboSuggestion {
  promotionId: string
  label: string
  threshold: number
  current: number
  /** 还差多少到门槛 */
  gap: number
  /** 达到门槛后可减 / 可优惠 */
  reduce: number
  /** 粗略判断：优惠额是否大于需凑金额（仅当确实需要这些商品时才有意义） */
  worthIt: boolean
  note: string
}

/** 会员回本信息 */
export interface MemberInfo {
  active: boolean
  /** 本次因会员（专享价 + 折扣）节省的金额 */
  saving: number
  annualFee?: number
  /** 回本所需次数（annualFee / 单次节省，向上取整） */
  breakevenPurchases?: number
  note: string
}

/** 计算结果 */
export interface CalcResult {
  /** 原价合计（无任何优惠） */
  originalTotal: number
  /** 单品折后合计（各满减/券的计费基数） */
  goodsAmount: number
  /** 到手价（实付） */
  finalPay: number
  /** 省了多少（原价 - 到手价） */
  totalSaved: number
  /** 省了百分之多少 */
  savedRate: number
  /** 逐层明细 */
  breakdown: BreakdownEntry[]
  /** 会员回本信息 */
  member?: MemberInfo
  /** 凑单建议 */
  combo: ComboSuggestion[]
}
