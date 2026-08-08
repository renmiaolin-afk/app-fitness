/**
 * 训练计时环：线性进度 + 品牌红
 */

var BRAND = '#ff2d55'
var BRAND_DIM = 'rgba(255, 45, 85, 0.4)'
var BRAND_SOFT = 'rgba(255, 45, 85, 0.55)'

function clamp01(t) {
  var x = Number(t) || 0
  if (x < 0) return 0
  if (x > 1) return 1
  return x
}

function brandPalette(progress, paused) {
  var t = clamp01(progress)
  if (paused) {
    return {
      ringColor: BRAND_DIM,
      glowTint: BRAND,
      glowIntensity: 0.4,
      timerHot: false
    }
  }
  return {
    ringColor: BRAND,
    glowTint: BRAND,
    glowIntensity: 0.48 + t * 0.52,
    timerHot: t >= 0.7
  }
}

function colorAtProgress(progress, paused) {
  return brandPalette(progress, paused).ringColor
}

/**
 * 倒计时环：剩余比例映射进度弧（满→空）
 */
function countdownRing(leftMs, totalMs, paused) {
  var total = Math.max(1, Number(totalMs) || 1)
  var left = Math.max(0, Number(leftMs) || 0)
  if (left > total) left = total
  var remainRatio = left / total
  var spent = 1 - remainRatio
  var pct = Math.round(remainRatio * 1000) / 10
  var pal = brandPalette(spent, paused)
  return {
    ringPct: pct,
    ringColor: pal.ringColor,
    glowTint: pal.glowTint,
    glowIntensity: pal.glowIntensity,
    timerHot: pal.timerHot
  }
}

/**
 * 正计时环：已用时间填满
 */
function countupRing(elapsedMs, totalMs, paused) {
  var total = Math.max(1, Number(totalMs) || 1)
  var elapsed = Math.max(0, Number(elapsedMs) || 0)
  var ratio = clamp01(elapsed / total)
  var pct = Math.round(ratio * 1000) / 10
  var pal = brandPalette(ratio, paused)
  return {
    ringPct: pct,
    ringColor: pal.ringColor,
    glowTint: pal.glowTint,
    glowIntensity: pal.glowIntensity,
    timerHot: pal.timerHot
  }
}

function idleRing() {
  return {
    ringPct: 100,
    ringColor: BRAND_SOFT,
    glowTint: BRAND,
    glowIntensity: 0.55,
    timerHot: false
  }
}

var TICK_MS = 50

module.exports = {
  countdownRing: countdownRing,
  countupRing: countupRing,
  idleRing: idleRing,
  colorAtProgress: colorAtProgress,
  TICK_MS: TICK_MS
}
