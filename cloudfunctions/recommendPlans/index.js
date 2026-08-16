/**
 * 云函数：根据建档档案个性化推荐训练计划
 * 部署：开发者工具 → 云开发 → 云函数 → 右键 recommendPlans → 上传并部署
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const CATALOG = [
  {
    id: 'strength-frequent',
    name: '高频力训',
    meta: '练得更密，恢复跟得上时三大项通常涨得最快',
    problem: '怎么练：深蹲、卧推、硬拉练得更密，再加肩背和轻拉（低强度技术组）。',
    goal: '适合你：恢复跟得上时，三大项通常涨得最快。'
  },
  {
    id: 'strength-basic',
    name: '基础力训',
    meta: '结构简单：每周一点点往上加，适合稳稳进步',
    problem: '怎么练：深蹲和卧推 5×5，硬拉 1×5，再加一天肩背；加重周内完成就加重。',
    goal: '适合你：结构简单好执行，适合把底子打稳。'
  },
  {
    id: 'strength-lean',
    name: '精简力训',
    meta: '单次更短，护住恢复，适合长期坚持',
    problem: '怎么练：三大项各一天做顶组（5/3/1），再加一天肩背，单次约 30 分钟。',
    goal: '适合你：时间紧也能长期练，力量慢慢往上爬。'
  },
  {
    id: 'strength-split',
    name: '分化力训',
    meta: '蹲推拉和肩背拆成四天、每天容量更足，力量涨的同时练得更厚',
    problem: '怎么练：蹲、卧、拉、肩背各一天，主项外再加 2–3 个辅助，容量更高。',
    goal: '适合你：力量继续涨，肩背和腿也会练得更厚实。'
  }
]

const TIER_RATE = {
  beginner: { squat: 0.05, bench: 0.04, deadlift: 0.05 },
  intermediate: { squat: 0.015, bench: 0.012, deadlift: 0.015 },
  advanced: { squat: 0.008, bench: 0.006, deadlift: 0.008 }
}

const TIER_CAP = {
  beginner: { squat: 12.5, bench: 7.5, deadlift: 12.5 },
  intermediate: { squat: 5, bench: 2.5, deadlift: 5 },
  advanced: { squat: 2.5, bench: 2.5, deadlift: 2.5 }
}

const TIER_FLOOR = {
  beginner: { squat: 5, bench: 2.5, deadlift: 5 },
  intermediate: { squat: 2.5, bench: 0, deadlift: 2.5 },
  advanced: { squat: 0, bench: 0, deadlift: 0 }
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

function inferTier(profile) {
  if (profile && profile.strengthTier) return profile.strengthTier
  var squat = Number((profile && profile.oneRm && profile.oneRm.squat) || 0)
  if (squat < 120) return 'beginner'
  if (squat < 160) return 'intermediate'
  return 'advanced'
}

function estimateOutcome(profile, planId) {
  var tier = inferTier(profile)
  var oneRm = (profile && profile.oneRm) || {}
  var m = ageGainFactor(profile && profile.ageYears)
  var aux = (profile && profile.auxiliaries) || []
  var high = 0
  for (var i = 0; i < aux.length; i++) {
    if (aux[i] === 'crossfit' || aux[i] === 'hyrox' || aux[i] === 'athx') high++
  }
  if (high >= 2) m *= 0.85
  else if (high >= 1) m *= 0.92
  var habits = (profile && profile.habits) || {}
  if (habits.sleep === 'poor') m *= 0.85
  else if (habits.sleep === 'ok') m *= 0.95
  if (habits.body === 'sore') m *= 0.9
  else if (habits.body === 'old') m *= 0.95
  if (planId === 'strength-lean') m *= 0.85
  if (planId === 'strength-basic') m *= 1.12
  if (planId === 'strength-split') m *= 1.04
  if (planId === 'strength-frequent') m *= 1.08
  m = Math.max(0.5, Math.min(1.2, m))

  var rates = TIER_RATE[tier] || TIER_RATE.intermediate
  var caps = TIER_CAP[tier] || TIER_CAP.intermediate
  var floors = TIER_FLOOR[tier] || TIER_FLOOR.intermediate
  var midRaw = 0
  ;['squat', 'bench', 'deadlift'].forEach(function (lift) {
    var base = Number(oneRm[lift]) || 0
    if (base <= 0) return
    var raw = base * rates[lift] * m
    var minGain = (floors[lift] || 0) * Math.max(0.7, Math.min(1, m))
    if (raw < minGain) raw = minGain
    if (raw > caps[lift]) raw = caps[lift]
    midRaw += raw
  })
  if (midRaw <= 0) return '填好三大项大概重量后，再估算这周期能涨多少'
  var low = roundToStep(midRaw * 0.6, 2.5)
  var highV = roundToStep(midRaw * 1.25, 2.5)
  if (highV < 2.5) highV = 2.5
  if (highV < low) highV = low
  if (low === highV) return '这周期三大项合计大概能涨 +' + highV + ' kg'
  return '这周期三大项合计大概能涨 +' + low + '–' + highV + ' kg'
}

function isPlanEligible(planId, profile) {
  var tier = (profile && profile.strengthTier) || 'intermediate'
  if (planId === 'strength-basic' && tier === 'advanced') return false
  return true
}

function scorePlan(planId, profile) {
  var score = 40
  var reasons = []
  var habits = (profile && profile.habits) || {}
  var duration = Number(habits.durationMin) || 60
  var aux = (profile && profile.auxiliaries) || []
  var tier = (profile && profile.strengthTier) || 'intermediate'
  var sleepRaw = habits.sleep
  var sleep = sleepRaw || 'ok'
  var body = habits.body || 'none'
  var effort = habits.effort || 'solid'
  var age = Number(profile && profile.ageYears) || 28
  var hasAux = aux.length >= 1

  if (effort === 'easy') {
    if (planId === 'strength-lean') {
      score += 36
      reasons.push('你想轻松一点练，精简力训最不容易练崩')
    }
    if (planId === 'strength-basic') {
      score += 18
      reasons.push('结构简单，适合轻松把习惯养住')
    }
    if (planId === 'strength-split') score -= 22
    if (planId === 'strength-frequent') score -= 28
  } else if (effort === 'hard') {
    if (planId === 'strength-frequent') {
      score += 32
      reasons.push('你想拼一把，高频力训更能抓住涨力窗口')
    }
    if (planId === 'strength-split') {
      score += 26
      reasons.push('「分化力训」练得更满，适合认真往上推')
    }
    if (planId === 'strength-lean') score -= 14
    if (planId === 'strength-basic' && tier !== 'beginner') score -= 6
  } else {
    if (planId === 'strength-basic') {
      score += 14
      reasons.push('好好练时，基础力训清楚好跟')
    }
    if (planId === 'strength-split') score += 12
    if (planId === 'strength-frequent') score += 8
    if (planId === 'strength-lean') score += 6
  }

  if (planId === 'strength-lean') {
    if (duration <= 30) {
      score += 40
      reasons.push('你单次时间紧，精简力训更合适')
    } else if (duration <= 45) {
      score += 24
      reasons.push('时间不算宽裕，优先能长期练下去的安排')
    } else {
      score -= 4
    }
    if (sleep === 'poor' || body === 'sore' || body === 'old') {
      score += 16
      reasons.push('恢复压力偏大，顶组安排更护一点')
    }
    if (age >= 40) {
      score += 12
      reasons.push('更适合细水长流，顶组周期更好坚持')
    }
  }

  if (planId === 'strength-basic') {
    if (tier === 'beginner') {
      score += 36
      reasons.push('刚打底子时，5×5 一点点加重最稳')
    } else if (tier === 'intermediate') {
      score += 18
      reasons.push('这个阶段还能继续按线性一点点加重')
    } else {
      score -= 12
      reasons.push('力量已经不低，纯线性空间有限')
    }
    if (!hasAux) {
      score += 12
      reasons.push('没选加练时，更适合专心做基础力训')
    }
    if (duration >= 45 && duration <= 75) score += 6
  }

  if (planId === 'strength-split') {
    if (duration >= 60) {
      score += 22
      reasons.push('单次时间够，四天更能练厚')
    } else if (duration <= 30) {
      score -= 18
      reasons.push('时间偏紧，四天可能吃不消')
    }
    if (tier === 'intermediate') {
      score += 16
      reasons.push('中级适合用四天一起推力量和围度')
    } else if (tier === 'beginner') {
      score += 8
      reasons.push('新手也可以用四天把底子打厚')
    }
    if (body === 'none' && sleep !== 'poor') score += 8
    if (hasAux) score += 4
  }

  if (planId === 'strength-frequent') {
    if (hasAux) {
      score += 16
      reasons.push('有加练日，高频力训也能兼顾')
    }
    if (duration >= 60) {
      score += 18
      reasons.push('单次时间够，撑得住这种密练')
    }
    if (duration <= 30) score -= 16
    if (tier === 'intermediate' || tier === 'advanced') {
      score += 14
      reasons.push('这个水平更适合高频力训这种密练')
    }
    if (tier === 'beginner') score -= 8
    if (sleep === 'good' || (!sleepRaw && body === 'none')) score += 6
  }

  if (!reasons.length) reasons.push('按你现在的情况，这套更合适')
  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 2) }
}

function fitLabelForRank(rank) {
  if (rank === 1) return '更适合你'
  if (rank === 2) return '也可以'
  return '备选'
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
    selectedId: ranked[0] ? ranked[0].id : 'strength-frequent',
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
