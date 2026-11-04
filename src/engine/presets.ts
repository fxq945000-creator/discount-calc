import type { PresetKey } from './types'

export interface Preset {
  key: PresetKey
  name: string
  /** 满减 / 券门槛的默认计算口径 */
  thresholdBase: 'goods' | 'running'
  note: string
}

export const PRESETS: Record<PresetKey, Preset> = {
  taobao: {
    key: 'taobao',
    name: '淘宝 / 天猫',
    thresholdBase: 'goods',
    note: '满减、跨店满减、券的门槛通常按「商品金额（折后、券前）」计算。'
  },
  jd: {
    key: 'jd',
    name: '京东',
    thresholdBase: 'goods',
    note: 'PLUS 会员价与店铺满减并存，券门槛多按商品金额计算。'
  },
  pdd: {
    key: 'pdd',
    name: '拼多多',
    thresholdBase: 'goods',
    note: '百亿补贴多为直降；店铺满减、平台券按商品金额计算。'
  },
  custom: {
    key: 'custom',
    name: '自定义',
    thresholdBase: 'goods',
    note: '自由设置每条促销的门槛口径（商品金额 / 实时递减金额）。'
  }
}

export const PRESET_LIST = Object.values(PRESETS)
