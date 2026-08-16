/**
 * 训练完成度评分 + 跨日结算 + 按上周均分调整训练周难度。
 * 分数只反映完成状态（完成 / 半途 / 未练），不因组间加时扣分。
 * 计划从建档日起算第 1 天；周历按自然周周一到周日展示，建档日前不排课。
 */
const storage = require('../utils/storage')
const copy = require('../utils/copy')
const cycleDay = require('../utils/cycle-day')

function resolveWeekSlots(profile, planId) {
  // 懒加载，避免与 plan/set-cards 形成启动期循环依赖
  return require('./plan').resolveWeekSlots(profile, planId)
}

var SCORE_COMPLETED = 100
var SCORE_PARTIAL = 50
var SETTLE_LOOKBACK_DAYS = 21
var DAY_MS = 24 * 60 * 60 * 1000

var TITLE_COMPLETED = '练完了'
var TITLE_PARTIAL = '练了一半'
var TITLE_MISSED = '今天没练'
var TITLE_LEAVE = '今天请假了'

function clampScore(n) {
  var x = Math.round(Number(n) || 0)
  if (x < 0) return 0
  if (x > 100) return 100
  return x
}

function todayKey() {
  return cycleDay.todayKey()
}

function addDaysKey(dateKey, delta) {
  return cycleDay.addDaysKey(dateKey, delta)
}

function mondayKey(dateKey) {
  return cycleDay.mondayKey(dateKey)
}

function weekdayOf(dateKey) {
  return cycleDay.weekdayOf(dateKey)
}

/** 自然周内星期几（1=Mon）对应的日期 */
function dateForWeekday(anchorKey, weekday) {
  return cycleDay.dateForCalendarWeekday(mondayKey(anchorKey), weekday)
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
  var byDate = null
  for (var i = 0; i < (logs || []).length; i++) {
    var l = logs[i]
    if (!isOutcomeLog(l)) continue
    if (l.date !== date) continue
    if (!byDate) byDate = l
    if (wd && Number(l.weekday) === wd) return l
  }
  return byDate
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

/** 漏练结算起点：建档当天；无 onboardedAt 的旧档案不截断 */
function settleEarliestDate(profile) {
  if (!profile || profile.onboardedAt == null || profile.onboardedAt === '') {
    return null
  }
  var d = new Date(Number(profile.onboardedAt) || profile.onboardedAt)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

/** 清掉建档前被误标的漏练（用户尚未使用产品的日子） */
function prunePreOnboardMissed(profile) {
  var earliest = settleEarliestDate(profile)
  if (!earliest) return 0
  var logs = storage.getLogs()
  var next = logs.filter(function (l) {
    if (!l || l.kind !== 'missed' || !l.date) return true
    return l.date >= earliest
  })
  var removed = logs.length - next.length
  if (removed > 0) storage.setLogs(next)
  return removed
}

/**
 * 扫描近 N 天已过去的训练槽，无结局则写入 missed / partial。
 * 跨日草稿按完成比例结算并清草稿（不再提供跨日「继续」）。
 * 建档前的日子不记漏练。槽位按微周期第几天对齐。
 * @returns {number} 新结算条数
 */
function settlePastTrainingDays(profile) {
  if (!profile) return 0
  profile = cycleDay.ensureCycleAnchors(profile, storage)
  prunePreOnboardMissed(profile)
  var planId = require('./plan').normalizePlanId(profile.planId)
  var slots = resolveWeekSlots(profile, planId) || []
  var byWd = slotMapByWeekday(slots)
  var anchor = todayKey()
  var earliest = settleEarliestDate(profile)
  var logs = storage.getLogs()
  var draft = storage.getDraft()
  var added = 0
  var clearDraft = false

  for (var ago = 1; ago <= SETTLE_LOOKBACK_DAYS; ago++) {
    var date = addDaysKey(anchor, -ago)
    if (earliest && date < earliest) continue
    var wd = cycleDay.cycleDayOf(profile, date)
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

/** 某微周期周（周起点 dateKey）训练日均分；无结局按 0；建档前不计入 */
function averageWeekScore(logs, weekStart, slots, earliestDate) {
  var scores = []
  for (var i = 0; i < (slots || []).length; i++) {
    var slot = slots[i]
    if (!slot || slot.type === 'rest') continue
    var wd = Number(slot.weekday) || i + 1
    var date = cycleDay.dateForCycleDay(weekStart, wd)
    if (date > todayKey()) continue
    if (earliestDate && date < earliestDate) continue
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
    return '上周平均 ' + avg + ' 分 · 这周难度上调了一点'
  }
  if (lq.decision === 'hold') {
    return '上周平均 ' + avg + ' 分 · 这周先按同样难度练'
  }
  if (lq.decision === 'ease') {
    return '上周平均 ' + avg + ' 分 · 这周稍微放轻松一点'
  }
  return ''
}

/**
 * 跨入新微周期周时，按上周完成质量调整 currentWeek（处方难度）。
 * @returns {object|null} lastWeekQuality
 */
function maybeAdvanceTrainingWeek(profile) {
  if (!profile) return null
  profile = cycleDay.ensureCycleAnchors(profile, storage)
  var today = todayKey()
  var thisWeekStart = cycleDay.cycleWeekStartKey(profile, today)
  var weekStart = profile.trainingWeekStart

  if (!weekStart) {
    var nextInit = Object.assign({}, profile, {
      trainingWeekStart: thisWeekStart,
      currentWeek: profile.currentWeek || 1
    })
    storage.setProfile(nextInit)
    return null
  }

  if (weekStart >= thisWeekStart) {
    return profile.lastWeekQuality || null
  }

  var planId = require('./plan').normalizePlanId(profile.planId)
  var slots = resolveWeekSlots(profile, planId) || []
  var cursor = weekStart
  var working = Object.assign({}, profile)
  var lastMeta = null
  var guard = 0

  while (cursor < thisWeekStart && guard < 12) {
    guard++
    // 确保该周已结算后再取均分
    settlePastTrainingDays(working)
    var logs = storage.getLogs()
    var avg = averageWeekScore(
      logs,
      cursor,
      slots,
      settleEarliestDate(working)
    )
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

  working.trainingWeekStart = thisWeekStart
  storage.setProfile(working)
  return lastMeta
}

/** 本自然周各日历星期（1=Mon）→ 结局 log */
function weekOutcomeMap(logs, anchorKey) {
  var map = {}
  var monday = mondayKey(anchorKey)
  var sunday = addDaysKey(monday, 6)
  ;(logs || []).forEach(function (l) {
    if (!isOutcomeLog(l) || !l.date) return
    if (l.date < monday || l.date > sunday) return
    var calWd = weekdayOf(l.date)
    if (!map[calWd]) map[calWd] = l
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
      (s.kind === 'warmup' ? '热身' : s.kind === 'accessory' ? '辅助' : s.kind === 'work' ? '正式' : '')
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
  cycleDayOf: cycleDay.cycleDayOf,
  cycleDayIndex: cycleDay.cycleDayIndex,
  cycleWeekStartKey: cycleDay.cycleWeekStartKey,
  cycleStartKey: cycleDay.cycleStartKey,
  ensureCycleAnchors: cycleDay.ensureCycleAnchors,
  isDraftStaleOver24h: isDraftStaleOver24h,
  averageWeekScore: averageWeekScore,
  durationSecFromLog: durationSecFromLog,
  durationItemsFromLog: durationItemsFromLog
}
