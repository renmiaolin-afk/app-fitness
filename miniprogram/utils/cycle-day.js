/**
 * 训练微周期：建档日 = 计划第 1 天，之后按日顺延。
 * 周历展示仍是自然周周一到周日；建档日之前的日子不排课。
 */
var DAY_MS = 24 * 60 * 60 * 1000
var WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysKey(dateKey, delta) {
  var d = new Date(dateKey + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function daysBetweenKeys(startKey, dateKey) {
  var a = new Date(startKey + 'T12:00:00').getTime()
  var b = new Date(dateKey + 'T12:00:00').getTime()
  return Math.round((b - a) / DAY_MS)
}

function weekdayOf(dateKey) {
  var js = new Date(dateKey + 'T12:00:00').getDay()
  return js === 0 ? 7 : js
}

/** 含 dateKey 的自然周周一 */
function mondayKey(dateKey) {
  var d = new Date((dateKey || todayKey()) + 'T12:00:00')
  var js = d.getDay()
  var offset = js === 0 ? -6 : 1 - js
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/** 建档日起点；旧档案回退 onboardedAt / trainingWeekStart */
function cycleStartKey(profile) {
  if (profile && profile.cycleStartDate) return String(profile.cycleStartDate).slice(0, 10)
  if (profile && profile.onboardedAt != null && profile.onboardedAt !== '') {
    var d = new Date(Number(profile.onboardedAt) || profile.onboardedAt)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  if (profile && profile.trainingWeekStart) {
    return String(profile.trainingWeekStart).slice(0, 10)
  }
  return todayKey()
}

/** 周期第几天 1..7 */
function cycleDayOf(profile, dateKey) {
  var start = cycleStartKey(profile)
  var diff = daysBetweenKeys(start, dateKey || todayKey())
  var mod = ((diff % 7) + 7) % 7
  return mod + 1
}

/** 0-based 槽位下标 */
function cycleDayIndex(profile, dateKey) {
  return cycleDayOf(profile, dateKey) - 1
}

/** 包含 dateKey 的那一周的第 1 天（= cycleStart + 7k），用于处方周推进 */
function cycleWeekStartKey(profile, dateKey) {
  var start = cycleStartKey(profile)
  var key = dateKey || todayKey()
  var diff = daysBetweenKeys(start, key)
  if (diff < 0) return start
  return addDaysKey(start, Math.floor(diff / 7) * 7)
}

/** 微周期 weekStart 上的第 weekday（1..7）对应日历日 */
function dateForCycleDay(weekStartKey, weekday) {
  var wd = Number(weekday) || 1
  if (wd < 1) wd = 1
  if (wd > 7) wd = 7
  return addDaysKey(weekStartKey, wd - 1)
}

/** 自然周周一 + 星期（1=Mon） */
function dateForCalendarWeekday(weekMonday, weekday) {
  return dateForCycleDay(weekMonday, weekday)
}

/** 处方第几周（建档日起每 7 天） */
function programWeekOf(profile, dateKey) {
  var start = cycleStartKey(profile)
  var diff = daysBetweenKeys(start, dateKey || todayKey())
  if (diff < 0) return 1
  return Math.floor(diff / 7) + 1
}

function isBeforeStart(profile, dateKey) {
  return String(dateKey || '') < cycleStartKey(profile)
}

function dayLabelForDate(dateKey) {
  return WEEKDAY_LABELS[weekdayOf(dateKey) - 1] || ''
}

/**
 * 确保档案有 cycleStartDate；首次写入时对齐 trainingWeekStart，并重算历史 log 的周期日。
 * @returns {object} 可能已写回 storage 的 profile
 */
function ensureCycleAnchors(profile, storage) {
  if (!profile) return profile
  if (profile.cycleStartDate) {
    if (profile.trainingWeekStart) return profile
    var weekOnly = Object.assign({}, profile, {
      trainingWeekStart: cycleWeekStartKey(profile, todayKey())
    })
    if (storage && typeof storage.setProfile === 'function') {
      storage.setProfile(weekOnly)
    }
    return weekOnly
  }
  var start = cycleStartKey(profile)
  var anchored = Object.assign({}, profile, { cycleStartDate: start })
  var next = Object.assign({}, anchored, {
    trainingWeekStart: cycleWeekStartKey(anchored, todayKey())
  })
  if (storage && typeof storage.setProfile === 'function') {
    storage.setProfile(next)
  }
  if (storage && typeof storage.getLogs === 'function' && typeof storage.setLogs === 'function') {
    var logs = storage.getLogs() || []
    var changed = false
    var remapped = logs.map(function (l) {
      if (!l || !l.date) return l
      var wd = cycleDayOf(next, l.date)
      if (Number(l.weekday) === wd) return l
      changed = true
      return Object.assign({}, l, { weekday: wd })
    })
    if (changed) storage.setLogs(remapped)
  }
  return next
}

module.exports = {
  todayKey: todayKey,
  addDaysKey: addDaysKey,
  daysBetweenKeys: daysBetweenKeys,
  weekdayOf: weekdayOf,
  mondayKey: mondayKey,
  cycleStartKey: cycleStartKey,
  cycleDayOf: cycleDayOf,
  cycleDayIndex: cycleDayIndex,
  cycleWeekStartKey: cycleWeekStartKey,
  dateForCycleDay: dateForCycleDay,
  dateForCalendarWeekday: dateForCalendarWeekday,
  programWeekOf: programWeekOf,
  isBeforeStart: isBeforeStart,
  dayLabelForDate: dayLabelForDate,
  ensureCycleAnchors: ensureCycleAnchors,
  WEEKDAY_LABELS: WEEKDAY_LABELS
}
