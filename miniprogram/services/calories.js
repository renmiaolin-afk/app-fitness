/**
 * 训练消耗卡路里粗估（非精准代谢测算）。
 * 公式：MET × 体重(kg) × 时长(小时)
 */

var MET = {
  strength: 6,
  aux: 8,
  default: 5.5
}

function weightKgOf(profile) {
  var w = Number(profile && profile.weightKg)
  if (!w || w < 35 || w > 200) return 70
  return w
}

function metForKind(kind) {
  if (kind === 'strength') return MET.strength
  if (kind === 'aux') return MET.aux
  return MET.default
}

/**
 * @param {{ kind?: string, durationSec?: number, durationMin?: number }} session
 * @param {object} [profile]
 * @returns {{ kcal: number, text: string, note: string }}
 */
function estimateSessionCalories(session, profile) {
  var sec = Number(session && session.durationSec)
  if (!sec || sec <= 0) {
    var mins = Number(session && session.durationMin) || 0
    sec = Math.round(mins * 60)
  }
  if (sec < 60) {
    return { kcal: 0, text: '', note: '' }
  }

  var hours = sec / 3600
  var kg = weightKgOf(profile)
  var met = metForKind(session && session.kind)
  var kcal = Math.round(met * kg * hours)

  // 力量课有完成组时，按组数略微调（组间休息已含在时长里，只做轻修正）
  if ((session && session.kind) === 'strength') {
    var sets = (session.sets || []).length
    if (sets >= 12) kcal = Math.round(kcal * 1.08)
    else if (sets >= 8) kcal = Math.round(kcal * 1.04)
  }

  if (kcal < 40) kcal = 40
  if (kcal > 1200) kcal = 1200

  // 取整到 10，看起来更像「大约」
  kcal = Math.round(kcal / 10) * 10

  return {
    kcal: kcal,
    text: '大约 ' + kcal + ' 千卡',
    note: '按体重和训练时长估算，仅供参考'
  }
}

module.exports = {
  estimateSessionCalories: estimateSessionCalories,
  MET: MET
}
