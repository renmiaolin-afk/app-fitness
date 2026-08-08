const storage = require('../utils/storage')

/** 文案变更时递增；未匹配则强制重新同意 */
var DISCLAIMER_VERSION = '2026-08-08-legal'

var DISCLAIMER_TITLE = '法律免责声明'

var DISCLAIMER_UPDATED = '2026年8月8日'

/**
 * 来源：健身训练小程序_法律免责声明.md
 * 正式发布前仍建议法务终审；争议管辖地等占位请替换。
 */
var DISCLAIMER_INTRO =
  '欢迎使用本小程序（以下简称"本产品"）。在使用本产品提供的健身/运动训练相关内容、课程、计划、数据分析或建议（以下统称"训练内容"）之前，请您仔细阅读并充分理解以下声明。您使用本产品即视为同意本声明的全部内容。'

var DISCLAIMER_SECTIONS = [
  {
    heading: '一、非医疗建议声明',
    body:
      '1. 本产品提供的所有训练内容仅供健身参考与娱乐目的，不构成医疗诊断、治疗建议或专业医疗意见，不能替代执业医师、理疗师或其他专业医疗人员的诊断与建议。\n' +
      '2. 若您患有心脏病、高血压、关节损伤、孕期或其他可能因运动而加重的身体状况，请在开始任何训练计划前咨询医生。\n' +
      '3. 本产品不对训练内容是否适合您的个人身体状况作出任何明示或默示的保证。'
  },
  {
    heading: '二、运动风险提示',
    body:
      '1. 任何身体运动均存在受伤风险，包括但不限于肌肉拉伤、关节损伤、心血管意外等。\n' +
      '2. 您应根据自身体能状况选择适当的训练强度，如训练过程中出现头晕、胸痛、呼吸困难、关节剧烈疼痛等不适症状，应立即停止训练并就医。\n' +
      '3. 您理解并自愿承担因参与本产品训练内容而可能产生的一切运动风险及后果。'
  },
  {
    heading: '三、内容准确性与效果声明',
    body:
      '1. 本产品中的训练计划、动作指导、饮食建议、数据统计（如卡路里消耗、体脂率估算等）基于通用算法或行业经验模型生成，可能存在误差，仅供参考，不保证绝对准确。\n' +
      '2. 训练效果因人而异，受个人体质、执行程度、饮食作息等多种因素影响，本产品不对任何特定训练效果（如减脂、增肌、体重变化等）作出保证承诺。\n' +
      '3. 如内容中出现的示范动作、教练指导、AI生成建议等，均不能完全替代专业私人教练的现场指导。'
  },
  {
    heading: '四、责任限制',
    body:
      '在法律允许的最大范围内：\n' +
      '1. 本产品及其运营方对因使用（或无法使用）本产品训练内容而导致的任何直接、间接、附带、特殊或后果性损害（包括但不限于人身伤害、财产损失、数据丢失）不承担责任。\n' +
      '2. 因第三方设备（如智能手环、体脂秤等）数据同步误差导致的训练建议偏差，本产品不承担相应责任。\n' +
      '3. 用户因未如实填写健康信息、隐瞒既往病史而导致的不良后果，由用户自行承担。'
  },
  {
    heading: '五、用户义务',
    body:
      '使用本产品即表示您确认：\n' +
      '1. 您已如实告知自身健康状况及运动禁忌；\n' +
      '2. 您具备完成所选训练强度的基本身体条件，或已获得医生许可；\n' +
      '3. 您将根据自身实际情况调整训练强度，量力而行。'
  },
  {
    heading: '六、知识产权声明',
    body:
      '本产品内的训练课程、视频、文字、图片、AI生成内容等均受相关知识产权法律保护，未经授权不得转载、复制或用于商业用途。'
  },
  {
    heading: '七、条款变更',
    body:
      '本声明可能随产品迭代、法律法规变化等原因适时更新，更新后的内容将在本产品内公示，请您定期查阅。'
  },
  {
    heading: '八、适用法律与争议解决',
    body:
      '本声明的订立、生效、解释及争议解决均适用中华人民共和国大陆地区法律。因本声明或本产品使用产生的争议，双方应友好协商解决；协商不成的，任何一方均可向运营方所在地有管辖权的人民法院提起诉讼。'
  }
]

var DISCLAIMER_FOOTNOTE =
  '特别提示：正式发布前，建议交由具备资质的律师或法务团队根据产品实际功能、目标用户群体及最新法律法规进行审核修订，以确保合规性。'

function hasValidConsent(profile) {
  if (!profile || !profile.disclaimerAccepted) return false
  return String(profile.disclaimerVersion || '') === DISCLAIMER_VERSION
}

function acceptConsent() {
  var prev = storage.getProfile() || {}
  storage.setProfile(
    Object.assign({}, prev, {
      disclaimerAccepted: true,
      disclaimerVersion: DISCLAIMER_VERSION,
      disclaimerAcceptedAt: Date.now()
    })
  )
}

function nextUrlAfterConsent() {
  var p = storage.getProfile()
  if (p && p.planId) return '/pages/today/today'
  return '/pages/onboarding/ability/ability'
}

/**
 * 无有效同意则跳转声明页。
 * @returns {boolean} true = 可继续当前页
 */
function ensureConsent() {
  if (hasValidConsent(storage.getProfile())) return true
  wx.redirectTo({ url: '/pages/onboarding/disclaimer/disclaimer' })
  return false
}

/**
 * 今日等主流程：同意 → 建档 → 进入业务页。
 * @returns {boolean} true = 档案齐全可继续
 */
function ensureReadyForApp() {
  if (!ensureConsent()) return false
  var p = storage.getProfile()
  if (!p || !p.planId) {
    wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
    return false
  }
  return true
}

module.exports = {
  DISCLAIMER_VERSION: DISCLAIMER_VERSION,
  DISCLAIMER_TITLE: DISCLAIMER_TITLE,
  DISCLAIMER_UPDATED: DISCLAIMER_UPDATED,
  DISCLAIMER_INTRO: DISCLAIMER_INTRO,
  DISCLAIMER_SECTIONS: DISCLAIMER_SECTIONS,
  DISCLAIMER_FOOTNOTE: DISCLAIMER_FOOTNOTE,
  hasValidConsent: hasValidConsent,
  acceptConsent: acceptConsent,
  nextUrlAfterConsent: nextUrlAfterConsent,
  ensureConsent: ensureConsent,
  ensureReadyForApp: ensureReadyForApp
}
