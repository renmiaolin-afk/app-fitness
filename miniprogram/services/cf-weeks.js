/** 按周/等级加载 CF 处方；require 路径必须为静态字符串 */

function load(week, level) {
  var w = Math.min(5, Math.max(1, Number(week) || 1))
  var t = level || 'advanced'
  if (w === 1) return loadWeek1(t)
  if (w === 2) return loadWeek2(t)
  if (w === 3) return loadWeek3(t)
  if (w === 4) return loadWeek4(t)
  return loadWeek5(t)
}

function loadWeek1(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-01/cf/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-01/cf/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-01/cf/advanced.js')
}

function loadWeek2(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-02/cf/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-02/cf/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-02/cf/advanced.js')
}

function loadWeek3(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-03/cf/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-03/cf/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-03/cf/advanced.js')
}

function loadWeek4(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-04/cf/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-04/cf/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-04/cf/advanced.js')
}

function loadWeek5(t) {
  if (t === 'beginner') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-05/cf/beginner.js')
  }
  if (t === 'intermediate') {
    return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-05/cf/intermediate.js')
  }
  return require('../data/plan/cycles/strength-hybrid-v1/weeks/week-05/cf/advanced.js')
}

module.exports = {
  load: load
}
