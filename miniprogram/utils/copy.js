/** 专业处方文案：给出明确动作，不使用「或 / 可选」式模糊说法 */

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
  肩推: '实力推',
  上推: '实力推',
  上肢: '上肢',
  跑: '跑步',
  CF: 'CrossFit',
  Hyrox: 'Hyrox',
  Hyrox轻: 'Hyrox 技术',
  休: '休息'
}

/** 周历格子用短标签，避免 7 列溢出 */
const SLOT_LABELS_SHORT = {
  深蹲: '深蹲',
  卧推: '卧推',
  硬拉: '硬拉',
  轻拉: '轻拉',
  轻硬拉: '轻拉',
  肩推: '肩推',
  上推: '肩推',
  上肢: '上肢',
  跑: '跑步',
  CF: 'CF',
  Hyrox: 'Hyrox',
  Hyrox轻: 'Hyrox',
  休: '休息',
  休息: '休息',
  CrossFit: 'CF',
  'Hyrox 技术': 'Hyrox'
}

const NOTE_MAP = {
  主项后完成即可: '主项完成后，按顺序完成下列辅助',
  '潘德勒划船为背部必练，紧接卧推后做': '主项完成后，先做潘德勒划船，再完成其余辅助',
  '实力推为肩部必练主项；侧平举/面拉补齐肩部': '主项完成后，按顺序完成下列辅助',
  '维持周可砍 1 个辅助': '维持周：辅助按下方处方完成，负荷不上涨',
  '减量周只保留 1–2 个轻辅助': '减量周：仅完成下方辅助，负荷下调一档',
  '测力日不做辅助，测完即走': '测力日：完成正式试举后结束，不安排辅助'
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
  if (!note) return '主项完成后，按顺序完成下列辅助'
  if (note === '引体向上为背部必练；做不了严格引体见 scalingNote') {
    var scale = scalingNote || '保持完整幅度'
    return '主项完成后，先做引体向上，再完成其余辅助；' + scale
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
