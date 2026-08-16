/**
 * 计划个性化推荐（本地兜底与云函数同规则）。
 * 四套：高频力训 / 线性5×5 / 5/3/1 / 分化力训
 */

const { PLAN_OPTIONS, getWeekSlots, inferStrengthTier } = require('./plan')
const { estimateBlockGain } = require('./progress-target')

const CATALOG = PLAN_OPTIONS.map(function (p) {
  return {
    id: p.id,
    name: p.name,
    meta: p.meta,
    problem: p.problem,
    goal: p.goal
  }
})

/** 进阶不再展示「新手线性」——相对力量已高时 5×5 红利基本吃完 */
function isPlanEligible(planId, profile) {
  var tier =
    (profile && profile.strengthTier) || inferStrengthTier(profile || {})
  if (planId === 'strength-basic' && tier === 'advanced') return false
  return true
}

function scorePlan(planId, profile) {
  var score = 40
  var reasons = []
  var habits = (profile && profile.habits) || {}
  var duration = Number(habits.durationMin) || 60
  var aux = (profile && profile.auxiliaries) || []
  var tier =
    (profile && profile.strengthTier) || inferStrengthTier(profile || {}) || 'intermediate'
  var sleepRaw = habits.sleep
  var sleep = sleepRaw || 'ok'
  var body = habits.body || 'none'
  var effort = habits.effort || 'solid'
  var age = Number(profile && profile.ageYears) || 28
  var hasAux = aux.length >= 1

  // —— 训练节奏（建档第 2 页）：轻松 / 好好练 / 拼一把 ——
  if (effort === 'easy') {
    if (planId === 'strength-lean') {
      score += 36
      reasons.push('你想轻松一点练，精简力训最不容易练崩')
    }
    if (planId === 'strength-basic') {
      score += 18
      reasons.push('结构简单，适合轻松把习惯养住')
    }
    if (planId === 'strength-split') {
      score -= 22
      reasons.push('四天练得偏满，跟「轻松练练」不太搭')
    }
    if (planId === 'strength-frequent') {
      score -= 28
      reasons.push('高频力训强度偏高，轻松阶段先放一放')
    }
  } else if (effort === 'hard') {
    if (planId === 'strength-frequent') {
      score += 32
      reasons.push('你想拼一把，高频力训更能抓住涨力窗口')
    }
    if (planId === 'strength-split') {
      score += 26
      reasons.push('「分化力训」练得更满，适合认真往上推')
    }
    if (planId === 'strength-lean') {
      score -= 14
      reasons.push('精简力训偏保守，涨力节奏不如另外两套猛')
    }
    if (planId === 'strength-basic' && tier !== 'beginner') {
      score -= 6
    }
  } else {
    // solid：好好练 — 平衡进步与可持续
    if (planId === 'strength-basic') {
      score += 14
      reasons.push('好好练时，基础力训清楚好跟')
    }
    if (planId === 'strength-split') {
      score += 12
      reasons.push('好好练也能用四天把力量和围度一起推')
    }
    if (planId === 'strength-frequent') {
      score += 8
    }
    if (planId === 'strength-lean') {
      score += 6
    }
  }

  // 5/3/1：省时、恢复一般、年龄偏大
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

  // 线性 5×5：新手/早中级
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

  // 分化力训：想练厚、时长够、中级
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

  // 挪威：恢复好、时长够、有辅助也能挂调节日
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

  if (!reasons.length) {
    reasons.push('按你现在的情况，这套更合适')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.slice(0, 2)
  }
}

function fitLabelForRank(rank) {
  if (rank === 1) return '更适合你'
  if (rank === 2) return '也可以'
  return '备选'
}

/**
 * @returns {{ ok: boolean, source: string, selectedId: string, plans: Array }}
 */
function recommendPlansLocal(profile) {
  var aux = (profile && profile.auxiliaries) || []
  var ranked = CATALOG.filter(function (p) {
    return isPlanEligible(p.id, profile)
  }).map(function (p) {
    var scored = scorePlan(p.id, profile)
    var gain = estimateBlockGain(Object.assign({}, profile, { planId: p.id }))
    var slots = getWeekSlots(p.id, aux)
    return {
      id: p.id,
      name: p.name,
      meta: p.meta,
      problem: p.problem,
      goal: p.goal,
      score: scored.score,
      reasons: scored.reasons,
      outcome: gain.summary || '',
      weekLabels: slots.map(function (s) {
        return s.label
      })
    }
  })

  ranked.sort(function (a, b) {
    return b.score - a.score
  })

  ranked = ranked.map(function (p, i) {
    var rank = i + 1
    var fitLabel = fitLabelForRank(rank)
    return Object.assign({}, p, {
      rank: rank,
      fitLabel: fitLabel,
      badge: fitLabel
    })
  })

  return {
    ok: true,
    source: 'local',
    selectedId: ranked[0] ? ranked[0].id : 'strength-frequent',
    plans: ranked
  }
}

module.exports = {
  recommendPlansLocal: recommendPlansLocal,
  scorePlan: scorePlan,
  CATALOG: CATALOG
}
