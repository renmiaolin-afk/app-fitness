/**
 * 云函数：根据建档档案个性化推荐训练计划
 * 部署：开发者工具 → 云开发 → 云函数 → 右键 recommendPlans → 上传并部署
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const CATALOG = [
  {
    id: 'strength-hybrid-mix',
    name: '挪威高频',
    meta: '每周蹲推拉更密 + 肩背；恢复好时三大项涨得最快',
    problem: '练什么：挪威波浪（4×4→2×2→1×8）高频蹲推拉，另加肩背日与轻拉日。',
    goal: '练完会怎样：恢复跟得上时，三大项上涨通常最快。'
  },
  {
    id: 'strength-linear',
    name: '线性加重',
    meta: '蹲卧 5×5、硬拉 1×5 + 肩背；结构简单，适合连续进步',
    problem: '练什么：深蹲/卧推 5×5、硬拉 1×5，外加一天肩背（实力推+引体）。',
    goal: '练完会怎样：适合打基础，每周能稳定看到重量往上走。'
  },
  {
    id: 'strength-time-efficient',
    name: '省时顶组',
    meta: '5/3/1 顶组循环 + 肩背；单次更短，护恢复可长期练',
    problem: '练什么：5/3/1 顶组为主，三力各一天 + 肩背日，单次更短。',
    goal: '练完会怎样：时间紧也能长期坚持，力量缓慢但持续上涨。'
  },
  {
    id: 'strength-build',
    name: '四天力量',
    meta: '蹲 / 推 / 拉 / 肩各一天；力量上涨同时练得更厚实',
    problem: '练什么：蹲、卧推、硬拉、肩背四天拆开练，组数容量更足。',
    goal: '练完会怎样：三大项继续涨，同时肩背腿围度更饱满、看着更厚。'
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
    if (aux[i] === 'crossfit' || aux[i] === 'hyrox' || aux[i] === 'athx') high++
  }
  if (high >= 1) m *= 0.92
  var habits = (profile && profile.habits) || {}
  if (habits.sleep === 'poor') m *= 0.85
  else if (habits.sleep === 'ok') m *= 0.95
  if (habits.body === 'sore') m *= 0.9
  else if (habits.body === 'old') m *= 0.95
  if (planId === 'strength-time-efficient') m *= 0.9
  if (planId === 'strength-linear') m *= 1.05
  if (planId === 'strength-build') m *= 1.02
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
  var highV = roundToStep(midRaw * 1.25, 2.5)
  if (highV < 2.5) highV = 2.5
  if (highV < low) highV = low
  if (low === highV) return '估算合计约 +' + highV + ' kg'
  return '估算合计约 +' + low + '–' + highV + ' kg'
}

function isPlanEligible(planId, profile) {
  var tier = (profile && profile.strengthTier) || 'intermediate'
  if (planId === 'strength-linear' && tier === 'advanced') return false
  return true
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
  var effort = habits.effort || 'solid'
  var age = Number(profile && profile.ageYears) || 28
  var hasAux = aux.length >= 1

  if (effort === 'easy') {
    if (planId === 'strength-time-efficient') {
      score += 36
      reasons.push('你想轻松练练，省时顶组最不容易练崩')
    }
    if (planId === 'strength-linear') {
      score += 18
      reasons.push('线性结构简单，适合轻松把习惯养住')
    }
    if (planId === 'strength-build') score -= 22
    if (planId === 'strength-hybrid-mix') score -= 28
  } else if (effort === 'hard') {
    if (planId === 'strength-hybrid-mix') {
      score += 32
      reasons.push('你想拼一把，挪威高频更能吃满涨力窗口')
    }
    if (planId === 'strength-build') {
      score += 26
      reasons.push('四天容量足，适合想认真堆进度的阶段')
    }
    if (planId === 'strength-time-efficient') score -= 14
    if (planId === 'strength-linear' && tier !== 'beginner') score -= 6
  } else {
    if (planId === 'strength-linear') {
      score += 14
      reasons.push('好好练时，线性加重清晰好执行')
    }
    if (planId === 'strength-build') score += 12
    if (planId === 'strength-hybrid-mix') score += 8
    if (planId === 'strength-time-efficient') score += 6
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
    if (!hasAux) {
      score += 12
      reasons.push('无辅助时更适合专注死组线性加重')
    }
    if (duration >= 45 && duration <= 75) score += 6
  }

  if (planId === 'strength-build') {
    if (duration >= 60) {
      score += 22
      reasons.push('单次时长够，四天容量更能练厚')
    } else if (duration <= 30) {
      score -= 18
      reasons.push('时间偏紧，四天容量可能吃不消')
    }
    if (tier === 'intermediate') {
      score += 16
      reasons.push('中级适合用四天同步涨力与围度')
    } else if (tier === 'beginner') {
      score += 8
      reasons.push('新手也可用四天打厚基础')
    }
    if (body === 'none' && sleep !== 'poor') score += 8
    if (hasAux) score += 4
  }

  if (planId === 'strength-hybrid-mix') {
    if (hasAux) {
      score += 16
      reasons.push('有辅助项目，挪威高频仍可兼顾调节日')
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
    if (sleep === 'good' || (!sleep && body === 'none')) score += 6
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
  var ranked = CATALOG.filter(function (p) {
    return isPlanEligible(p.id, profile)
  }).map(function (p) {
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
