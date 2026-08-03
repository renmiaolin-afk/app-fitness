/**
 * 力量主项组计划：按 scheme 分支
 * - norwegian: 70% 4×4 → 80% 2×2 → 70% 1×8
 * - 531: Wendler 顶组周循环（TM≈90%1RM）
 * - linear5x5: 蹲/卧 5×5；硬拉 1×5
 */
const { roundToStep } = require('../utils/format')

/** @typedef {{ kind: 'warmup'|'work', block?: string, kg: number, reps: number, restSec: number }} MainSet */

function resolveOneRm(main) {
  if (!main) return 60
  if (main.oneRm != null && Number(main.oneRm) > 0) return Number(main.oneRm)
  var kg = main.kg != null ? Number(main.kg) : Number(main.exampleKg) || 60
  var scale = main.loadScale != null ? Number(main.loadScale) : 1
  if (!scale || scale <= 0) scale = 1
  var pct = main.load && main.load.percentOf1rm ? Number(main.load.percentOf1rm) : 0
  if (pct > 0 && kg > 0) return kg / scale / pct
  return kg / scale / 0.7
}

function pushWarmups(plan, oneRm, scale, topPct) {
  var steps = [
    { pct: 0.4, reps: 5, restSec: 60 },
    { pct: 0.55, reps: 3, restSec: 90 }
  ]
  var prevKg = 0
  var cap = roundToStep(oneRm * topPct * scale)
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i]
    var kg = roundToStep(oneRm * s.pct * scale)
    if (kg < 20) kg = 20
    if (kg >= cap) continue
    if (kg === prevKg) continue
    prevKg = kg
    plan.push({
      kind: 'warmup',
      block: 'warmup',
      kg: kg,
      reps: s.reps,
      restSec: s.restSec
    })
  }
}

function pushBlock(plan, block, sets, reps, kg, restSec) {
  for (var i = 0; i < sets; i++) {
    plan.push({
      kind: 'work',
      block: block,
      kg: kg,
      reps: reps,
      restSec: restSec
    })
  }
}

function buildNorwegianPlan(plan, oneRm, scale, dropBackoff) {
  pushWarmups(plan, oneRm, scale, 0.7)
  var kg70 = roundToStep(oneRm * 0.7 * scale)
  var kg80 = roundToStep(oneRm * 0.8 * scale)
  if (kg70 < 20) kg70 = 20
  if (kg80 < kg70) kg80 = kg70
  pushBlock(plan, '4x4', 4, 4, kg70, 180)
  pushBlock(plan, '2x2', 2, 2, kg80, 210)
  if (!dropBackoff) {
    pushBlock(plan, '1x8', 1, 8, kg70, 180)
  }
}

/**
 * Wendler 5/3/1：TM = 90% 1RM；周循环 5s / 3s / 5/3/1 / 轻周
 * 百分比相对 TM（非 1RM）
 */
function build531Plan(plan, oneRm, scale, week, dropBackoff) {
  var tm = oneRm * 0.9
  var cycleWeek = ((Math.max(1, Number(week) || 1) - 1) % 4) + 1
  var waves = {
    1: [
      { pct: 0.65, reps: 5, block: '爬坡' },
      { pct: 0.75, reps: 5, block: '爬坡' },
      { pct: 0.85, reps: 5, block: '顶组' }
    ],
    2: [
      { pct: 0.7, reps: 3, block: '爬坡' },
      { pct: 0.8, reps: 3, block: '爬坡' },
      { pct: 0.9, reps: 3, block: '顶组' }
    ],
    3: [
      { pct: 0.75, reps: 5, block: '爬坡' },
      { pct: 0.85, reps: 3, block: '爬坡' },
      { pct: 0.95, reps: 1, block: '顶组' }
    ],
    4: [
      { pct: 0.4, reps: 5, block: '轻周' },
      { pct: 0.5, reps: 5, block: '轻周' },
      { pct: 0.6, reps: 5, block: '轻周' }
    ]
  }
  var sets = waves[cycleWeek] || waves[1]
  var firstWorkPct = sets[0].pct * 0.9
  pushWarmups(plan, oneRm, scale, Math.max(0.55, firstWorkPct))

  for (var i = 0; i < sets.length; i++) {
    var s = sets[i]
    var kg = roundToStep(tm * s.pct * scale)
    if (kg < 20) kg = 20
    pushBlock(plan, s.block, 1, s.reps, kg, s.block === '顶组' ? 210 : 150)
  }

  if (!dropBackoff && cycleWeek !== 4) {
    var backKg = roundToStep(tm * 0.6 * scale)
    if (backKg < 20) backKg = 20
    pushBlock(plan, '回退', 1, 8, backKg, 120)
  }
}

function buildLinear5x5Plan(plan, main, oneRm, scale) {
  var lift = main.name || ''
  var isDl = /硬拉/.test(lift)
  if (isDl) {
    pushWarmups(plan, oneRm, scale, 0.85)
    var kg = roundToStep(oneRm * 0.85 * scale)
    if (kg < 20) kg = 20
    pushBlock(plan, '1x5', 1, 5, kg, 210)
    return
  }
  pushWarmups(plan, oneRm, scale, 0.8)
  var workKg = roundToStep(oneRm * 0.8 * scale)
  if (workKg < 20) workKg = 20
  pushBlock(plan, '5x5', 5, 5, workKg, 180)
}

/**
 * @param {object} main
 * @returns {MainSet[]}
 */
function buildMainSetPlan(main) {
  if (!main) return []
  var oneRm = resolveOneRm(main)
  var scale = main.loadScale != null ? Number(main.loadScale) : 1
  if (!scale || scale <= 0) scale = 1
  var scheme = main.scheme || 'norwegian'
  var dropBackoff = !!main.dropBackoff
  var week = main.currentWeek || 1

  /** @type {MainSet[]} */
  var plan = []

  if (scheme === 'light') {
    pushWarmups(plan, oneRm, scale, 0.55)
    var lightKg = roundToStep(oneRm * 0.55 * scale)
    if (lightKg < 20) lightKg = 20
    pushBlock(plan, 'work', 3, 6, lightKg, 150)
    return plan
  }

  if (scheme === 'volume') {
    pushWarmups(plan, oneRm, scale, 0.65)
    var volKg = roundToStep(oneRm * 0.65 * scale)
    if (volKg < 20) volKg = 20
    pushBlock(plan, '4x4', 4, 4, volKg, 180)
    return plan
  }

  if (scheme === '531') {
    build531Plan(plan, oneRm, scale, week, dropBackoff)
    return plan
  }

  if (scheme === 'linear5x5') {
    buildLinear5x5Plan(plan, main, oneRm, scale)
    return plan
  }

  if (scheme === 'ohp') {
    // 实力推：热身 + 主项组（默认 4×6）
    var pressKg = main.kg != null ? Number(main.kg) : roundToStep(oneRm * 0.5 * scale)
    if (pressKg < 20) pressKg = 20
    // oneRm for press approximated from working kg
    var pressOneRm = pressKg / 0.55
    pushWarmups(plan, pressOneRm, 1, 0.55)
    var sets = Math.max(3, Number(main.sets) || 4)
    var reps = Number(main.reps) || 6
    pushBlock(plan, '肩推', sets, reps, pressKg, 150)
    return plan
  }

  buildNorwegianPlan(plan, oneRm, scale, dropBackoff)
  return plan
}

function countByKind(plan, kind) {
  var n = 0
  for (var i = 0; i < (plan || []).length; i++) {
    if (plan[i].kind === kind) n++
  }
  return n
}

function rowLabel(set) {
  if (!set) return '正式组'
  if (set.kind === 'warmup' || set.block === 'warmup') return '热身组'
  // 挪威波浪：70% 容量 → 80% 强度 → 70% 回退
  if (set.block === '4x4') return '容量组'
  if (set.block === '2x2') return '强度组'
  if (set.block === '1x8') return '回退组'
  // 线性 5×5 / 肩推
  if (set.block === '5x5') return '正式组'
  if (set.block === '1x5') return '正式组'
  if (set.block === '肩推') return '正式组'
  // 5/3/1
  if (set.block === '爬坡') return '爬坡组'
  if (set.block === '顶组') return '顶峰组'
  if (set.block === '轻周') return '减量组'
  if (set.block === '回退') return '回退组'
  return '正式组'
}

/**
 * @returns {{ label: string, tone: string, kg: number, reps: number, count: number, kgText: string, repsText: string, countText: string }[]}
 */
function formatMainSetRows(main) {
  if (!main) return []
  var plan = buildMainSetPlan(main)
  if (!plan.length) return []

  var rows = []
  var i = 0
  while (i < plan.length) {
    var cur = plan[i]
    var run = 1
    while (
      i + run < plan.length &&
      plan[i + run].kind === cur.kind &&
      plan[i + run].block === cur.block &&
      plan[i + run].kg === cur.kg &&
      plan[i + run].reps === cur.reps
    ) {
      run++
    }
    var tone = 'work'
    if (cur.kind === 'warmup' || cur.block === 'warmup') tone = 'warmup'
    else if (cur.block === '2x2' || cur.block === '顶组') tone = 'peak'
    else if (cur.block === '1x8' || cur.block === '回退' || cur.block === '轻周') tone = 'backoff'
    rows.push({
      label: rowLabel(cur),
      tone: tone,
      kg: cur.kg,
      reps: cur.reps,
      count: run,
      kgText: String(cur.kg),
      repsText: String(cur.reps),
      countText: run > 1 ? String(run) : '1',
      setsText:
        run > 1
          ? run + '组 × ' + cur.reps + '次 · ' + cur.kg + ' kg'
          : '1组 × ' + cur.reps + '次 · ' + cur.kg + ' kg'
    })
    i += run
  }
  return rows
}

function formatMainSetsText(main) {
  return formatMainSetRows(main)
    .map(function (r) {
      return r.label + ' ' + r.setsText
    })
    .join('；')
}

/**
 * @returns {{ label: string, tone: string, rows: object[] }[]}
 */
function formatMainSetGroups(main) {
  var rows = formatMainSetRows(main)
  var groups = []
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]
    var last = groups[groups.length - 1]
    if (last && last.label === r.label) {
      last.rows.push(r)
    } else {
      groups.push({ label: r.label, tone: r.tone, rows: [r] })
    }
  }
  for (var g = 0; g < groups.length; g++) {
    groups[g].isLast = g === groups.length - 1
    for (var j = 0; j < groups[g].rows.length; j++) {
      groups[g].rows[j].showPhase = j === 0
      groups[g].rows[j].phase = groups[g].label
      groups[g].rows[j].tone = groups[g].tone
    }
  }
  return groups
}

/** 扁平处方表行，便于表格渲染 */
function formatMainSetSheet(main) {
  var groups = formatMainSetGroups(main)
  var sheet = []
  for (var i = 0; i < groups.length; i++) {
    for (var j = 0; j < groups[i].rows.length; j++) {
      sheet.push(groups[i].rows[j])
    }
  }
  return sheet
}

module.exports = {
  buildMainSetPlan: buildMainSetPlan,
  countByKind: countByKind,
  rowLabel: rowLabel,
  formatMainSetRows: formatMainSetRows,
  formatMainSetGroups: formatMainSetGroups,
  formatMainSetSheet: formatMainSetSheet,
  formatMainSetsText: formatMainSetsText
}
