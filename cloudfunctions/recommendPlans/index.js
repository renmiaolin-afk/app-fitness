/**
 * 云函数：根据建档档案个性化推荐训练计划
 * 部署：开发者工具 → 云开发 → 云函数 → 右键 recommendPlans → 上传并部署
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/** 与 plans/scheduling/week-slots.json 的 name/meta 保持一致 */
const CATALOG = [
  {
    id: 'strength-hybrid-mix',
    name: '挪威力训计划',
    meta: '12周 · 4×4/2×2/1×8 + 每周肩推专项；硬拉重/轻双日',
    problem: '挪威课内波浪：70% 4×4 → 80% 2×2 → 70% 1×8；另有肩推日补肩背。',
    goal: '恢复好、能练满的中高级首选。'
  },
  {
    id: 'strength-linear',
    name: '线性 5×5 计划',
    meta: '12周 · 蹲卧5×5、硬拉1×5 + 每周肩推专项',
    problem: '死组 5×5（硬拉 1×5）+ 肩推日——新手到早中级最稳。',
    goal: '结构简单，连续加重更可控。'
  },
  {
    id: 'strength-time-efficient',
    name: '5/3/1 力量计划',
    meta: '12周 · 5/3/1 顶组周循环 + 每周肩推专项',
    problem: '温德勒 5/3/1 + 肩推日：三力各一天，时间紧也能长期涨。',
    goal: '省时、护恢复，适合持续练下去。'
  }
]

const TIER_RATE = {
  beginner: { squat: 0.03, bench: 0.025, deadlift: 0.03 },
  intermediate: { squat: 0.015, bench: 0.012, deadlift: 0.015 },
  advanced: { squat: 0.008, bench: 0.006, deadlift: 0.008 }
}

const TIER_CAP = {
  beginner: { squat: 10, bench: 5, deadlift: 10 },
  intermediate: { squat: 5, bench: 2.5, deadlift: 5 },
  advanced: { squat: 2.5, bench: 2.5, deadlift: 2.5 }
}

function ageGainFactor(ageYears) {
  var age = Number(ageYears) || 28
  if (age < 22) return 1.06
  if (age < 35) return 1
  if (age < 45) return 0.92
  if (age < 55) return 0.85
  return 0.78
}

function roundToStep(n, step) {
  if (!step) return Math.round(n)
  return Math.round(n / step) * step
}

function estimateOutcome(profile, planId) {
  var tier = (profile && profile.strengthTier) || 'intermediate'
  var oneRm = (profile && profile.oneRm) || {}
  var m = ageGainFactor(profile && profile.ageYears)
  var aux = (profile && profile.auxiliaries) || []
  var high = 0
  for (var i = 0; i < aux.length; i++) {
    if (aux[i] === 'crossfit' || aux[i] === 'hyrox') high++
  }
  if (high >= 2) m *= 0.85
  else if (high === 1) m *= 0.92
  var habits = (profile && profile.habits) || {}
  if (habits.sleep === 'poor') m *= 0.85
  else if (habits.sleep === 'ok') m *= 0.95
  if (habits.body === 'sore') m *= 0.9
  else if (habits.body === 'old') m *= 0.95
  if (planId === 'strength-time-efficient') m *= 0.9
  if (planId === 'strength-linear') m *= 1.05
  m = Math.max(0.5, Math.min(1.15, m))

  var rates = TIER_RATE[tier] || TIER_RATE.intermediate
  var caps = TIER_CAP[tier] || TIER_CAP.intermediate
  var midRaw = 0
  ;['squat', 'bench', 'deadlift'].forEach(function (lift) {
    var base = Number(oneRm[lift]) || 0
    if (base <= 0) return
    var raw = base * rates[lift] * m
    if (raw > caps[lift]) raw = caps[lift]
    midRaw += raw
  })
  if (midRaw <= 0) return '录入三大项 1RM 后可估算本周期增幅'
  var low = roundToStep(midRaw * 0.6, 2.5)
  var high = roundToStep(midRaw * 1.25, 2.5)
  if (high < 2.5) high = 2.5
  if (high < low) high = low
  if (low === high) return '估算合计约 +' + high + ' kg'
  return '估算合计约 +' + low + '–' + high + ' kg'
}

function scorePlan(planId, profile) {
  var score = 40
  var reasons = []
  var habits = (profile && profile.habits) || {}
  var duration = Number(habits.durationMin) || 60
  var aux = (profile && profile.auxiliaries) || []
  var tier = (profile && profile.strengthTier) || 'intermediate'
  var sleep = habits.sleep || 'ok'
  var body = habits.body || 'none'
  var age = Number(profile && profile.ageYears) || 28
  var highAux = 0
  for (var i = 0; i < aux.length; i++) {
    if (aux[i] === 'crossfit' || aux[i] === 'hyrox' || aux[i] === 'running') highAux++
  }

  if (planId === 'strength-time-efficient') {
    if (duration <= 30) {
      score += 40
      reasons.push('单次时间紧，5/3/1 顶组结构更合适')
    } else if (duration <= 45) {
      score += 24
      reasons.push('训练时长偏紧，优先可持续的 5/3/1')
    } else {
      score -= 4
    }
    if (sleep === 'poor' || body === 'sore' || body === 'old') {
      score += 16
      reasons.push('恢复压力偏大，5/3/1 剂量更友好')
    }
    if (age >= 40) {
      score += 12
      reasons.push('年龄偏大，顶组周期更易长期坚持')
    }
    if (aux.length >= 2) score -= 4
  }

  if (planId === 'strength-linear') {
    if (tier === 'beginner') {
      score += 36
      reasons.push('力量基础阶段，线性 5×5 加重最稳')
    } else if (tier === 'intermediate') {
      score += 18
      reasons.push('早中级可用 5×5 继续吃线性红利')
    } else {
      score -= 12
      reasons.push('相对力量已高，纯线性空间有限')
    }
    if (aux.length <= 1) {
      score += 20
      reasons.push('辅助较少，适合死组线性加重')
    }
    if (aux.length >= 2) score -= 10
    if (duration >= 45 && duration <= 75) score += 6
  }

  if (planId === 'strength-hybrid-mix') {
    if (highAux >= 2) {
      score += 28
      reasons.push('多项辅助可放调节日，保住挪威双硬拉日')
    } else if (highAux === 1) {
      score += 16
      reasons.push('有辅助项目，挪威高频仍可兼顾')
    }
    if (duration >= 60) {
      score += 18
      reasons.push('单次时长充足，撑得住挪威课内波浪')
    }
    if (duration <= 30) score -= 16
    if (tier === 'intermediate' || tier === 'advanced') {
      score += 14
      reasons.push('中高级更吃挪威高频与波浪结构')
    }
    if (tier === 'beginner') score -= 8
  }

  if (!reasons.length) reasons.push('综合你的档案与训练习惯匹配')
  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 2) }
}

function fitLabelForRank(rank) {
  if (rank === 1) return '最匹配'
  if (rank === 2) return '备选'
  return '可选'
}

function recommend(profile) {
  var ranked = CATALOG.map(function (p) {
    var scored = scorePlan(p.id, profile)
    return {
      id: p.id,
      name: p.name,
      meta: p.meta,
      problem: p.problem,
      goal: p.goal,
      score: scored.score,
      reasons: scored.reasons,
      outcome: estimateOutcome(profile, p.id)
    }
  })
  ranked.sort(function (a, b) {
    return b.score - a.score
  })
  ranked = ranked.map(function (p, i) {
    var rank = i + 1
    var fitLabel = fitLabelForRank(rank)
    return Object.assign({}, p, { rank: rank, fitLabel: fitLabel, badge: fitLabel })
  })
  return {
    ok: true,
    source: 'cloud',
    selectedId: ranked[0] ? ranked[0].id : 'strength-hybrid-mix',
    plans: ranked
  }
}

exports.main = async (event) => {
  try {
    var profile = (event && event.profile) || {}
    return recommend(profile)
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'recommend_failed' }
  }
}
