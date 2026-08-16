/** 动作与日程展示文案：说法清楚，不写「或 / 可选」这种含糊话 */

const MOVE_NAMES = {
  深蹲: '深蹲',
  卧推: '卧推',
  硬拉: '硬拉',
  轻硬拉: '轻硬拉',
  实力推: '实力推',
  罗马尼亚硬拉: '罗马尼亚硬拉',
  腿举: '腿举',
  核心: '悬垂举腿',
  面拉: '绳索面拉',
  三头下压: '绳索三头下压',
  臀推: '杠铃臀推',
  侧平举: '哑铃侧平举',
  窄握卧推: '窄握卧推',
  潘德勒划船: '潘德勒划船',
  引体向上: '引体向上'
}

const SLOT_LABELS = {
  深蹲: '深蹲',
  卧推: '卧推',
  硬拉: '硬拉',
  轻拉: '轻硬拉',
  轻硬拉: '轻硬拉',
  肩推: '肩背',
  肩背: '肩背',
  上推: '肩背',
  上肢: '上肢',
  跑: '跑步',
  CF: 'CrossFit',
  Hyrox: 'Hyrox',
  Hyrox轻: 'Hyrox 技术',
  AthX: 'AthX',
  休: '休息'
}

/** 周历格子用短标签，避免 7 列溢出 */
const SLOT_LABELS_SHORT = {
  深蹲: '深蹲',
  卧推: '卧推',
  硬拉: '硬拉',
  轻拉: '轻拉',
  轻硬拉: '轻拉',
  肩推: '肩背',
  肩背: '肩背',
  上推: '肩背',
  上肢: '上肢',
  跑: '跑步',
  CF: 'CF',
  Hyrox: 'Hyrox',
  Hyrox轻: 'Hyrox',
  AthX: 'AthX',
  休: '休息',
  休息: '休息',
  CrossFit: 'CF',
  'Hyrox 技术': 'Hyrox',
  肩背日: '肩背'
}

const NOTE_MAP = {
  主项后完成即可: '大动作练完，按顺序做下面这些',
  '潘德勒划船为背部必练，紧接卧推后做': '大动作练完，先做潘德勒划船，再做其余动作',
  '实力推为肩部必练主项；侧平举/面拉补齐肩部': '实力推练完，按顺序做引体和肩背动作',
  '肩推专项日：主项实力推，辅项补背部与肩袖': '肩背日：先练实力推，再补背部和肩袖',
  '维持周可砍 1 个辅助': '维持周：按下面做完就行，重量先别往上加',
  '减量周只保留 1–2 个轻辅助': '减量周：只做下面这些，重量降一档',
  '测力日不做辅助，测完即走': '测力日：试举做完就结束，后面不加练'
}

function moveName(name) {
  if (!name) return ''
  return MOVE_NAMES[name] || name
}

function slotLabel(label) {
  if (!label) return ''
  return SLOT_LABELS[label] || label
}

function slotLabelShort(label) {
  if (!label) return ''
  var full = SLOT_LABELS[label] || label
  return SLOT_LABELS_SHORT[label] || SLOT_LABELS_SHORT[full] || full
}

function setsReps(sets, reps) {
  if (sets == null || reps == null) return ''
  return sets + '组 × ' + reps + '次'
}

function setsRepsLoad(sets, reps, kg) {
  var base = setsReps(sets, reps)
  if (kg == null || kg === '') return base
  return base + ' · ' + kg + ' kg'
}

function accessoryNote(note, scalingNote) {
  if (!note) return '大动作练完，按顺序做下面这些'
  if (note === '引体向上为背部必练；做不了严格引体见 scalingNote') {
    var scale = scalingNote || '动作做完整就行'
    return '大动作练完，先做引体向上，再做其余动作；' + scale
  }
  return NOTE_MAP[note] || note
}

module.exports = {
  moveName: moveName,
  slotLabel: slotLabel,
  slotLabelShort: slotLabelShort,
  setsReps: setsReps,
  setsRepsLoad: setsRepsLoad,
  accessoryNote: accessoryNote
}
