/**
 * 计划个性化推荐（本地兜底与云函数同规则）。
 * 四套：挪威高频 / 线性5×5 / 5/3/1 / 四天力量
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
  if (planId === 'strength-linear' && tier === 'advanced') return false
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
  var sleep = habits.sleep || 'ok'
  var body = habits.body || 'none'
  var effort = habits.effort || 'solid'
  var age = Number(profile && profile.ageYears) || 28
  var hasAux = aux.length >= 1

  // —— 训练节奏（建档第 2 页）：轻松 / 好好练 / 拼一把 ——
  if (effort === 'easy') {
    if (planId === 'strength-time-efficient') {
      score += 36
      reasons.push('你想轻松练练，省时顶组最不容易练崩')
    }
    if (planId === 'strength-linear') {
      score += 18
      reasons.push('线性结构简单，适合轻松把习惯养住')
    }
    if (planId === 'strength-build') {
      score -= 22
      reasons.push('四天容量偏满，和「轻松练练」不太匹配')
    }
    if (planId === 'strength-hybrid-mix') {
      score -= 28
      reasons.push('挪威高频负担偏大，轻松阶段先不优先')
    }
  } else if (effort === 'hard') {
    if (planId === 'strength-hybrid-mix') {
      score += 32
      reasons.push('你想拼一把，挪威高频更能吃满涨力窗口')
    }
    if (planId === 'strength-build') {
      score += 26
      reasons.push('四天容量足，适合想认真堆进度的阶段')
    }
    if (planId === 'strength-time-efficient') {
      score -= 14
      reasons.push('省时顶组偏保守，不如高频/四天吃得满')
    }
    if (planId === 'strength-linear' && tier !== 'beginner') {
      score -= 6
    }
  } else {
    // solid：好好练 — 平衡进步与可持续
    if (planId === 'strength-linear') {
      score += 14
      reasons.push('好好练时，线性加重清晰好执行')
    }
    if (planId === 'strength-build') {
      score += 12
      reasons.push('好好练也能用四天把力量和围度一起推')
    }
    if (planId === 'strength-hybrid-mix') {
      score += 8
    }
    if (planId === 'strength-time-efficient') {
      score += 6
    }
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
  }

  // 线性 5×5：新手/早中级
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

  // 四天力量：想练厚、时长够、中级
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

  // 挪威：恢复好、时长够、有辅助也能挂调节日
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
    selectedId: ranked[0] ? ranked[0].id : 'strength-hybrid-mix',
    plans: ranked
  }
}

module.exports = {
  recommendPlansLocal: recommendPlansLocal,
  scorePlan: scorePlan,
  CATALOG: CATALOG
}
