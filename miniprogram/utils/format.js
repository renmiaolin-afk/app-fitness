function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatMmSs(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m + ':' + pad(r)
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

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

module.exports = {
  pad: pad,
  formatMmSs: formatMmSs,
  roundToStep: roundToStep,
  weekdayIndex: weekdayIndex,
  WEEKDAY_LABELS: WEEKDAY_LABELS
}
