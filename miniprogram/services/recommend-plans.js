/**
 * 计划个性化推荐（本地兜底与云函数同规则）。
 * 三套独立力量举：挪威 / 线性5×5 / 5/3/1
 */

const { PLAN_OPTIONS, getWeekSlots } = require('./plan')
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

  // 5/3/1：省时、恢复一般、年龄偏大
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

  // 线性 5×5：新手/早中级、辅助少
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

  // 挪威：恢复好、时长够、辅助多也能挂调节日
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
    if (sleep === 'good' || (!sleep && body === 'none')) score += 6
  }

  if (!reasons.length) {
    reasons.push('综合你的档案与训练习惯匹配')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.slice(0, 2)
  }
}

function fitLabelForRank(rank) {
  if (rank === 1) return '最匹配'
  if (rank === 2) return '备选'
  return '可选'
}

/**
 * @returns {{ ok: boolean, source: string, selectedId: string, plans: Array }}
 */
function recommendPlansLocal(profile) {
  var aux = (profile && profile.auxiliaries) || []
  var ranked = CATALOG.map(function (p) {
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
    selectedId: ranked[0] ? ranked[0].id : 'strength-hybrid-mix',
    plans: ranked
  }
}

module.exports = {
  recommendPlansLocal: recommendPlansLocal,
  scorePlan: scorePlan,
  CATALOG: CATALOG
}
