const weekSlots = require('../data/plan/scheduling/week-slots.js')
const cycleMeta = require('../data/plan/cycles/strength-hybrid-v1/meta.js')
const strengthTiers = require('../data/plan/profiles/strength-tiers.js')
const auxiliaries = require('../data/plan/profiles/auxiliaries.js')
const strengthWeeks = require('./strength-weeks')
const cfWeeks = require('./cf-weeks')
const { estimateBlockGain } = require('./progress-target')
const { inferStrengthTier } = require('./strength-level')
const copy = require('../utils/copy')
const { roundToStep, weekdayIndex, WEEKDAY_LABELS } = require('../utils/format')

const CF_KIND_LABEL = {
  skill: '力量',
  strength: '力量',
  metcon: 'WOD'
}

/** 杠铃/力量向动作名（用于把技能段并入主项或识别主项） */
const BARBELL_NAME_RE = /翻|抓|挺|推|蹲|硬拉|借力|实力推|高翻|宽拉|支撑|推举|深蹲|前蹲|后蹲|硬拉|卧推|荡壶|杠铃/

const KEY_TO_STRENGTH_DAY = {
  squat: 'mon',
  // 挪威二次深蹲日：同周一处方，再按 squat_vol 降强度加容量
  squat_vol: 'mon',
  bench: 'tue',
  // 短时计划「上肢」日暂映射到卧推日处方（含背部次要项）
  upper: 'tue',
  deadlift: 'wed',
  // 挪威轻拉日：同周三硬拉处方，再按 deadlift_light 降负荷
  deadlift_light: 'wed',
  ohp: 'fri'
}

const AUX_SESSIONS = {
  'sessions/aux/running-zone2.json': require('../data/plan/sessions/aux/running-zone2.js'),
  'sessions/aux/crossfit-short-metcon.json': require('../data/plan/sessions/aux/crossfit-short-metcon.js'),
  'sessions/aux/hyrox-stations.json': require('../data/plan/sessions/aux/hyrox-stations.js'),
  'sessions/aux/athx-hybrid.json': require('../data/plan/sessions/aux/athx-hybrid.js')
}

/** 文案：练什么 + 练完会怎样（展示用） */
const PLAN_COPY = {
  'strength-hybrid-mix': {
    problem: '练什么：挪威波浪（4×4→2×2→1×8）高频蹲推拉，另加肩背日与轻拉日。',
    goal: '练完会怎样：恢复跟得上时，三大项上涨通常最快。'
  },
  'strength-linear': {
    problem: '练什么：深蹲/卧推 5×5、硬拉 1×5，外加一天肩背（实力推+引体）。',
    goal: '练完会怎样：适合打基础，每周能稳定看到重量往上走。'
  },
  'strength-time-efficient': {
    problem: '练什么：5/3/1 顶组为主，三力各一天 + 肩背日，单次更短。',
    goal: '练完会怎样：时间紧也能长期坚持，力量缓慢但持续上涨。'
  },
  'strength-build': {
    problem: '练什么：蹲、卧推、硬拉、肩背四天拆开练，组数容量更足。',
    goal: '练完会怎样：三大项继续涨，同时肩背腿围度更饱满、看着更厚。'
  }
}

const PLAN_ORDER = [
  'strength-hybrid-mix',
  'strength-linear',
  'strength-time-efficient',
  'strength-build'
]

const AUX_ALLOWED = { crossfit: 1, hyrox: 1, athx: 1 }

/** 旧档案 running → athx；只保留 1 项合法辅助 */
function normalizeAuxiliaries(list) {
  var raw = list || []
  var out = []
  for (var i = 0; i < raw.length; i++) {
    var id = raw[i]
    if (id === 'running') id = 'athx'
    if (!AUX_ALLOWED[id]) continue
    if (out.indexOf(id) >= 0) continue
    out.push(id)
  }
  return out.slice(0, 1)
}

const PLAN_OPTIONS = PLAN_ORDER.map(function (id) {
  var slot = (weekSlots.plans && weekSlots.plans[id]) || {}
  var copy = PLAN_COPY[id] || {}
  return {
    id: id,
    name: slot.name || id,
    badge: slot.badge || '',
    meta: slot.meta || '',
    problem: copy.problem || '',
    goal: copy.goal || '',
    outcome: ''
  }
})

function planDisplayName(planId) {
  for (var i = 0; i < PLAN_OPTIONS.length; i++) {
    if (PLAN_OPTIONS[i].id === planId) return PLAN_OPTIONS[i].name
  }
  var slot = weekSlots.plans && weekSlots.plans[planId]
  return (slot && slot.name) || '力量计划'
}

function auxKey(list) {
  if (!list || !list.length) return 'none'
  return list.slice().sort().join('+')
}

function normalizeWeekSlots(rawSlots) {
  return (rawSlots || []).map(function (s, i) {
    var out = {
      weekday: i + 1,
      type: s.type,
      key: s.key,
      label: s.label,
      dayLabel: WEEKDAY_LABELS[i],
      index: i
    }
    if (s.session) out.session = s.session
    return out
  })
}

function serializeWeekSlots(slots) {
  return (slots || []).map(function (s, i) {
    var out = {
      weekday: i + 1,
      type: s.type,
      key: s.key,
      label: s.label
    }
    if (s.session) out.session = s.session
    return out
  })
}

function getWeekSlots(planId, auxiliariesList, overrideSlots) {
  const plan = weekSlots.plans[planId] || weekSlots.plans['strength-hybrid-mix']
  const key = auxKey(normalizeAuxiliaries(auxiliariesList))
  var slots = (plan.combinations && plan.combinations[key]) || plan.combinations.none
  if (overrideSlots && overrideSlots.length === 7) {
    slots = overrideSlots
  }
  return normalizeWeekSlots(slots)
}

/** 读取 profile 上的周日程自定义（与当前 planId 匹配时生效） */
function resolveWeekSlots(profile, planId) {
  var pid = planId || (profile && profile.planId) || 'strength-hybrid-mix'
  var aux = (profile && profile.auxiliaries) || []
  var ov = profile && profile.weekSlotsOverride
  var useOv =
    ov &&
    ov.planId === pid &&
    Array.isArray(ov.slots) &&
    ov.slots.length === 7
  return getWeekSlots(pid, aux, useOv ? ov.slots : null)
}

function loadKg(main, profile) {
  if (!main) return null
  const load = main.load || {}
  const oneRm = (profile && profile.oneRm) || {}
  if (load.type === 'percent_1rm' && main.name) {
    const map = {
      深蹲: 'squat',
      卧推: 'bench',
      硬拉: 'deadlift',
      轻硬拉: 'deadlift',
      罗马尼亚硬拉: 'deadlift'
    }
    const key = map[main.name]
    if (key && oneRm[key] && load.percentOf1rm) {
      return roundToStep(oneRm[key] * load.percentOf1rm)
    }
  }
  if (load.type === 'percent_bench_1rm' && oneRm.bench && load.percentOf1rm) {
    return roundToStep(oneRm.bench * load.percentOf1rm)
  }
  return main.exampleKg != null ? main.exampleKg : null
}

/** 自重辅项：左侧展示「自重」，不估外加重量 */
var BODYWEIGHT_ACC_RE = /引体|悬垂|俯卧撑|平板|卷腹|鸟狗|超人|登山|开合|波比|反向划船|双杠臂屈|跪姿俯卧撑|空身|自重/

function isBodyweightAccessory(item) {
  if (!item) return false
  if (item.loadType === 'bodyweight') return true
  if (item.kg === 0) return true
  return BODYWEIGHT_ACC_RE.test(item.name || '')
}

/**
 * 负重辅项建议重量（哑铃/绳索/器械等）。
 * 优先用处方 kg / exampleKg / load；否则按卧推 1RM 比例估算。
 */
function resolveAccessoryKg(item, profile) {
  if (!item) return null
  if (isBodyweightAccessory(item)) return null
  if (item.kg != null && item.kg !== '' && !isNaN(Number(item.kg))) {
    return roundToStep(Number(item.kg))
  }
  if (item.exampleKg != null && !isNaN(Number(item.exampleKg))) {
    return roundToStep(Number(item.exampleKg))
  }
  var fromLoad = loadKg(item, profile)
  if (fromLoad != null) return fromLoad

  var bw = (profile && profile.weightKg) || 70
  var bench =
    (profile && profile.oneRm && profile.oneRm.bench) || roundToStep(bw * 0.7)
  var deadlift =
    (profile && profile.oneRm && profile.oneRm.deadlift) || roundToStep(bw * 1.2)
  var n = item.name || ''

  // 壶铃摇摆等：按体重/硬拉估常见壶铃规格（约 12–24 kg）
  if (/壶铃|荡壶|kettlebell|kb[\s_-]?swing/i.test(n)) {
    var kb = roundToStep(Math.min(bw * 0.28, deadlift * 0.16))
    return Math.max(12, Math.min(28, kb))
  }

  var factor = 0.22
  if (/侧平举|飞鸟|前平举/.test(n)) factor = 0.08
  else if (/面拉/.test(n)) factor = 0.22
  else if (/三头|下压/.test(n)) factor = 0.25
  else if (/弯举|锤式/.test(n)) factor = 0.15
  else if (/哑铃.*(推|卧)|推举|肩推/.test(n)) factor = 0.28
  else if (/高位下拉|下拉/.test(n)) factor = 0.55
  else if (/划船|拉背/.test(n)) factor = 0.4
  else if (/腿弯|腿伸|踢腿/.test(n)) factor = 0.35
  else if (/绳索|哑铃|器械|龙门|史密斯|坐姿|夹胸/.test(n)) factor = 0.2

  var kg = roundToStep(bench * factor)
  if (/侧平举|飞鸟|前平举/.test(n)) kg = Math.max(2.5, kg)
  else kg = Math.max(5, kg)
  return kg
}

/** 需外加负荷、应用建议重量的动作名（辅项 / CF 力量段） */
function isExternalLoadMove(name) {
  return /壶铃|荡壶|哑铃|绳索|器械|龙门|史密斯|kettlebell|kb[\s_-]?swing/i.test(
    name || ''
  )
}

function enrichAccessory(item, profile) {
  if (!item) return item
  var next = Object.assign({}, item)
  if (isBodyweightAccessory(next)) {
    next.kg = null
    next.loadType = 'bodyweight'
    return next
  }
  next.kg = resolveAccessoryKg(next, profile)
  next.loadType = 'external'
  return next
}

/** 挪威演化日：二次深蹲容量 / 轻拉，基于同一天处方缩放 */
function applyNorwegianVariant(day, slotKey) {
  if (!day || (slotKey !== 'squat_vol' && slotKey !== 'deadlift_light')) return day

  const next = Object.assign({}, day)
  const main = day.main ? Object.assign({}, day.main) : null

  if (slotKey === 'deadlift_light' && main) {
    const pct = (main.load && main.load.percentOf1rm) || 0.7
    const lightPct = Math.round(Math.min(pct, 0.7) * 0.75 * 100) / 100
    next.theme = '轻硬拉 · 后链'
    next.main = Object.assign({}, main, {
      name: '轻硬拉',
      movementId: 'deadlift_light',
      sets: Math.min(main.sets || 3, 3),
      reps: 6,
      restSec: 150,
      exampleKg: main.exampleKg != null ? roundToStep(main.exampleKg * 0.75) : main.exampleKg,
      load:
        main.load && main.load.type === 'percent_1rm'
          ? Object.assign({}, main.load, { percentOf1rm: lightPct })
          : main.load,
      cues: ['髋主导，杠贴近身体', '背部保持张力', '留 2–3 次余力']
    })
    if (day.secondary) {
      next.secondary = Object.assign({}, day.secondary, {
        sets: Math.min(day.secondary.sets || 3, 2)
      })
    }
    next.accessories = (day.accessories || []).filter(function (a) {
      return a && a.name !== '罗马尼亚硬拉'
    })
    next.accessoryNote = '轻拉日控制总疲劳，后链为主'
    return next
  }

  if (slotKey === 'squat_vol' && main) {
    const pct = (main.load && main.load.percentOf1rm) || 0.7
    const volPct = Math.round(Math.min(pct, 0.7) * 0.85 * 100) / 100
    next.theme = '深蹲 · 容量'
    next.main = Object.assign({}, main, {
      sets: Math.max(main.sets || 3, 4),
      reps: Math.max(main.reps || 5, 6),
      restSec: 150,
      exampleKg: main.exampleKg != null ? roundToStep(main.exampleKg * 0.85) : main.exampleKg,
      load:
        main.load && main.load.type === 'percent_1rm'
          ? Object.assign({}, main.load, { percentOf1rm: volPct })
          : main.load,
      cues: ['技术优先，杠速稳定', '不要追极限重量']
    })
    // 已有独立轻拉日时，容量深蹲日去掉 RDL，避免后链堆叠
    next.accessories = (day.accessories || []).filter(function (a) {
      return a && a.name !== '罗马尼亚硬拉'
    })
    next.accessoryNote = '二次深蹲日偏容量与技术'
    return next
  }

  return day
}

function getStrengthFile(tier, week) {
  return strengthWeeks.load(week, tier)
}

/** 挪威主课后不宜再堆重辅；重复合/大重量辅项剔除 */
var HEAVY_ACCESSORY_RE = /罗马尼亚硬拉|硬拉|腿举|臀推|潘德勒|倒蹬|弓步|哈克|负重/

function isLightAccessory(item) {
  if (!item || !item.name) return false
  if (HEAVY_ACCESSORY_RE.test(item.name)) return false
  return true
}

function lightenAccessory(item) {
  var next = Object.assign({}, item)
  if (/引体/.test(next.name || '')) {
    next.sets = Math.min(next.sets != null ? next.sets : 2, 2)
    next.reps = Math.min(next.reps != null ? next.reps : 6, 6)
  } else if (next.sets != null && next.sets > 2) {
    next.sets = 2
  }
  return next
}

/**
 * 挪威力训：辅项最多 2 个，且偏轻量恢复向
 */
function trimNorwegianAccessories(list, slotKey) {
  var picked = []
  for (var i = 0; i < (list || []).length; i++) {
    var item = list[i]
    if (!isLightAccessory(item)) continue
    picked.push(lightenAccessory(item))
    if (picked.length >= 2) break
  }
  if (picked.length) return picked

  // 兜底：按日给 1 个轻辅，避免主课后空列表无指引
  if (slotKey === 'ohp') {
    return [
      {
        name: '引体向上',
        sets: 2,
        reps: 6,
        restSec: 90,
        scalingNote: '做不了严格引体时用弹力带或反向划船'
      },
      { name: '绳索面拉', sets: 2, reps: 12, region: 'shoulder' }
    ]
  }
  if (slotKey === 'bench' || slotKey === 'upper') {
    return [{ name: '绳索面拉', sets: 2, reps: 12, region: 'shoulder' }]
  }
  if (slotKey === 'deadlift' || slotKey === 'deadlift_light') {
    return [
      {
        name: '引体向上',
        sets: 2,
        reps: 6,
        restSec: 90,
        scalingNote: '做不了严格引体时用弹力带或反向划船'
      }
    ]
  }
  return [{ name: '悬垂举腿', sets: 2, reps: 12 }]
}

/**
 * 主项 scheme：由 planId + 槽位决定
 */
function resolveMainScheme(planId, slotKey) {
  // 肩背日：各计划统一走 OHP 处方，不用挪威/531/5×5 主项波浪
  if (slotKey === 'ohp') return 'ohp'
  if (planId === 'strength-time-efficient') return '531'
  if (planId === 'strength-linear' || planId === 'strength-build') return 'linear5x5'
  if (slotKey === 'deadlift_light') return 'light'
  if (slotKey === 'squat_vol') return 'volume'
  return 'norwegian'
}

function accessoryNoteForScheme(scheme) {
  if (scheme === 'ohp') return '肩背日：主项实力推，辅项补背部与肩袖'
  if (scheme === '531') return '5/3/1 主课后辅项从简，最多 2 个轻量动作'
  if (scheme === 'linear5x5') return '5×5 主课后辅项从简，最多 2 个轻量动作'
  return '挪威主课后辅项从简，最多 2 个轻量动作'
}

function getStrengthDay(profile, slot) {
  const tier = (profile && profile.strengthTier) || 'advanced'
  const week = (profile && profile.currentWeek) || 1
  const planId = (profile && profile.planId) || 'strength-hybrid-mix'
  const file = getStrengthFile(tier, week)
  const dayKey = KEY_TO_STRENGTH_DAY[slot.key]
  const raw = (file.days && file.days[dayKey]) || null
  if (!raw) return null
  // 仅挪威计划使用二次深蹲 / 轻拉变体处方
  const day =
    planId === 'strength-hybrid-mix' ? applyNorwegianVariant(raw, slot.key) : raw
  const scheme = resolveMainScheme(planId, slot.key)
  const main = day.main
    ? Object.assign({}, day.main, {
        kg: loadKg(day.main, profile),
        scheme: scheme,
        currentWeek: week
      })
    : null
  // 产品约定：主项永远只有 1 个；原 secondary 并入辅助列表最前
  const accessories = []
  if (day.secondary && isLightAccessory(day.secondary)) {
    accessories.push(
      enrichAccessory(
        Object.assign({}, lightenAccessory(day.secondary), {
          kg: loadKg(day.secondary, profile),
          fromSecondary: true
        }),
        profile
      )
    )
  }
  ;(day.accessories || []).forEach(function (a) {
    accessories.push(enrichAccessory(a, profile))
  })
  const trimmed = trimNorwegianAccessories(accessories, slot.key).map(function (a) {
    return enrichAccessory(a, profile)
  })
  return {
    phase: file.phase,
    week: week,
    theme: day.theme,
    main: main,
    accessories: trimmed,
    accessoryNote: accessoryNoteForScheme(scheme),
    scalingNote: (trimmed[0] && trimmed[0].scalingNote) || '',
    type: 'strength'
  }
}

function cfLevelOf(profile) {
  return (profile && (profile.cfLevel || profile.strengthTier)) || 'advanced'
}

function formatCfBlockDetail(block) {
  if (!block) return ''
  if (block.prescription) return block.prescription
  if (block.movements && block.movements.length) {
    return block.movements.join(' + ')
  }
  if (block.format) return block.format
  if (block.detail) return block.detail
  return ''
}

function isMetconBlock(b) {
  if (!b) return false
  if (b.kind === 'metcon') return true
  var n = b.name || ''
  return /metcon|wod|amrap|emom|for\s*time|回合/i.test(n)
}

function isBarbellLike(b) {
  if (!b) return false
  if (b.kind === 'strength') return true
  return BARBELL_NAME_RE.test(b.name || '')
}

/**
 * CF 课统一成力量日同构：主项 1 个杠铃力量，辅项 = WOD。
 * 技能段不单独占一段，有用信息并入主项备注。
 */
function structureCfSession(rawBlocks, meta) {
  var list = rawBlocks || []
  var strength = null
  var skill = null
  var wods = []
  var others = []
  // 先锁定 kind=strength 的杠铃主项，再收集技能/WOD
  for (var i = 0; i < list.length; i++) {
    var b = list[i]
    if (isMetconBlock(b)) {
      wods.push(b)
      continue
    }
    if (b.kind === 'strength') {
      if (!strength) strength = b
      else others.push(b)
      continue
    }
    if (b.kind === 'skill' || isBarbellLike(b)) {
      if (!skill) skill = b
      else others.push(b)
      continue
    }
    others.push(b)
  }
  // 无 strength 段时，才用杠铃向技能充当主项
  var mainRaw = strength || skill || others.shift() || null
  if (!mainRaw && wods.length) {
    mainRaw = { name: '力量准备', prescription: '轻重量活动度 5–8 分钟', durationMin: 8, kind: 'strength' }
  }
  var prepBits = []
  if (skill && skill !== mainRaw) {
    var skillDetail = formatCfBlockDetail(skill)
    prepBits.push(skill.name + (skillDetail ? ' ' + skillDetail : ''))
  }
  for (var j = 0; j < others.length; j++) {
    if (others[j] === mainRaw) continue
    var od = formatCfBlockDetail(others[j])
    prepBits.push(others[j].name + (od ? ' ' + od : ''))
  }

  var mainDetail = formatCfBlockDetail(mainRaw)
  var mainMinutes = (mainRaw && (mainRaw.durationMin || mainRaw.capMin || mainRaw.minutes)) || 15
  if (skill && skill !== mainRaw) {
    mainMinutes += skill.durationMin || skill.minutes || 0
  }
  var main = {
    name: (mainRaw && mainRaw.name) || '力量',
    kind: 'strength',
    kindLabel: '力量',
    minutes: mainMinutes,
    detail: mainDetail,
    setsText: mainDetail,
    cues: (mainRaw && mainRaw.cues) || [],
    hint: prepBits.length ? '技术准备：' + prepBits.join('；') : mainDetail,
    role: 'main'
  }

  var accessories = wods.map(function (w) {
    var detail = formatCfBlockDetail(w)
    var minutes = w.durationMin || w.capMin || w.minutes || 12
    return {
      name: w.name || 'WOD',
      kind: 'metcon',
      kindLabel: 'WOD',
      style: w.style || '',
      minutes: minutes,
      capMin: w.capMin || null,
      detail: detail,
      setsText: detail,
      movements: w.movements || [],
      cues: w.cues || [],
      hint: detail,
      role: 'wod'
    }
  })

  // 执行序列：主项 → WOD（不再插入独立技能段）
  var blocks = [main].concat(accessories)
  var closed = !list.length
  var name = main.name
  if (meta && meta.closed) {
    closed = true
    name = meta.title || '本周无 CF 课'
  }
  return {
    name: name,
    durationMin: (meta && meta.durationMin) || 0,
    note: (meta && (meta.intensityNote || meta.note)) || '主项杠铃力量，辅项 WOD；控强度，别抢力量日恢复',
    closed: closed,
    main: main,
    accessories: accessories,
    blocks: blocks
  }
}

function normalizeCfBlocks(rawBlocks) {
  // 兼容旧调用：仍返回扁平 blocks，但已是主项+WOD
  return structureCfSession(rawBlocks, null).blocks
}

function pickWeeklyCfRaw(file, slots, slotIndex) {
  var sessions = (file && file.sessions) || {}
  var keys = Object.keys(sessions).sort(function (a, b) {
    return (sessions[a].cfIndex || 0) - (sessions[b].cfIndex || 0)
  })
  if (!keys.length) return null
  var order = -1
  for (var i = 0; i <= slotIndex; i++) {
    if (slots[i] && slots[i].key === 'crossfit') order++
  }
  if (order < 0) order = 0
  if (order >= keys.length) order = keys.length - 1
  return sessions[keys[order]]
}

function resolveShortMetcon(tier) {
  var raw = AUX_SESSIONS['sessions/aux/crossfit-short-metcon.json']
  var t = tier || 'advanced'
  var mapped = (raw.blocks || []).map(function (b) {
    var examples = b.examples || {}
    var concrete = examples[t] || examples.advanced || examples.beginner
    var detail = ''
    var name = b.name
    var isWod = /metcon|wod/i.test(b.name || '')
    if (Array.isArray(concrete)) {
      // 短课：取第一个杠铃向动作做主项名
      name = concrete[0] || b.name
      detail = isWod ? concrete.join(' + ') : '技术质量优先 · ' + concrete.slice(0, 2).join(' / ')
    } else if (typeof concrete === 'string') {
      var head = concrete.split(':')[0]
      name = isWod ? head || b.name : head || concrete
      detail = concrete
    } else if (b.format) {
      detail = b.format
    }
    return {
      name: name,
      kind: isWod ? 'metcon' : 'strength',
      durationMin: b.minutes || (isWod ? 12 : 8),
      prescription: detail,
      movements: isWod && typeof concrete === 'string' ? [concrete] : undefined,
      cues: b.cues || []
    }
  })
  var structured = structureCfSession(mapped, {
    durationMin: raw.durationMin || 18,
    intensityNote: '控强度，为力量日留恢复'
  })
  return structured
}

function attachCfLoadKg(structured, profile) {
  if (!structured || !structured.main) return structured
  var main = structured.main
  if (main.kg == null && isExternalLoadMove(main.name)) {
    main = Object.assign({}, main, {
      kg: resolveAccessoryKg(main, profile),
      loadType: 'external'
    })
    structured = Object.assign({}, structured, { main: main })
  }
  return structured
}

function getCfSession(profile, slots, slotIndex) {
  var week = (profile && profile.currentWeek) || 1
  var level = cfLevelOf(profile)
  var file = cfWeeks.load(week, level)
  var raw = pickWeeklyCfRaw(file, slots, slotIndex)
  if (!raw) return attachCfLoadKg(resolveShortMetcon(level), profile)

  var closed = file.format === 'off' || !(raw.blocks || []).length
  if (closed) {
    return {
      name: raw.title || '本周无 CF 课',
      durationMin: 0,
      note: raw.intensityNote || raw.subtitle || '测力周不安排 CF',
      closed: true,
      main: null,
      accessories: [],
      blocks: []
    }
  }
  return attachCfLoadKg(
    structureCfSession(raw.blocks, {
      durationMin: raw.durationMin || 0,
      intensityNote: raw.intensityNote || '主项杠铃力量，辅项 WOD；控强度，别抢力量日恢复',
      title: raw.title
    }),
    profile
  )
}

/** AthX：力量区按三大项 1RM 给出可执行重量 */
function enrichAthxSession(session, profile) {
  if (!session) return session
  var oneRm = (profile && profile.oneRm) || {}
  var squat = Number(oneRm.squat) || 0
  var bench = Number(oneRm.bench) || 0
  var deadlift = Number(oneRm.deadlift) || 0
  // 3×3 留 2～3 次余力 ≈ 70% 深蹲 1RM
  var squatKg = squat > 0 ? roundToStep(squat * 0.7) : 60
  if (squatKg < 20) squatKg = 20
  // 实力推备选：约卧推 55%（与肩背日同口径）
  var pressKg =
    bench > 0 ? roundToStep(bench * 0.55) : roundToStep(Math.max(20, squatKg * 0.45))
  if (pressKg < 20) pressKg = 20
  var swingKg =
    squat > 0
      ? roundToStep(Math.min(32, Math.max(12, squat * 0.18)))
      : 16
  var farmerEach =
    deadlift > 0
      ? roundToStep(Math.min(40, Math.max(14, deadlift * 0.15)))
      : squat > 0
        ? roundToStep(Math.min(40, Math.max(14, squat * 0.22)))
        : 20

  var blocks = (session.blocks || []).map(function (b) {
    var blk = Object.assign({}, b)
    var name = blk.name || ''
    if (/力量/.test(name)) {
      blk.kg = squatKg
      blk.load = { type: 'percent_1rm', percentOf1rm: 0.7, lift: 'squat' }
      blk.name = '力量区 · 深蹲'
      blk.prescription = squatKg + ' kg · 3×3'
      blk.cues = [
        '杠铃深蹲 3 组 × 3 次 @ ' + squatKg + ' kg（约 70% 深蹲 1RM，留 2～3 次余力）',
        '也可改做实力推 3×3 @ ' + pressKg + ' kg',
        '质量优先，模拟 AthX 力量区，不追求力竭'
      ]
    } else if (/有氧|轻松跑/.test(name)) {
      blk.cues = [
        '慢跑约 ' +
          (blk.distanceKm != null ? blk.distanceKm : 1.6) +
          ' km / ' +
          (blk.minutes || 12) +
          ' 分钟，能说完整短句',
        '无场地可改划船机同时长同配速感',
        '练节奏与呼吸，不为冲刺'
      ]
    } else if (/混合|收尾|摆荡|农夫/.test(name)) {
      blk.kg = swingKg
      blk.cues = [
        '壶铃摆荡 3×12 @ ' + swingKg + ' kg',
        '农夫走 3×20 m，每手约 ' + farmerEach + ' kg',
        '组间短歇；technique 模式负荷与趟数减半'
      ]
    }
    return blk
  })

  return Object.assign({}, session, { blocks: blocks })
}

function getAuxSession(slot, profile, slots, slotIndex) {
  if (!slot) return null

  if (slot.key === 'crossfit') {
    var cf = getCfSession(profile, slots || [], slotIndex != null ? slotIndex : 0)
    return {
      type: slot.type,
      key: slot.key,
      label: slot.label,
      session: {
        id: 'cf-weekly',
        name: cf.name,
        durationMin: cf.durationMin,
        note: cf.note,
        closed: cf.closed,
        main: cf.main || null,
        accessories: cf.accessories || [],
        blocks: cf.blocks || [],
        layout: 'main-wod'
      }
    }
  }

  if (!slot.session) return null
  var session = AUX_SESSIONS[slot.session]
  if (!session) return null

  // 短时模板兜底：把 examples 落成具体动作
  if (slot.session.indexOf('crossfit-short-metcon') >= 0) {
    var shortCf = resolveShortMetcon(cfLevelOf(profile))
    return {
      type: slot.type,
      key: slot.key,
      label: slot.label,
      session: {
        id: session.id,
        name: shortCf.name,
        durationMin: shortCf.durationMin,
        note: shortCf.note,
        closed: false,
        main: shortCf.main || null,
        accessories: shortCf.accessories || [],
        blocks: shortCf.blocks || [],
        layout: 'main-wod'
      }
    }
  }

  if (slot.key === 'athx' || session.auxId === 'athx') {
    session = enrichAthxSession(session, profile)
  }

  return {
    type: slot.type,
    key: slot.key,
    label: slot.label,
    session: session
  }
}

function buildTodayView(profile, selectedWeekday) {
  const planId = (profile && profile.planId) || 'strength-hybrid-mix'
  const slots = resolveWeekSlots(profile, planId)
  const todayIdx = weekdayIndex() - 1
  const sel = selectedWeekday != null ? selectedWeekday : todayIdx
  const slot = slots[sel]
  const isToday = sel === todayIdx
  const planMeta = PLAN_OPTIONS.find(function (p) {
    return p.id === planId
  }) || PLAN_OPTIONS[0]

  let detail = null
  if (slot.type === 'strength') {
    detail = getStrengthDay(profile, slot)
  } else if (slot.type === 'rest') {
    detail = {
      type: 'rest',
      theme: '休息日',
      note: '不安排力量与高强度辅助；完成 Zone2 步行 20–30 分钟 + 髋踝活动度'
    }
  } else {
    detail = getAuxSession(slot, profile, slots, sel)
  }

  return {
    // 用户可见标题统一用所选计划名（与推荐页 / 我的一致）
    cycleName: planMeta.name,
    planName: planMeta.name,
    week: (profile && profile.currentWeek) || 1,
    phase: cycleMeta.phases[String((profile && profile.currentWeek) || 1)] || '',
    slots: slots,
    selectedIndex: sel,
    isToday: isToday,
    slot: slot,
    detail: detail,
    isPreview: !isToday
  }
}

function getPlanOptions(profile) {
  const aux = (profile && profile.auxiliaries) || []
  return PLAN_OPTIONS.map(function (p) {
    const slots = getWeekSlots(p.id, aux)
    const gain = estimateBlockGain(Object.assign({}, profile, { planId: p.id }))
    return Object.assign({}, p, {
      outcome: gain.summary,
      weekLabels: slots.map(function (s) {
        return s.label
      })
    })
  })
}

function slotSummary(slot, profile, week, slots, slotIndex) {
  const copyProfile = Object.assign({}, profile, { currentWeek: week })
  if (slot.type === 'strength') {
    const day = getStrengthDay(copyProfile, slot)
    if (!day || !day.main) {
      return {
        kind: 'strength',
        title: slot.label || '力量',
        detail: '—',
        mainName: slot.label || '力量',
        mainSets: '—',
        accessories: []
      }
    }
    const accessories = (day.accessories || []).map(function (a) {
      return {
        name: copy.moveName(a.name),
        setsText: copy.setsReps(a.sets, a.reps)
      }
    })
    var mainName = copy.moveName(day.main.name) || copy.slotLabel(slot.label) || '力量'
    var mainSets = copy.setsReps(day.main.sets, day.main.reps)
    return {
      kind: 'strength',
      title: mainName,
      detail: mainSets,
      mainName: mainName,
      mainSets: mainSets,
      accessories: accessories
    }
  }
  if (slot.type === 'rest') {
    return {
      kind: 'rest',
      title: '主动恢复',
      detail: '休息',
      mainName: '主动恢复',
      mainSets: '',
      accessories: []
    }
  }
  const aux = getAuxSession(slot, copyProfile, slots, slotIndex)
  const session = aux && aux.session
  if (!session) {
    return {
      kind: 'aux',
      title: slot.label || '调节',
      detail: '调节课',
      mainName: slot.label || '调节',
      mainSets: '',
      accessories: [],
      layout: ''
    }
  }
  // CF：与力量日同构 —— 主项杠铃力量 + 辅项 WOD
  if (session.layout === 'main-wod' && session.main) {
    var wodAcc = (session.accessories || []).map(function (a) {
      return {
        name: a.name,
        setsText: a.setsText || a.detail || (a.minutes ? a.minutes + ' 分钟' : '')
      }
    })
    return {
      kind: 'aux',
      title: session.main.name,
      detail: session.main.setsText || session.main.detail || '',
      mainName: session.main.name,
      mainSets: session.main.setsText || session.main.detail || '',
      accessories: wodAcc,
      layout: 'main-wod',
      closed: !!session.closed
    }
  }
  var blocks = (session.blocks || []).map(function (b) {
    var label = b.name
    if (b.kindLabel) label = b.kindLabel + ' · ' + b.name
    return {
      name: label,
      setsText: b.minutes ? b.minutes + ' 分钟' : b.detail || ''
    }
  })
  var auxDetail = session.note || '调节课'
  if (blocks.length) {
    auxDetail = blocks
      .map(function (b) {
        return b.name
      })
      .join(' → ')
  } else if (session.durationMin) {
    auxDetail = session.durationMin + ' 分钟'
  }
  return {
    kind: 'aux',
    title: session.name || slot.label || '调节',
    detail: auxDetail,
    mainName: session.name || slot.label || '调节',
    mainSets: session.closed ? '休' : session.durationMin ? session.durationMin + ' 分钟' : '',
    accessories: blocks,
    layout: '',
    closed: !!session.closed
  }
}

function buildCycleOverview(profile) {
  const planId = (profile && profile.planId) || 'strength-hybrid-mix'
  const slots = resolveWeekSlots(profile, planId)
  const currentWeek = (profile && profile.currentWeek) || 1
  const planMeta = PLAN_OPTIONS.find(function (p) {
    return p.id === planId
  }) || PLAN_OPTIONS[0]
  const totalWeeks = (cycleMeta.optionalTestWeek || cycleMeta.weeks || 5)
  const weeks = []
  for (let w = 1; w <= totalWeeks; w++) {
    const days = slots.map(function (slot, i) {
      const summary = slotSummary(slot, profile, w, slots, i)
      return {
        dayLabel: WEEKDAY_LABELS[i],
        weekday: slot.weekday,
        kind: summary.kind,
        title: summary.title,
        detail: summary.detail,
        mainName: summary.mainName || summary.title,
        mainSets: summary.mainSets || summary.detail || '',
        accessories: summary.accessories || [],
        layout: summary.layout || '',
        closed: !!summary.closed
      }
    })
    weeks.push({
      week: w,
      phase: cycleMeta.phases[String(w)] || '',
      current: w === currentWeek,
      days: days
    })
  }
  var gain = estimateBlockGain(profile)
  return {
    cycleName: planMeta.name,
    planName: planMeta.name,
    problem: planMeta.problem || '',
    goal: planMeta.goal || cycleMeta.goal || '',
    outcome: gain.summary,
    gain: gain,
    currentWeek: currentWeek,
    totalWeeks: totalWeeks,
    strengthTier: (profile && profile.strengthTier) || '',
    weeks: weeks
  }
}

module.exports = {
  auxiliaries: auxiliaries,
  strengthTiers: strengthTiers,
  cycleMeta: cycleMeta,
  PLAN_OPTIONS: PLAN_OPTIONS,
  planDisplayName: planDisplayName,
  normalizeAuxiliaries: normalizeAuxiliaries,
  auxKey: auxKey,
  inferStrengthTier: inferStrengthTier,
  getWeekSlots: getWeekSlots,
  resolveWeekSlots: resolveWeekSlots,
  serializeWeekSlots: serializeWeekSlots,
  buildTodayView: buildTodayView,
  getPlanOptions: getPlanOptions,
  buildCycleOverview: buildCycleOverview,
  getStrengthDay: getStrengthDay,
  getAuxSession: getAuxSession,
  loadKg: loadKg,
  resolveAccessoryKg: resolveAccessoryKg,
  isExternalLoadMove: isExternalLoadMove,
  estimateBlockGain: estimateBlockGain
}
