/**
 * 能力分档：按体重相对力量（1RM / 体重），并区分性别；年龄用于轻度校正。
 *
 * 阈值量级参考业余力量标准常用分界（Strength Level / 教练经验中的
 * novice–intermediate–advanced 相对倍数），再取三大项均值，避免单动作失真。
 * 这是工程可用的保守启发式，不是个体检测或竞赛分级。
 */

/** 男：三大项相对体重均值分界（×BW） */
const MALE_MEAN = { beginnerMax: 1.1, intermediateMax: 1.65 }

/** 女：同口径略下调（常见标准里同等标签的相对倍数更低） */
const FEMALE_MEAN = { beginnerMax: 1.0, intermediateMax: 1.35 }

/**
 * 单动作相对倍数参考（仅用于说明/调试，分档以三均值为主）
 * male: squat/bench/dl at intermediate≈
 */
const LIFT_BW = {
  male: {
    beginner: { squat: 1.0, bench: 0.75, deadlift: 1.25 },
    intermediate: { squat: 1.5, bench: 1.1, deadlift: 1.75 },
    advanced: { squat: 2.0, bench: 1.5, deadlift: 2.25 }
  },
  female: {
    beginner: { squat: 0.75, bench: 0.5, deadlift: 1.0 },
    intermediate: { squat: 1.15, bench: 0.75, deadlift: 1.4 },
    advanced: { squat: 1.5, bench: 1.0, deadlift: 1.75 }
  }
}

function sexKey(profile) {
  return profile && profile.gender === 'female' ? 'female' : 'male'
}

function bodyweightKg(profile) {
  var w = Number(profile && profile.weightKg) || 0
  if (w < 35) w = 70
  if (w > 250) w = 250
  return w
}

function relativeLifts(profile) {
  var bw = bodyweightKg(profile)
  var oneRm = (profile && profile.oneRm) || {}
  return {
    squat: (Number(oneRm.squat) || 0) / bw,
    bench: (Number(oneRm.bench) || 0) / bw,
    deadlift: (Number(oneRm.deadlift) || 0) / bw,
    bw: bw
  }
}

/** 年龄对「同等相对力量」分档：40+ 略上调有效均值（同公斤数对年长者更难得） */
function ageClassFactor(ageYears) {
  var age = Number(ageYears) || 28
  if (age >= 55) return 1.12
  if (age >= 45) return 1.08
  if (age >= 35) return 1.04
  return 1
}

/**
 * 增幅预期年龄系数：年轻恢复/适应通常更好；masters 更保守
 * （与分档校正方向不同：分档认能力，增幅认恢复）
 */
function ageGainFactor(ageYears) {
  var age = Number(ageYears) || 28
  if (age < 22) return 1.06
  if (age < 35) return 1
  if (age < 45) return 0.92
  if (age < 55) return 0.85
  return 0.78
}

function meanRelative(rel) {
  var n = 0
  var sum = 0
  ;['squat', 'bench', 'deadlift'].forEach(function (k) {
    if (rel[k] > 0) {
      sum += rel[k]
      n++
    }
  })
  if (!n) return 0
  return sum / n
}

/**
 * @returns {'beginner'|'intermediate'|'advanced'}
 */
function inferStrengthTier(profileOrOneRm, maybeProfile) {
  // 兼容旧调用 inferStrengthTier(oneRm)
  var profile = profileOrOneRm
  if (profileOrOneRm && (profileOrOneRm.squat != null || profileOrOneRm.bench != null) && !profileOrOneRm.oneRm) {
    if (!maybeProfile || !maybeProfile.weightKg) {
      // 无体重时回退绝对深蹲阈值（旧逻辑）
      var squat = Number(profileOrOneRm.squat) || 0
      if (squat < 120) return 'beginner'
      if (squat < 160) return 'intermediate'
      return 'advanced'
    }
    profile = Object.assign({}, maybeProfile, { oneRm: profileOrOneRm })
  }

  var rel = relativeLifts(profile)
  var mean = meanRelative(rel)
  if (mean <= 0) {
    var sq = Number((profile.oneRm || {}).squat) || 0
    if (sq < 120) return 'beginner'
    if (sq < 160) return 'intermediate'
    return 'advanced'
  }

  var effective = mean * ageClassFactor(profile.ageYears)
  var cuts = sexKey(profile) === 'female' ? FEMALE_MEAN : MALE_MEAN
  if (effective < cuts.beginnerMax) return 'beginner'
  if (effective < cuts.intermediateMax) return 'intermediate'
  return 'advanced'
}

function describeTier(profile) {
  var tier = inferStrengthTier(profile)
  var rel = relativeLifts(profile)
  var mean = meanRelative(rel)
  return {
    tier: tier,
    meanBw: Math.round(mean * 100) / 100,
    relative: rel,
    sex: sexKey(profile)
  }
}

module.exports = {
  inferStrengthTier: inferStrengthTier,
  describeTier: describeTier,
  ageGainFactor: ageGainFactor,
  relativeLifts: relativeLifts,
  LIFT_BW: LIFT_BW,
  MALE_MEAN: MALE_MEAN,
  FEMALE_MEAN: FEMALE_MEAN
}
