/**
 * 今日状态 → 处方调整（重量 / 组数 / 辅项动作）。
 * 简化为身体三态，自动映射时长与强度。
 */
const { roundToStep } = require('../utils/format')

const BODY_OPTIONS = [
  { id: 'normal', label: '还行' },
  { id: 'tired', label: '有点累' },
  { id: 'pain', label: '不太舒服' }
]

const BODY_PRESETS = {
  normal: { duration: 'normal', intensity: 'plan' },
  tired: { duration: 'short', intensity: 'down' },
  pain: { duration: 'main_only', intensity: 'safe' }
}

function resolveAdjustments(input) {
  if (input && typeof input === 'object' && input.intensity) {
    return {
      body: input.body || 'normal',
      duration: input.duration || 'normal',
      intensity: input.intensity || 'plan'
    }
  }
  var body = input || 'normal'
  if (!BODY_PRESETS[body]) body = 'normal'
  var p = BODY_PRESETS[body]
  return { body: body, duration: p.duration, intensity: p.intensity }
}

/**
 * @param {object} detail buildTodayView().detail（力量日）
 * @param {string|object} adjustments body id 或完整 adjustments
 */
function applyStrengthAdjustments(detail, adjustments) {
  var adj = resolveAdjustments(adjustments)
  if (!detail || !detail.main) {
    return {
      main: null,
      accessories: [],
      adjustments: adj,
      note: ''
    }
  }

  var baseKg = detail.main.kg != null ? detail.main.kg : detail.main.exampleKg || 60
  var kg = baseKg
  if (adj.intensity === 'down') kg = roundToStep(baseKg * 0.95)
  if (adj.intensity === 'safe') kg = roundToStep(baseKg * 0.9)
  var loadScale = baseKg > 0 ? kg / baseKg : 1

  var sets = detail.main.sets || 3
  if (adj.duration === 'short' && sets > 2) sets = sets - 1
  if (adj.duration === 'main_only' && sets > 2) sets = Math.max(2, sets - 1)

  // 挪威课：疲劳/缩短时去掉最后的 1×8 回退组
  var dropBackoff = adj.duration === 'short' || adj.duration === 'main_only'

  var accessories = (detail.accessories || []).map(function (a) {
    var next = Object.assign({}, a)
    if (next.kg != null && next.kg !== '' && loadScale !== 1 && next.loadType !== 'bodyweight') {
      next.kg = roundToStep(Number(next.kg) * loadScale)
    }
    return next
  })
  if (adj.duration === 'main_only') {
    accessories = []
  } else if (adj.duration === 'short') {
    accessories = accessories.slice(0, 1).map(function (a) {
      var next = Object.assign({}, a)
      if (next.sets != null && next.sets > 2) next.sets = next.sets - 1
      return next
    })
  }

  var note = ''
  if (adj.body === 'tired') note = '今天有点累：重量降一点，少练一组，后面也精简了'
  if (adj.body === 'pain') note = '今天不太舒服：重量再降一点，只练大动作'

  return {
    main: Object.assign({}, detail.main, {
      kg: kg,
      sets: sets,
      loadScale: loadScale,
      dropBackoff: dropBackoff
    }),
    accessories: accessories,
    adjustments: adj,
    note: note
  }
}

module.exports = {
  BODY_OPTIONS: BODY_OPTIONS,
  BODY_PRESETS: BODY_PRESETS,
  resolveAdjustments: resolveAdjustments,
  applyStrengthAdjustments: applyStrengthAdjustments
}
