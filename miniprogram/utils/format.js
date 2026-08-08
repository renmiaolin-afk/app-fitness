function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatMmSs(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m + ':' + pad(r)
}

/**
 * 完成本组/段最短作业时长（防秒点作弊）
 * 短段约 40%；长段约 30% 且不少于 30 秒
 */
function minWorkUnlockSec(plannedSec) {
  var p = Math.max(0, Math.round(Number(plannedSec) || 0))
  if (p <= 0) return 20
  if (p <= 60) return Math.max(15, Math.floor(p * 0.4))
  var n = Math.round(p * 0.3)
  if (n < 30) n = 30
  if (n > p - 10) n = Math.max(20, p - 10)
  return n
}

/** 训练总时长文案（不展示秒）：不足 1 分钟 / 42 分钟 / 1 小时 5 分 */
function formatDurationHuman(totalSec) {
  var s = Math.max(0, Math.floor(Number(totalSec) || 0))
  if (s < 60) return '不足 1 分钟'
  var h = Math.floor(s / 3600)
  var m = Math.round((s % 3600) / 60)
  if (h > 0) {
    if (m >= 60) {
      h += 1
      m = 0
    }
    var out = h + ' 小时'
    if (m > 0) out += ' ' + m + ' 分'
    return out
  }
  if (m < 1) m = 1
  return m + ' 分钟'
}

function roundToStep(kg, step) {
  const st = step || 2.5
  return Math.round(kg / st) * st
}

function weekdayIndex(date) {
  const d = date || new Date()
  const js = d.getDay()
  return js === 0 ? 7 : js
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

module.exports = {
  pad: pad,
  formatMmSs: formatMmSs,
  minWorkUnlockSec: minWorkUnlockSec,
  formatDurationHuman: formatDurationHuman,
  roundToStep: roundToStep,
  weekdayIndex: weekdayIndex,
  WEEKDAY_LABELS: WEEKDAY_LABELS
}
