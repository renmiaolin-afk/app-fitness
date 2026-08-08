/**
 * 单周期（约 4 周训练 + 1 周测力）三大项增幅目标。
 *
 * 依据（工程可用的保守模型，非个体生理承诺）：
 * 1) 相对增幅随训练水平下降（新手 > 进阶 > 较强）
 * 2) 卧推绝对公斤通常低于深蹲/硬拉
 * 3) 年龄、双高强度辅助 / 睡眠差 / 身体负担会下调预期
 * 4) 输出为区间，文案标明「估算」
 *
 * 量级参考业余力量训练短中周期常见相对增幅与教练经验，
 * 再按本产品「力量优先、辅助不抢恢复」做折减。
 */

const { roundToStep } = require('../utils/format')
const { ageGainFactor } = require('./strength-level')

/** 单周期相对现 1RM 的期望中枢（小数） */
const TIER_RATE = {
  beginner: { squat: 0.03, bench: 0.025, deadlift: 0.03 },
  intermediate: { squat: 0.015, bench: 0.012, deadlift: 0.015 },
  advanced: { squat: 0.008, bench: 0.006, deadlift: 0.008 }
}

/** 单周期单动作绝对上限（kg），避免大重量用户被百分比吹大 */
const TIER_CAP = {
  beginner: { squat: 10, bench: 5, deadlift: 10 },
  intermediate: { squat: 5, bench: 2.5, deadlift: 5 },
  advanced: { squat: 2.5, bench: 2.5, deadlift: 2.5 }
}

function tierOf(profile) {
  return (profile && profile.strengthTier) || 'intermediate'
}

function modifier(profile) {
  var m = 1
  m *= ageGainFactor(profile && profile.ageYears)

  var aux = (profile && profile.auxiliaries) || []
  var high = 0
  for (var i = 0; i < aux.length; i++) {
    if (aux[i] === 'crossfit' || aux[i] === 'hyrox' || aux[i] === 'athx') high++
  }
  if (high >= 2) m *= 0.85
  else if (high === 1) m *= 0.92

  var habits = (profile && profile.habits) || {}
  if (habits.sleep === 'poor') m *= 0.85
  else if (habits.sleep === 'ok') m *= 0.95
  if (habits.body === 'sore') m *= 0.9
  else if (habits.body === 'old') m *= 0.95

  var planId = (profile && profile.planId) || ''
  if (planId === 'strength-time-efficient') m *= 0.9
  if (planId === 'strength-linear') m *= 1.05

  return Math.max(0.5, Math.min(1.15, m))
}

function liftRaw(oneRm, lift, tier, mod) {
  var base = Number(oneRm && oneRm[lift]) || 0
  if (base <= 0) return 0
  var rate = (TIER_RATE[tier] || TIER_RATE.intermediate)[lift]
  var cap = (TIER_CAP[tier] || TIER_CAP.intermediate)[lift]
  var raw = base * rate * mod
  if (raw > cap) raw = cap
  if (raw < 0) raw = 0
  return raw
}

function estimateBlockGain(profile) {
  var tier = tierOf(profile)
  var mod = modifier(profile)
  var oneRm = (profile && profile.oneRm) || {}
  var raws = {
    squat: liftRaw(oneRm, 'squat', tier, mod),
    bench: liftRaw(oneRm, 'bench', tier, mod),
    deadlift: liftRaw(oneRm, 'deadlift', tier, mod)
  }
  var lifts = {
    squat: roundToStep(raws.squat, 2.5),
    bench: roundToStep(raws.bench, 2.5),
    deadlift: roundToStep(raws.deadlift, 2.5)
  }
  var midRaw = raws.squat + raws.bench + raws.deadlift
  var mid = roundToStep(midRaw, 2.5)
  var low = roundToStep(midRaw * 0.6, 2.5)
  var high = roundToStep(midRaw * 1.25, 2.5)
  if (midRaw > 0 && midRaw < 2.5) {
    low = 0
    high = 2.5
    mid = 2.5
  }
  if (midRaw >= 2.5 && high < 2.5) high = 2.5
  if (high < low) high = low
  if (mid > high) mid = high

  var has1rm =
    (Number(oneRm.squat) || 0) + (Number(oneRm.bench) || 0) + (Number(oneRm.deadlift) || 0) > 0
  var summary = ''
  var headline = ''
  var disclaimer = '估算值：按相对力量、年龄与恢复情况推算，非承诺'
  if (!has1rm) {
    summary = '录入三大项 1RM 后可估算本周期增幅'
    headline = '待估算'
    low = 0
    high = 0
    mid = 0
    disclaimer = ''
  } else if (low === high) {
    headline = '估算合计约 +' + high + ' kg'
    summary = headline
  } else {
    headline = '估算合计约 +' + low + '–' + high + ' kg'
    summary = headline
  }

  return {
    tier: tier,
    modifier: mod,
    lifts: lifts,
    mid: mid,
    low: low,
    high: high,
    headline: headline,
    summary: summary,
    disclaimer: disclaimer
  }
}

module.exports = {
  estimateBlockGain: estimateBlockGain,
  TIER_RATE: TIER_RATE,
  TIER_CAP: TIER_CAP
}
