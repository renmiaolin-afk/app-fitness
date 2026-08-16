/**
 * 单周期（约 4 周训练 + 1 周测力）三大项合计增幅。
 *
 * 1) 相对增幅随训练水平下降（新手 > 中级 > 较强）
 * 2) 新手有绝对下限：按加片推进，不能只按轻 1RM 的百分比
 * 3) 卧推绝对公斤通常低于深蹲/硬拉
 * 4) 年龄、加练、睡眠、身体负担会下调；文案标明「估算 / 三大项合计」
 */

const { roundToStep } = require('../utils/format')
const { ageGainFactor, inferStrengthTier } = require('./strength-level')

/** 单周期相对现 1RM 的期望中枢 */
const TIER_RATE = {
  beginner: { squat: 0.05, bench: 0.04, deadlift: 0.05 },
  intermediate: { squat: 0.015, bench: 0.012, deadlift: 0.015 },
  advanced: { squat: 0.008, bench: 0.006, deadlift: 0.008 }
}

/** 单周期单动作上限，避免大重量被百分比吹大 */
const TIER_CAP = {
  beginner: { squat: 12.5, bench: 7.5, deadlift: 12.5 },
  intermediate: { squat: 5, bench: 2.5, deadlift: 5 },
  advanced: { squat: 2.5, bench: 2.5, deadlift: 2.5 }
}

/** 新手按加片走，轻重量时百分比会小到不合理 */
const TIER_FLOOR = {
  beginner: { squat: 5, bench: 2.5, deadlift: 5 },
  intermediate: { squat: 2.5, bench: 0, deadlift: 2.5 },
  advanced: { squat: 0, bench: 0, deadlift: 0 }
}

function tierOf(profile) {
  if (profile && profile.strengthTier) return profile.strengthTier
  return inferStrengthTier(profile || {})
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

  var planId = require('./plan').normalizePlanId((profile && profile.planId) || '')
  if (planId === 'strength-lean') m *= 0.85
  if (planId === 'strength-basic') m *= 1.12
  if (planId === 'strength-split') m *= 1.04
  if (planId === 'strength-frequent') m *= 1.08

  return Math.max(0.5, Math.min(1.2, m))
}

function liftRaw(oneRm, lift, tier, mod) {
  var base = Number(oneRm && oneRm[lift]) || 0
  if (base <= 0) return 0
  var rate = (TIER_RATE[tier] || TIER_RATE.intermediate)[lift]
  var cap = (TIER_CAP[tier] || TIER_CAP.intermediate)[lift]
  var floor = ((TIER_FLOOR[tier] || TIER_FLOOR.intermediate)[lift]) || 0
  var raw = base * rate * mod
  var minGain = floor * Math.max(0.7, Math.min(1, mod))
  if (raw < minGain) raw = minGain
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
  var disclaimer = '大概估算：三大项合计，按你的水平、年龄和恢复推的，不是承诺'
  if (!has1rm) {
    summary = '填好三大项大概重量后，再估算这周期能涨多少'
    headline = '待估算'
    low = 0
    high = 0
    mid = 0
    disclaimer = ''
  } else if (low === high) {
    headline = '这周期三大项合计大概能涨 +' + high + ' kg'
    summary = headline
  } else {
    headline = '这周期三大项合计大概能涨 +' + low + '–' + high + ' kg'
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
  TIER_CAP: TIER_CAP,
  TIER_FLOOR: TIER_FLOOR
}
