/**
 * 训练完成度评分 + 跨日结算 + 按上周均分调整训练周难度。
 * 分数只反映完成状态（完成 / 半途 / 未练），不因组间加时扣分。
 */
const storage = require('../utils/storage')
const copy = require('../utils/copy')

function resolveWeekSlots(profile, planId) {
  // 懒加载，避免与 plan/set-cards 形成启动期循环依赖
  return require('./plan').resolveWeekSlots(profile, planId)
}

var SCORE_COMPLETED = 100
var SCORE_PARTIAL = 50
var SETTLE_LOOKBACK_DAYS = 21
var DAY_MS = 24 * 60 * 60 * 1000

var TITLE_COMPLETED = '今日已完成'
var TITLE_PARTIAL = '未完成全部'
var TITLE_MISSED = '今日未训练'
var TITLE_LEAVE = '今日请假'

function clampScore(n) {
  var x = Math.round(Number(n) || 0)
  if (x < 0) return 0
  if (x > 100) return 100
  return x
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysKey(dateKey, delta) {
  var d = new Date(dateKey + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function mondayKey(dateKey) {
  var d = new Date(dateKey + 'T12:00:00')
  var js = d.getDay()
  var offset = js === 0 ? -6 : 1 - js
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function weekdayOf(dateKey) {
  var js = new Date(dateKey + 'T12:00:00').getDay()
  return js === 0 ? 7 : js
}

function dateForWeekday(anchorKey, weekday) {
  var d = new Date(anchorKey + 'T12:00:00')
  var jsDay = d.getDay()
  var todayWd = jsDay === 0 ? 7 : jsDay
  var target = Number(weekday)
  d.setDate(d.getDate() + (target - todayWd))
  return d.toISOString().slice(0, 10)
}

/** 按分数粗分档（完成度导向；完成路径优先走 scoreCompletedSession） */
function gradeFromScore(score) {
  var s = clampScore(score)
  if (s >= 90) {
    return { score: s, title: TITLE_COMPLETED, tone: 'great' }
  }
  if (s > 0) {
    return { score: s, title: TITLE_PARTIAL, tone: 'low' }
  }
  return { score: 0, title: TITLE_MISSED, tone: 'miss' }
}

/** 完成课次：固定满分，忽略组间加时 */
function scoreCompletedSession(input) {
  var restAddCount = Math.max(0, Number(input && input.restAddCount) || 0)
  var kind = (input && input.kind) || 'strength'
  return {
    score: SCORE_COMPLETED,
    title: TITLE_COMPLETED,
    tone: 'great',
    restAddCount: restAddCount,
    kind: kind
  }
}

/** 请假与漏练同分：0。称号区分「假」与「缺」。 */
function scoreLeave() {
  return {
    kind: 'leave',
    score: 0,
    title: TITLE_LEAVE,
    tone: 'miss'
  }
}

/** 完全没练：0 分 */
function scoreMissed() {
  return {
    kind: 'missed',
    outcome: 'missed',
    score: 0,
    title: TITLE_MISSED,
    tone: 'miss'
  }
}

/**
 * 半途而废：固定 50 分 +「未完成全部」
 * @param {object} [draft]
 */
function scorePartial(draft) {
  var ratio = progressFromDraft(draft)
  return {
    kind: 'missed',
    outcome: 'partial',
    score: SCORE_PARTIAL,
    title: TITLE_PARTIAL,
    tone: 'low',
    progress: ratio
  }
}

function progressFromDraft(draft) {
  if (!draft) return 0
  if (draft.kind === 'strength' || draft.setPlan || draft.totalSets != null) {
    var done = (draft.completedSets || []).length
    var total =
      Number(draft.totalSets) ||
      (draft.setPlan && draft.setPlan.length) ||
      0
    if (total <= 0) return done > 0 ? 0.2 : 0
    return Math.max(0, Math.min(1, done / total))
  }
  var blocks = draft.blocks || []
  var totalSeg = blocks.length
  if (totalSeg <= 0) return 0
  var seg = Number(draft.segmentIndex)
  if (isNaN(seg)) seg = 0
  return Math.max(0, Math.min(1, seg / totalSeg))
}

function isOutcomeLog(log) {
  if (!log || !log.kind) return false
  return (
    log.kind === 'strength' ||
    log.kind === 'aux' ||
    log.kind === 'leave' ||
    log.kind === 'missed'
  )
}

function isCompletedLog(log) {
  return !!(log && (log.kind === 'strength' || log.kind === 'aux'))
}

function isMissedLog(log) {
  return !!(log && log.kind === 'missed')
}

function findDayLog(logs, date, weekday) {
  var wd = Number(weekday)
  for (var i = 0; i < (logs || []).length; i++) {
    var l = logs[i]
    if (!isOutcomeLog(l)) continue
    if (l.date !== date) continue
    if (Number(l.weekday) !== wd) continue
    return l
  }
  return null
}

function ensureGrade(log) {
  if (!log) return null
  if (log.kind === 'leave') {
    return {
      score: 0,
      title: TITLE_LEAVE,
      tone: 'miss'
    }
  }
  if (log.kind === 'missed') {
    if (log.outcome === 'partial') {
      return {
        score: SCORE_PARTIAL,
        title: TITLE_PARTIAL,
        tone: 'low'
      }
    }
    return scoreMissed()
  }
  if (isCompletedLog(log)) {
    return {
      score: SCORE_COMPLETED,
      title: TITLE_COMPLETED,
      tone: 'great'
    }
  }
  return gradeFromScore(log.score != null ? log.score : 0)
}

function slotMapByWeekday(slots) {
  var map = {}
  ;(slots || []).forEach(function (slot, i) {
    var wd = Number(slot && slot.weekday) || i + 1
    map[wd] = slot
  })
  return map
}

/**
 * 扫描近 N 天已过去的训练槽，无结局则写入 missed / partial。
 * 跨日草稿按完成比例结算并清草稿（不再提供跨日「继续」）。
 * @returns {number} 新结算条数
 */
function settlePastTrainingDays(profile) {
  if (!profile) return 0
  var planId = profile.planId || 'strength-hybrid-mix'
  var slots = resolveWeekSlots(profile, planId) || []
  var byWd = slotMapByWeekday(slots)
  var anchor = todayKey()
  var logs = storage.getLogs()
  var draft = storage.getDraft()
  var added = 0
  var clearDraft = false

  for (var ago = 1; ago <= SETTLE_LOOKBACK_DAYS; ago++) {
    var date = addDaysKey(anchor, -ago)
    var wd = weekdayOf(date)
    var slot = byWd[wd]
    if (!slot || slot.type === 'rest') continue
    if (findDayLog(logs, date, wd)) continue

    var hasStaleDraft =
      draft &&
      draft.date === date &&
      (draft.weekday == null ||
        draft.weekday === '' ||
        Number(draft.weekday) === wd)

    var grade = hasStaleDraft ? scorePartial(draft) : scoreMissed()
    var name = copy.slotLabel(slot.label) || slot.label || '训练'
    storage.appendLog({
      date: date,
      weekday: wd,
      kind: 'missed',
      outcome: hasStaleDraft ? 'partial' : 'missed',
      name: slot.label || name,
      score: grade.score,
      title: grade.title,
      progress: grade.progress,
      finishedAt: Date.now(),
      settledAt: Date.now()
    })
    added++
    if (hasStaleDraft) clearDraft = true
    logs = storage.getLogs()
  }

  if (clearDraft) storage.clearDraft()
  return added
}

/** 某自然周（周一 dateKey）训练日均分；无结局按 0 */
function averageWeekScore(logs, weekMonday, slots) {
  var scores = []
  for (var i = 0; i < (slots || []).length; i++) {
    var slot = slots[i]
    if (!slot || slot.type === 'rest') continue
    var wd = Number(slot.weekday) || i + 1
    var date = dateForWeekday(weekMonday, wd)
    if (date > todayKey()) continue
    var log = findDayLog(logs, date, wd)
    if (log) scores.push(ensureGrade(log).score)
    else scores.push(0)
  }
  if (!scores.length) return null
  var sum = 0
  for (var j = 0; j < scores.length; j++) sum += scores[j]
  return Math.round(sum / scores.length)
}

function decideNextWeek(avg, week, completedBlocks) {
  var w = Number(week) || 1
  var blocks = Number(completedBlocks) || 0
  if (avg >= 70) {
    if (w >= 5) {
      return { week: 1, blocks: blocks, decision: 'advance' }
    }
    if (w === 4) {
      var nb = blocks + 1
      // 每完成 2 个训练块进测力周，否则回第 1 周开新块
      if (nb % 2 === 0) {
        return { week: 5, blocks: nb, decision: 'advance' }
      }
      return { week: 1, blocks: nb, decision: 'advance' }
    }
    return { week: w + 1, blocks: blocks, decision: 'advance' }
  }
  if (avg >= 40) {
    return { week: w, blocks: blocks, decision: 'hold' }
  }
  if (w === 5) {
    return { week: 4, blocks: blocks, decision: 'ease' }
  }
  if (w > 1) {
    return { week: w - 1, blocks: blocks, decision: 'ease' }
  }
  return { week: 1, blocks: blocks, decision: 'ease' }
}

function weekQualityHintText(lq) {
  if (!lq || lq.avg == null) return ''
  var avg = lq.avg
  if (lq.decision === 'advance') {
    return '上周均分 ' + avg + ' · 难度已上调'
  }
  if (lq.decision === 'hold') {
    return '上周均分 ' + avg + ' · 本周重复相同难度'
  }
  if (lq.decision === 'ease') {
    return '上周均分 ' + avg + ' · 本周略降难度'
  }
  return ''
}

/**
 * 跨入新自然周时，按上周完成质量调整 currentWeek（处方难度）。
 * @returns {object|null} lastWeekQuality
 */
function maybeAdvanceTrainingWeek(profile) {
  if (!profile) return null
  var today = todayKey()
  var thisMonday = mondayKey(today)
  var weekStart = profile.trainingWeekStart

  if (!weekStart) {
    var nextInit = Object.assign({}, profile, {
      trainingWeekStart: thisMonday,
      currentWeek: profile.currentWeek || 1
    })
    storage.setProfile(nextInit)
    return null
  }

  if (weekStart >= thisMonday) {
    return profile.lastWeekQuality || null
  }

  var planId = profile.planId || 'strength-hybrid-mix'
  var slots = resolveWeekSlots(profile, planId) || []
  var cursor = weekStart
  var working = Object.assign({}, profile)
  var lastMeta = null
  var guard = 0

  while (cursor < thisMonday && guard < 12) {
    guard++
    // 确保该周已结算后再取均分
    settlePastTrainingDays(working)
    var logs = storage.getLogs()
    var avg = averageWeekScore(logs, cursor, slots)
    if (avg == null) avg = 0
    var decided = decideNextWeek(
      avg,
      working.currentWeek || 1,
      working.completedBlocks || 0
    )
    lastMeta = {
      avg: avg,
      decision: decided.decision,
      fromWeek: working.currentWeek || 1,
      toWeek: decided.week,
      weekStart: cursor
    }
    working.currentWeek = decided.week
    working.completedBlocks = decided.blocks
    working.lastWeekQuality = lastMeta
    var nextCursor = addDaysKey(cursor, 7)
    if (!nextCursor || nextCursor <= cursor) break
    cursor = nextCursor
  }

  working.trainingWeekStart = thisMonday
  storage.setProfile(working)
  return lastMeta
}

/** 本周各 weekday → 结局 log（按日历对齐） */
function weekOutcomeMap(logs, anchorKey) {
  var map = {}
  ;(logs || []).forEach(function (l) {
    if (!isOutcomeLog(l) || !l.date) return
    var wd = Number(l.weekday)
    if (!wd) return
    if (l.date !== dateForWeekday(anchorKey, wd)) return
    if (!map[wd]) map[wd] = l
  })
  return map
}

function isDraftStaleOver24h(draft) {
  if (!draft) return false
  var t = Number(draft.startedAt || draft.updatedAt || 0)
  if (!t) return false
  return Date.now() - t > DAY_MS
}

/** 从结局 log 解析训练秒数（完成课次才有） */
function durationSecFromLog(log) {
  if (!log) return 0
  if (log.durationSec != null && !isNaN(Number(log.durationSec))) {
    return Math.max(0, Math.round(Number(log.durationSec)))
  }
  if (log.startedAt && log.finishedAt) {
    return Math.max(
      0,
      Math.round((Number(log.finishedAt) - Number(log.startedAt)) / 1000)
    )
  }
  if (log.durationMin != null && !isNaN(Number(log.durationMin))) {
    return Math.max(0, Math.round(Number(log.durationMin) * 60))
  }
  var sets = log.sets || []
  if (sets.length) {
    var work = 0
    for (var i = 0; i < sets.length; i++) {
      work += Number(sets[i].durationSec) || 0
    }
    if (work > 0) return work
  }
  return 0
}

/**
 * 分项用时列表（展开用）
 * @returns {{ title: string, timeText: string, durationSec: number }[]}
 */
function durationItemsFromLog(log) {
  var { formatMmSs } = require('../utils/format')
  var rows = (log && (log.sets || log.segments)) || []
  if (!rows.length) return []
  var countByKey = {}
  var items = []
  for (var i = 0; i < rows.length; i++) {
    var s = rows[i] || {}
    var move = s.moveName || s.name || ''
    var label =
      s.label ||
      (s.kind === 'warmup' ? '热身' : s.kind === 'accessory' ? '辅项' : s.kind === 'work' ? '工作' : '')
    var base = move && label && move !== label ? move + ' · ' + label : move || label || s.block || '组'
    var key = String(base)
    countByKey[key] = (countByKey[key] || 0) + 1
    var sec = Math.max(0, Math.round(Number(s.durationSec) || 0))
    items.push({
      title: base + ' ' + countByKey[key],
      timeText: formatMmSs(sec),
      durationSec: sec
    })
  }
  return items
}

module.exports = {
  gradeFromScore: gradeFromScore,
  scoreCompletedSession: scoreCompletedSession,
  scoreLeave: scoreLeave,
  scoreMissed: scoreMissed,
  scorePartial: scorePartial,
  progressFromDraft: progressFromDraft,
  isOutcomeLog: isOutcomeLog,
  isCompletedLog: isCompletedLog,
  isMissedLog: isMissedLog,
  findDayLog: findDayLog,
  ensureGrade: ensureGrade,
  settlePastTrainingDays: settlePastTrainingDays,
  maybeAdvanceTrainingWeek: maybeAdvanceTrainingWeek,
  weekQualityHintText: weekQualityHintText,
  weekOutcomeMap: weekOutcomeMap,
  dateForWeekday: dateForWeekday,
  todayKey: todayKey,
  mondayKey: mondayKey,
  addDaysKey: addDaysKey,
  weekdayOf: weekdayOf,
  isDraftStaleOver24h: isDraftStaleOver24h,
  averageWeekScore: averageWeekScore,
  durationSecFromLog: durationSecFromLog,
  durationItemsFromLog: durationItemsFromLog
}
