/** 按周/等级加载力量处方；require 路径必须为静态字符串 */

function load(week, tier) {
  var w = Math.min(5, Math.max(1, Number(week) || 1))
  var t = tier || 'advanced'
  if (w === 1) return loadWeek1(t)
  if (w === 2) return loadWeek2(t)
  if (w === 3) return loadWeek3(t)
  if (w === 4) return loadWeek4(t)
  return loadWeek5(t)
}

function loadWeek1(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-01/strength/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-01/strength/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-01/strength/advanced.js')
}

function loadWeek2(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-02/strength/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-02/strength/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-02/strength/advanced.js')
}

function loadWeek3(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-03/strength/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-03/strength/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-03/strength/advanced.js')
}

function loadWeek4(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-04/strength/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-04/strength/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-04/strength/advanced.js')
}

function loadWeek5(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-05/strength/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-05/strength/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-05/strength/advanced.js')
}

module.exports = {
  load: load
}
