/**
 * 训练内容 set-card 排版（左顺序 · 中动作/组数 · 右重量）
 * 今天页与周期详情页共用，保证视觉一致。
 */
const copy = require('../utils/copy')
const { formatMainSetSheet } = require('./warmup-sets')
const { resolveAccessoryKg, getStrengthDay, getAuxSession } = require('./plan')

function makeSetCard(opts) {
  var hasUnit = !!(opts.hasKg || opts.plateUnit)
  return {
    kgText: opts.kgText || '',
    hasKg: !!opts.hasKg,
    plateUnit: opts.plateUnit || '',
    plateClass: opts.plateClass != null ? opts.plateClass : hasUnit ? '' : 'bw',
    name: opts.name || '',
    detail: opts.detail || '',
    setsText: opts.setsText != null ? String(opts.setsText) : '',
    setsLabel: opts.setsLabel || '组',
    tone: opts.tone || 'work',
    showStatus: !!opts.showStatus,
    statusChip: opts.statusChip || ''
  }
}

/** 辅项：表格用组/次字段 */
function formatAccessoryBlock(a) {
  var sets = a && a.sets != null ? Number(a.sets) : 0
  var reps = a && a.reps != null ? a.reps : ''
  var kg = a && a.kg != null && a.kg !== '' && !isNaN(Number(a.kg)) ? Number(a.kg) : null
  var loadType = (a && a.loadType) || (kg != null ? 'external' : 'bodyweight')
  return {
    name: copy.moveName(a && a.name),
    sets: sets > 0 ? String(sets) : '—',
    reps: reps !== '' && reps != null ? String(reps) : '—',
    kg: kg,
    loadType: loadType,
    badge: sets > 0 && reps !== '' ? sets + '×' + reps : '—',
    meta: sets > 0 && reps !== '' ? sets + ' 组 · 每组 ' + reps + ' 次' : ''
  }
}

function parseSetsFromText(text) {
  var m = String(text || '').match(/(\d+)\s*[×xX]/)
  return m ? m[1] : ''
}

/**
 * 解析 CF 处方组数/次数：5×3、3×3–5、6 组 · 2 次
 * @returns {{ sets: number, repsText: string, pctText: string }|null}
 */
function parseCfSetsReps(text) {
  var s = String(text || '')
  if (!s) return null
  var pct = parsePctFromText(s)
  var m = s.match(/(\d+)\s*[×xX]\s*(\d+)\s*[–\-〜~]\s*(\d+)/)
  if (m) {
    return { sets: Number(m[1]), repsText: m[2] + '–' + m[3], pctText: pct || '' }
  }
  m = s.match(/(\d+)\s*[×xX]\s*(\d+)/)
  if (m) {
    return { sets: Number(m[1]), repsText: m[2], pctText: pct || '' }
  }
  m = s.match(/(\d+)\s*组[^0-9]{0,12}(\d+)\s*[–\-〜~]\s*(\d+)\s*次/)
  if (m) {
    return { sets: Number(m[1]), repsText: m[2] + '–' + m[3], pctText: pct || '' }
  }
  m = s.match(/(\d+)\s*组[^0-9]{0,12}(\d+)\s*次/)
  if (m) {
    return { sets: Number(m[1]), repsText: m[2], pctText: pct || '' }
  }
  m = s.match(/[×xX]\s*(\d+)\s*组[^0-9]{0,8}(\d+)\s*次/)
  if (m) {
    return { sets: Number(m[1]), repsText: m[2], pctText: pct || '' }
  }
  return null
}

/** 21-15-9 / 15-12-9 等递减回合 */
function parseLadderRounds(text) {
  var m = String(text || '').match(/(\d+)\s*[-–]\s*(\d+)\s*[-–]\s*(\d+)/)
  if (!m) return null
  return [m[1], m[2], m[3]]
}

/**
 * 把「N 组 × R 次」拆成 N 张卡；拆不开则返回单卡。
 */
function expandSetsToCards(opts) {
  opts = opts || {}
  var name = opts.name || ''
  var detail = opts.detail || ''
  var left = opts.left || {}
  var parsed = parseCfSetsReps(detail)
  var cards = []
  if (parsed && parsed.sets >= 1 && parsed.sets <= 16) {
    for (var i = 0; i < parsed.sets; i++) {
      var parts = []
      if (opts.phase) parts.push(opts.phase)
      parts.push('每组 ' + parsed.repsText + ' 次')
      if (parsed.pctText) parts.push(parsed.pctText + '%')
      if (opts.extraDetail) parts.push(opts.extraDetail)
      cards.push(
        makeSetCard({
          kgText: left.kgText,
          hasKg: left.hasKg,
          plateUnit: left.plateUnit,
          plateClass: left.plateClass,
          name: name,
          detail: parts.join(' · ') || detail,
          setsText: '1',
          setsLabel: '组',
          tone: opts.tone || left.tone || 'work',
          showStatus: i === 0 && !!opts.showStatus,
          statusChip: opts.statusChip || ''
        })
      )
    }
    return cards
  }
  cards.push(
    makeSetCard({
      kgText: left.kgText,
      hasKg: left.hasKg,
      plateUnit: left.plateUnit,
      plateClass: left.plateClass,
      name: name,
      detail: detail,
      setsText: opts.setsText || parseSetsFromText(detail) || '1',
      setsLabel: opts.setsLabel || '组',
      tone: opts.tone || left.tone || 'work',
      showStatus: !!opts.showStatus,
      statusChip: opts.statusChip || ''
    })
  )
  return cards
}

/** 技能处方：动作名与做法拆开，避免标题过长 */
function splitSkillNameDetail(chunk) {
  var s = String(chunk || '').trim()
  if (!s) return { name: '技能', detail: '' }

  // 波比节奏 每分钟 6–8 次 × 8′，质量优先
  var mPerMin = s.match(/^(.+?)\s+(每分钟\s*.+)$/i)
  if (mPerMin) {
    return {
      name: shortenSkillName(mPerMin[1]),
      detail: tidySkillDetail(mPerMin[2])
    }
  }

  // 抓举技术 每 90″ × 6 组 · 2 次轻–中
  var mEvery = s.match(/^(.+?)\s+每\s*.*?[×xX]\s*(\d+)\s*组.*?(\d+)\s*次/)
  if (mEvery) {
    return {
      name: shortenSkillName(mEvery[1]),
      detail: mEvery[2] + '×' + mEvery[3]
    }
  }

  var mEveryLoose = s.match(/^(.+?)\s+(每\s*.+)$/)
  if (mEveryLoose && /[组次″'′分]/.test(mEveryLoose[2])) {
    return {
      name: shortenSkillName(mEveryLoose[1]),
      detail: tidySkillDetail(mEveryLoose[2])
    }
  }

  var m = s.match(/^(.+?)\s+(\d+\s*[×xX]\s*\d+.*)$/)
  if (m) {
    return { name: shortenSkillName(m[1]), detail: tidySkillDetail(m[2]) }
  }

  var m2 = s.match(/^(.+?)\s+(\d+\s*组.*)$/)
  if (m2) {
    return { name: shortenSkillName(m2[1]), detail: tidySkillDetail(m2[2]) }
  }

  // 仍过长：按逗号/顿号切，前半作名
  if (s.length > 12) {
    var cut = s.split(/[，,、]/)
    if (cut.length > 1 && cut[0].trim().length >= 2 && cut[0].trim().length <= 12) {
      return {
        name: shortenSkillName(cut[0]),
        detail: tidySkillDetail(cut.slice(1).join('，'))
      }
    }
  }

  return { name: shortenSkillName(s), detail: '' }
}

function shortenSkillName(name) {
  var n = String(name || '').trim()
  // 「波比节奏 / 波比质量」→ 波比，一眼知道练什么
  if (/^波比/.test(n)) return '波比'
  // 「箱上踏步 / 跳箱」取更短一侧
  if (n.indexOf(' / ') >= 0) {
    var parts = n.split(' / ')
    n = parts.sort(function (a, b) {
      return a.length - b.length
    })[0]
  }
  if (n.length > 12) n = n.slice(0, 12)
  return n || '技能'
}

function tidySkillDetail(detail) {
  var d = String(detail || '').trim()
  d = d.replace(/[×xX]\s*(\d+)\s*[′']/g, '共 $1 分钟')
  d = d.replace(/(\d+)\s*[′']/g, '$1 分钟')
  d = d.replace(/\s*，\s*/g, ' · ')
  d = d.replace(/\s+/g, ' ')
  return d
}

/** 训练执行页：白话阶段名（不用技能/WOD 黑话） */
function plainPhaseLabel(block) {
  if (!block) return '训练'
  var kind = String(block.kind || '')
  var role = String(block.role || '')
  var phase = String(block.phase || '')
  var name = String(block.name || '')
  if (kind === 'skill' || role === 'skill' || phase === '技能') return '热身活动'
  if (kind === 'warmup' || phase === '热身') return '热身'
  if (kind === 'accessory') return '辅助动作'
  if (kind === 'strength' || role === 'main' || phase === '力量') return '力量练习'
  if (/AMRAP/i.test(name) || phase === 'AMRAP') return '计时循环'
  if (/EMOM/i.test(name) || phase === 'EMOM') return '每分钟任务'
  if (/For\s*Time/i.test(name) || /for_?time/i.test(String(block.style || ''))) return '限时完成'
  if (kind === 'metcon' || role === 'wod' || phase === 'WOD' || phase === '回合') return '循环训练'
  if (/跑|有氧|划船|骑车|跳绳/.test(name + phase)) return '有氧'
  return '训练'
}

/**
 * 把处方改成「现在要做什么」的白话
 * @returns {string}
 */
function plainHowto(block) {
  if (!block) return '按屏幕计时完成'
  var d = String(block.detail || block.hint || '').trim()
  var name = String(block.name || '')
  var mins = Number(block.minutes) || 0
  var unit = String(block.unit || '')
  var phase = String(block.phase || '')

  // 波比：每分钟 6–8 次 · 共 8 分钟 · 质量优先
  var mPer = d.match(/每分钟\s*(\d+)\s*[–\-〜~]\s*(\d+)\s*次/)
  if (!mPer) mPer = d.match(/每分钟\s*(\d+)\s*次/)
  var mSpan = d.match(/共\s*(\d+)\s*分钟/) || d.match(/(\d+)\s*分钟/)
  var dur = (mSpan && mSpan[1]) || (mins > 0 ? String(mins) : '')
  if (mPer) {
    var lo = mPer[1]
    var hi = mPer[2] || mPer[1]
    var how = hi !== lo ? '每分钟做 ' + lo + '–' + hi + ' 个' : '每分钟做 ' + lo + ' 个'
    if (dur) how += '，连续做 ' + dur + ' 分钟'
    if (/质量|标准/.test(d)) how += '。动作做标准，别赶数量'
    else how += '。按自己节奏完成'
    return how
  }

  // 每组 N 次 / 5×10
  var mEach = d.match(/每组\s*(\d+[–\-〜~]?\d*)\s*次/)
  if (mEach) {
    return '这一组做 ' + mEach[1] + ' 次' + (mins > 0 && unit === '组' ? '' : '')
  }
  var mSets = d.match(/(\d+)\s*[×xX]\s*(\d+[–\-〜~]?\d*)/)
  if (mSets && (unit === '组' || phase === '力量' || block.kind === 'strength')) {
    return '这一组做 ' + mSets[2] + ' 次'
  }

  // AMRAP
  if (/AMRAP/i.test(name) || phase === 'AMRAP') {
    var amrapMin = (name.match(/AMRAP\s*(\d+)/i) || [])[1] || dur || (mins > 0 ? String(mins) : '')
    var moves = d
      .replace(/AMRAP\s*\d+\s*[·:：]?\s*/i, '')
      .replace(/本站约\s*\d+\s*分钟/g, '')
      .replace(/^[·\s]+|[·\s]+$/g, '')
      .trim()
    if (!moves) moves = d
    var out = (amrapMin ? amrapMin + ' 分钟内' : '限定时间内') + '循环做'
    if (moves) out += '：' + moves
    out += '。能做几轮做几轮'
    return out
  }

  // For Time
  if (/For\s*Time/i.test(name) || phase === 'For Time') {
    var cap = dur || (mins > 0 ? String(mins) : '')
    var work = d
      .replace(/For\s*Time/i, '')
      .replace(/时限\s*\d+\s*分/g, '')
      .replace(/^[·\s]+|[·\s]+$/g, '')
      .trim()
    return '尽快做完' + (work ? '：' + work : '') + (cap ? '（最多 ' + cap + ' 分钟）' : '')
  }

  // EMOM / 每分
  if (/EMOM/i.test(name) || phase === 'EMOM' || unit === '分') {
    var line = d.replace(/EMOM\s*\d+\s*[·:：]?\s*/i, '').trim()
    if (/^\d+\s/.test(name) || name.indexOf(' ') < 0) {
      // title already short move; detail may be "EMOM 12 · 8 波比"
      var only = line.replace(/^.*·\s*/, '').trim() || line || name
      return '这一分钟内完成：' + only
    }
    return '这一分钟内完成：' + (line || name)
  }

  // 回合
  if (unit === '回合' || phase === '回合') {
    var round = d.match(/本回合\s*(\d+)\s*个/)
    var n = round ? round[1] : block.kgText
    return '这一回合各动作做 ' + (n || '') + ' 个' + (n ? '' : '指定次数')
  }

  // 清理黑话后的兜底
  var cleaned = d
    .replace(/质量优先/g, '动作标准优先')
    .replace(/本站约\s*(\d+)\s*分钟/g, '大约 $1 分钟')
    .replace(/技术准备[：:]/g, '')
    .replace(/\s*·\s*/g, '，')
    .trim()
  if (cleaned) return cleaned
  if (mins > 0) return '按计时完成，大约 ' + mins + ' 分钟'
  return '按屏幕提示完成'
}

/**
 * 辅助/CF 执行屏文案：练什么、怎么做、进度
 * @returns {{ title: string, phaseLabel: string, howto: string, progressText: string, loadText: string }}
 */
function buildPlainExecView(block, opts) {
  opts = opts || {}
  block = block || {}
  var total = opts.total != null ? opts.total : block.setTotal || 1
  var index = opts.index != null ? opts.index : block.setIndex || 1
  var unit = block.unit || '段'
  var unitWord = unit === '组' ? '组' : unit === '回合' ? '回合' : unit === '分' ? '分钟' : '段'
  var rawName = String(block.name || '')
  var title = rawName || plainPhaseLabel(block)
  var amrapM = rawName.match(/^AMRAP\s*(\d+)$/i)
  if (amrapM) title = amrapM[1] + ' 分钟循环'
  else if (/^For\s*Time$/i.test(rawName)) title = '限时完成'
  else if (/^EMOM\s*(\d+)$/i.test(rawName)) title = '每分钟任务'

  var loadText = ''
  if (block.hasKg && block.kgText) loadText = block.kgText + ' kg'
  else if (block.kg != null && block.kg !== '' && Number(block.kg) > 0) loadText = block.kg + ' kg'
  else if (block.kgLabel) loadText = block.kgLabel

  return {
    title: title,
    phaseLabel: plainPhaseLabel(block),
    howto: plainHowto(block),
    progressText: '第 ' + index + ' / ' + total + ' ' + unitWord,
    loadText: loadText
  }
}

/** 从「技术准备：双力臂 3×3–5」里拆出技能卡 */
function expandSkillHintCards(hint, profile) {
  var s = String(hint || '')
  if (!/^技术准备：/.test(s)) return []
  var body = s.replace(/^技术准备：/, '').trim()
  if (!body) return []
  var chunks = body.split(/[；;]/)
  var out = []
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i].trim()
    if (!chunk) continue
    var split = splitSkillNameDetail(chunk)
    var name = split.name
    var detail = split.detail || chunk
    var left = {
      kgText: '技能',
      hasKg: false,
      plateUnit: '',
      plateClass: 'bw',
      tone: 'warmup'
    }
    var cards = expandSetsToCards({
      name: name,
      detail: detail,
      left: left,
      phase: '技能',
      tone: 'warmup'
    })
    out = out.concat(cards)
  }
  return out
}

/** 「8 波比」→ 标题偏动作名；整行放详情 */
function shortMoveTitle(line) {
  var s = String(line || '').trim()
  if (!s) return '动作'
  // 分 1：8 高翻
  var colon = s.match(/^[分第]?\s*\d+\s*[：:]\s*(.+)$/)
  if (colon) s = colon[1].trim()
  // 8 波比 / 10 空蹲 / 10 卡路里划船
  var m = s.match(/^\d+\s*(.+)$/)
  if (m && m[1] && m[1].length <= 16) return m[1].trim()
  if (s.length > 16) return s.slice(0, 16)
  return s
}

/** EMOM 行「分 1：8 高翻」→ 取冒号后次数 */
function parseEmomLineCount(line) {
  var m = String(line || '').match(/[：:]\s*(\d+)/)
  if (m) return m[1]
  m = String(line || '').match(/(?:^|[^\d])(\d{1,3})\s*(?:次|个|卡)?/)
  return m ? m[1] : ''
}

function parsePctFromText(text) {
  var m = String(text || '').match(/(\d+)\s*[–\-〜~]\s*(\d+)\s*%/)
  if (m) return m[1] + '-' + m[2]
  m = String(text || '').match(/(\d+)\s*%/)
  return m ? m[1] : ''
}

function parseKgFromText(text) {
  var m = String(text || '').match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+(?:\.\d+)?)?\s*kg/i)
  return m ? m[1] : ''
}

/** 有氧/WOD：解析个数（回合、次数、卡路里等） */
function parseCountFromText(text) {
  var s = String(text || '')
  var ladder = s.match(/(\d+)\s*[-–]\s*(\d+)\s*[-–]\s*(\d+)/)
  if (ladder) return ladder[1]
  var range = s.match(/(\d+)\s*[–\-]\s*(\d+)\s*次/)
  if (range) return range[2]
  var times = s.match(/(\d+)\s*次/)
  if (times) return times[1]
  var cal = s.match(/(\d+)\s*卡/)
  if (cal) return cal[1]
  var lead = s.match(/(?:^|[：:·，,\s])(\d{1,3})(?!\s*[%％分钟分′'km])/)
  return lead ? lead[1] : ''
}

function blockDetailText(b) {
  if (!b) return '按计划完成'
  if (b.detail) return b.detail
  if (b.hint) return b.hint
  if (b.setsText) return b.setsText
  if (b.movements && b.movements.length) return b.movements.join(' · ')
  if (b.prescription) return b.prescription
  if (b.cues && b.cues.length) return b.cues.join(' · ')
  return '按计划完成'
}

function formatKm(km) {
  if (km == null || km === '' || isNaN(Number(km))) return ''
  var n = Number(km)
  if (n <= 0) return ''
  return n % 1 === 0 ? String(n) : String(Math.round(n * 10) / 10)
}

/** Zone2 约 6.5′/km，无 distanceKm 时估算 */
function estimateKmFromMinutes(minutes) {
  var m = Number(minutes)
  if (!m || m <= 0) return ''
  return formatKm(Math.round((m / 6.5) * 10) / 10)
}

function isRunLikeBlock(b, session) {
  if (!b) return false
  if (b.distanceKm != null) return true
  var n = (b.name || '') + ' ' + ((session && session.auxId) || '') + ' ' + ((session && session.id) || '')
  return /跑|running|zone2|Zone2/i.test(n) && !/站技/.test(b.name || '')
}

function isStrengthLikeBlock(b) {
  if (!b) return false
  if (b.kind === 'strength' || b.role === 'main') return true
  return /力量|深蹲|卧推|硬拉|高翻|抓举|推举|前蹲|后蹲|杠铃|壶铃|荡壶/i.test(
    b.name || ''
  )
}

function isMetconLikeBlock(b) {
  if (!b) return false
  if (b.kind === 'metcon' || b.role === 'wod') return true
  return /wod|metcon|amrap|emom|for\s*time|回合/i.test(b.name || '')
}

/** AMRAP / EMOM：左侧用时间窗 */
function isTimedMetcon(b) {
  if (!b) return false
  var style = String(b.style || '')
  var name = String(b.name || '')
  if (/^(amrap|emom)$/i.test(style)) return true
  return /\bAMRAP\b|\bEMOM\b/i.test(name)
}

function isEmomMetcon(b) {
  if (!b) return false
  if (/^emom$/i.test(String(b.style || ''))) return true
  return /\bEMOM\b/i.test(String(b.name || ''))
}

function isAmrapMetcon(b) {
  if (!b) return false
  if (/^amrap$/i.test(String(b.style || ''))) return true
  return /\bAMRAP\b/i.test(String(b.name || ''))
}

/** For Time：左侧用时限（有 cap 时） */
function isForTimeMetcon(b) {
  if (!b) return false
  var style = String(b.style || '')
  var name = String(b.name || '')
  if (/for_?time/i.test(style)) return true
  return /for\s*time/i.test(name)
}

function parseMetconMinutes(block, name, text) {
  if (block) {
    if (block.minutes != null && block.minutes !== '') return String(block.minutes)
    if (block.durationMin != null && block.durationMin !== '') return String(block.durationMin)
    if (block.capMin != null && block.capMin !== '') return String(block.capMin)
  }
  var m = String(name || '').match(/(?:AMRAP|EMOM)\s*(\d+)/i)
  if (m) return m[1]
  m = String(text || name || '').match(/(\d+)\s*(?:分钟|分|′|'|min\b)/i)
  return m ? m[1] : ''
}

/** 从「每分钟 6–8 次 × 8′」等文案解析分钟数 */
function parseMinutesFromText(text) {
  var s = String(text || '')
  if (!s) return 0
  var m = s.match(/[×xX]\s*(\d+)\s*[′']/)
  if (m) return Number(m[1]) || 0
  m = s.match(/(\d+)\s*(?:分钟|分)\b/)
  if (m) return Number(m[1]) || 0
  m = s.match(/(?:AMRAP|EMOM)\s*(\d+)/i)
  if (m) return Number(m[1]) || 0
  m = s.match(/(\d+)\s*[′']/)
  if (m) return Number(m[1]) || 0
  return 0
}

/**
 * EMOM 才按「每分钟一行」拆；行数需与分钟数一致，或带「分 1：」标记。
 * AMRAP 整段一个计时，不能把 12 分拆成 3×4 分。
 */
function shouldSplitEmomMinutes(wod, movements, wodMinutes) {
  if (!isEmomMetcon(wod) || !movements || movements.length < 2) return false
  var labeled = 0
  for (var i = 0; i < movements.length; i++) {
    if (/^[分第]?\s*\d+\s*[：:]/.test(String(movements[i] || ''))) labeled++
  }
  if (labeled >= 2) return true
  return movements.length === Math.round(Number(wodMinutes) || 0)
}

/**
 * 左侧主指标：力量→kg/%，跑步→km，AMRAP/EMOM→分，有氧→个数，站技→项数
 */
function resolveLeftMetric(kind, block, text, profile) {
  var t = text || blockDetailText(block)
  var name = (block && block.name) || ''

  if (kind === 'load') {
    var kg = parseKgFromText(t) || parseKgFromText(name)
    if (!kg && block && block.kg != null && block.kg !== '') kg = String(block.kg)
    if (kg) return { kgText: kg, hasKg: true, plateUnit: '', plateClass: '', tone: 'work' }
    var pct = parsePctFromText(t) || parsePctFromText(name)
    if (pct) return { kgText: pct, hasKg: false, plateUnit: '%', plateClass: '', tone: 'peak' }
    if (/壶铃|荡壶|哑铃|绳索|kettlebell/i.test(name)) {
      var est = resolveAccessoryKg(block || { name: name }, profile || null)
      if (est != null) {
        return { kgText: String(est), hasKg: true, plateUnit: '', plateClass: '', tone: 'work' }
      }
    }
    return { kgText: '力量', hasKg: false, plateUnit: '', plateClass: 'bw', tone: 'work' }
  }

  if (kind === 'km') {
    var km =
      formatKm(block && block.distanceKm) ||
      estimateKmFromMinutes(block && (block.minutes != null ? block.minutes : block.durationMin))
    if (km) return { kgText: km, hasKg: false, plateUnit: 'km', plateClass: '', tone: 'work' }
    return { kgText: '跑', hasKg: false, plateUnit: '', plateClass: 'bw', tone: 'body' }
  }

  if (kind === 'min') {
    var mins = parseMetconMinutes(block, name, t)
    if (mins) return { kgText: mins, hasKg: false, plateUnit: '分', plateClass: '', tone: 'work' }
    return { kgText: '计时', hasKg: false, plateUnit: '', plateClass: 'bw', tone: 'body' }
  }

  if (kind === 'count') {
    var count =
      parseCountFromText(name) ||
      parseCountFromText(t) ||
      (block && block.reps != null ? String(block.reps) : '')
    if (count) return { kgText: count, hasKg: false, plateUnit: '个', plateClass: '', tone: 'work' }
    return { kgText: '有氧', hasKg: false, plateUnit: '', plateClass: 'bw', tone: 'body' }
  }

  if (kind === 'station') {
    var sc = block && block.stationCount
    if (sc == null && block && block.picks && block.picks.length) sc = Math.min(2, block.picks.length)
    if (sc == null) {
      var sm = name.match(/(\d+)\s*[–\-]\s*(\d+)/)
      if (sm) sc = sm[2]
    }
    if (sc != null) return { kgText: String(sc), hasKg: false, plateUnit: '项', plateClass: '', tone: 'work' }
    return { kgText: '站', hasKg: false, plateUnit: '', plateClass: 'bw', tone: 'body' }
  }

  return { kgText: '—', hasKg: false, plateUnit: '', plateClass: 'bw', tone: 'body' }
}

/**
 * 构建与今天页一致的 set-card 列表
 * @param {object} input
 * @param {'strength'|'rest'|'aux'} input.type
 * @param {string} [input.layout] main-wod | ''
 * @param {object} [input.main] 力量主项（可已含 kg/scheme）
 * @param {Array} [input.accessories] 力量辅项原始项（含 kg）
 * @param {object} [input.session] CF/调节 session
 * @param {object} [input.profile]
 * @param {boolean} [input.showStatus]
 * @param {string} [input.statusChip]
 * @param {string} [input.mainName] 已格式化主项名（可选）
 * @param {Array} [input.mainSetSheet] 已展开主项组表（可选）
 * @param {Array} [input.accessoryBlocks] 已 formatAccessoryBlock（可选）
 */
function buildSessionCards(input) {
  input = input || {}
  var type = input.type || 'aux'
  var session = input.session || {}
  var profile = input.profile || null
  var showStatus = !!input.showStatus
  var statusChip = input.statusChip || ''
  var layout = input.layout || session.layout || ''

  var isRest = type === 'rest'
  var isStrength = type === 'strength' && !!(input.main || (input.mainSetSheet && input.mainSetSheet.length))
  var isCf = !isRest && !isStrength && layout === 'main-wod' && !!(session.main || input.main)
  var isAux = !isRest && !isStrength && !isCf

  var mainCards = []
  var accCards = []
  var secMainLabel = ''
  var secAccLabel = ''
  var showSetCards = false
  var restNote =
    '今天歇一歇。散散步、活动开髋和脚踝就行，给后面训练留力气。'
  var auxNote = session.closed
    ? session.note || '这周这节先不上'
    : session.note || '按顺序一段段做，动作做标准比赶数量重要'

  if (isRest) {
    return {
      isRest: true,
      isStrength: false,
      isCf: false,
      isAux: false,
      showSetCards: false,
      secMainLabel: '休息日',
      secAccLabel: '',
      mainCards: [],
      accCards: [],
      restNote: restNote,
      auxNote: '',
      mainName: '轻松恢复'
    }
  }

  if (isStrength) {
    showSetCards = true
    secMainLabel = '今天主练'
    secAccLabel = '后面几个动作'
    var mainName = input.mainName || copy.moveName((input.main && input.main.name) || '')
    var mainSetSheet = input.mainSetSheet
    if (!mainSetSheet) mainSetSheet = formatMainSetSheet(input.main || {})
    var accessories = input.accessoryBlocks
    if (!accessories) {
      accessories = (input.accessories || []).map(function (a) {
        return formatAccessoryBlock(a)
      })
    }
    for (var si = 0; si < mainSetSheet.length; si++) {
      var row = mainSetSheet[si]
      var detailParts = []
      if (row.phase) detailParts.push(row.phase)
      if (row.repsText) detailParts.push('每组 ' + row.repsText + ' 次')
      var hasKg = row.kgText !== '—' && row.kgText !== ''
      mainCards.push(
        makeSetCard({
          kgText: row.kgText,
          hasKg: hasKg,
          plateClass: hasKg ? '' : 'bw',
          name: mainName,
          detail: detailParts.join(' · ') || '按计划完成',
          setsText: '1',
          setsLabel: '组',
          tone: row.tone || 'work',
          showStatus: si === 0 && showStatus,
          statusChip: statusChip
        })
      )
    }
    for (var ai = 0; ai < accessories.length; ai++) {
      var acc = accessories[ai]
      var accLeft
      if (acc.kg != null) {
        accLeft = {
          kgText: String(acc.kg),
          hasKg: true,
          plateUnit: '',
          plateClass: '',
          tone: 'work'
        }
      } else {
        accLeft = {
          kgText: '自重',
          hasKg: false,
          plateUnit: '',
          plateClass: 'bw',
          tone: 'body'
        }
      }
      var setsN = parseInt(acc.sets, 10)
      if (!setsN || setsN < 1) setsN = 1
      if (setsN > 16) setsN = 16
      var accDetail =
        acc.reps !== '—' && acc.reps !== ''
          ? '每组 ' + acc.reps + ' 次'
          : '按感觉完成'
      for (var as = 0; as < setsN; as++) {
        accCards.push(
          makeSetCard({
            kgText: accLeft.kgText,
            hasKg: accLeft.hasKg,
            plateUnit: accLeft.plateUnit,
            plateClass: accLeft.plateClass,
            name: acc.name,
            detail: accDetail,
            setsText: '1',
            setsLabel: '组',
            tone: accLeft.tone || 'body'
          })
        )
      }
    }
  } else if (isCf && !session.closed) {
    showSetCards = true
    secMainLabel = '今天主练'
    secAccLabel = '后面几个动作'
    var cfMain = session.main || input.main || {}
    var cfDetail = blockDetailText(cfMain)
    // 技能准备（若有）先拆成组卡
    mainCards = mainCards.concat(expandSkillHintCards(cfMain.hint || '', profile))
    var cfLeft = resolveLeftMetric('load', cfMain, cfDetail, profile)
    mainCards = mainCards.concat(
      expandSetsToCards({
        name: cfMain.name || '力量',
        detail: cfDetail,
        left: cfLeft,
        phase: '力量',
        showStatus: showStatus && !mainCards.length,
        statusChip: statusChip,
        tone: cfLeft.tone || 'work'
      })
    )
    if (mainCards.length && showStatus) {
      mainCards[0].showStatus = true
      mainCards[0].statusChip = statusChip
    }

    var cfAcc = session.accessories || input.accessories || []
    for (var ci = 0; ci < cfAcc.length; ci++) {
      var wod = cfAcc[ci]
      var wodDetail = blockDetailText(wod)
      var wodName = wod.name || 'WOD'
      var ladder = parseLadderRounds(wodName + ' ' + wodDetail)
      var movements = wod.movements || []
      var moveText =
        movements.length > 0
          ? movements.join(' · ')
          : wodDetail.replace(/^\d+\s*[-–]\s*\d+\s*[-–]\s*\d+\s*(For\s*Time)?/i, '').trim() ||
            wodDetail

      // 力量向辅项：按组拆开
      if (isStrengthLikeBlock(wod) && parseCfSetsReps(wodDetail)) {
        var strLeft = resolveLeftMetric('load', wod, wodDetail, profile)
        accCards = accCards.concat(
          expandSetsToCards({
            name: wodName,
            detail: wodDetail,
            left: strLeft,
            phase: '力量',
            tone: strLeft.tone || 'work'
          })
        )
        continue
      }

      // 21-15-9：每个回合一张卡
      if (ladder) {
        for (var li = 0; li < ladder.length; li++) {
          accCards.push(
            makeSetCard({
              kgText: ladder[li],
              hasKg: false,
              plateUnit: '个',
              plateClass: '',
              name: (moveText ? shortMoveTitle(moveText.split(' · ')[0]) : '') || '回合',
              detail: wodName + ' · 本回合 ' + ladder[li] + ' 个',
              setsText: ladder[li],
              setsLabel: '个',
              tone: 'work'
            })
          )
        }
        continue
      }

      // 仅 EMOM 且「每分钟一行」时拆卡；AMRAP 保持整段时长
      var wodMinsPreview =
        Number(wod.minutes || wod.capMin || wod.durationMin) ||
        Number(parseMetconMinutes(wod, wodName, wodDetail)) ||
        12
      if (shouldSplitEmomMinutes(wod, movements, wodMinsPreview)) {
        for (var mi = 0; mi < movements.length; mi++) {
          var line = String(movements[mi] || '')
          var lineCount = parseEmomLineCount(line)
          accCards.push(
            makeSetCard({
              kgText: '1',
              hasKg: false,
              plateUnit: '分',
              plateClass: 'bw',
              name: shortMoveTitle(line),
              detail: wodName + (line ? ' · ' + line : ''),
              setsText: '1',
              setsLabel: '分',
              tone: 'body'
            })
          )
        }
        continue
      }

      var wodKind = 'count'
      if (isStrengthLikeBlock(wod)) wodKind = 'load'
      else if (isTimedMetcon(wod)) wodKind = 'min'
      else if (isForTimeMetcon(wod) && wod.capMin) wodKind = 'min'
      var wodLeft = resolveLeftMetric(wodKind, wod, wodName + ' ' + wodDetail, profile)
      var wodMinText =
        wod.minutes != null
          ? String(wod.minutes)
          : parseMetconMinutes(wod, wodName, wodDetail) || parseSetsFromText(wodDetail) || '1'
      accCards.push(
        makeSetCard({
          kgText: wodKind === 'min' ? wodMinText : wodLeft.kgText,
          hasKg: wodKind === 'min' ? false : wodLeft.hasKg,
          plateUnit: wodKind === 'min' ? '分' : wodLeft.plateUnit,
          plateClass: wodKind === 'min' ? 'bw' : wodLeft.plateClass,
          name: wodName,
          detail: moveText || wodDetail,
          setsText: wodMinText,
          setsLabel: wodKind === 'min' ? '分' : '组',
          tone: wodLeft.tone || 'body'
        })
      )
    }
  } else if (isAux && !session.closed) {
    showSetCards = true
    secMainLabel = session.name || '调节'
    var blocks = session.blocks || []
    var auxId = session.auxId || ''
    for (var bi = 0; bi < blocks.length; bi++) {
      var blk = blocks[bi]
      var blkName = blk.name || '段落'
      if (blk.kindLabel) blkName = blk.kindLabel + ' · ' + blk.name
      var mins = blk.minutes != null ? blk.minutes : blk.durationMin
      var blkText = blockDetailText(blk)
      var leftKind = 'count'
      if (isRunLikeBlock(blk, session) || auxId === 'running') leftKind = 'km'
      else if (/站技|站/.test(blk.name || '') || blk.stationCount != null || (blk.picks && blk.picks.length))
        leftKind = 'station'
      else if (isStrengthLikeBlock(blk)) leftKind = 'load'
      else if (isMetconLikeBlock(blk)) leftKind = 'count'
      else if (auxId === 'hyrox' && /跑|收尾|过渡/.test(blk.name || '')) leftKind = 'km'
      else if (auxId === 'athx' && /有氧|轻松跑|划/.test(blk.name || '')) leftKind = 'km'
      var blkLeft = resolveLeftMetric(leftKind, blk, blkText, profile)
      var setParsed = parseCfSetsReps(blkText + ' ' + (blk.prescription || '') + ' ' + (blk.name || ''))
      if (setParsed && setParsed.sets > 1) {
        mainCards = mainCards.concat(
          expandSetsToCards({
            name: blkName,
            detail: setParsed.sets + '×' + setParsed.repsText,
            left: blkLeft,
            phase: '',
            showStatus: bi === 0 && showStatus && !mainCards.length,
            statusChip: statusChip,
            tone: blkLeft.tone || 'body'
          })
        )
        continue
      }
      mainCards.push(
        makeSetCard({
          kgText: blkLeft.kgText,
          hasKg: blkLeft.hasKg,
          plateUnit: blkLeft.plateUnit,
          plateClass: blkLeft.plateClass,
          name: blkName,
          detail: blkText,
          setsText: mins != null && mins !== '' ? mins : '—',
          setsLabel: '分',
          tone: blkLeft.tone || 'body',
          showStatus: bi === 0 && showStatus && !mainCards.length,
          statusChip: statusChip
        })
      )
    }
  }

  return {
    isRest: false,
    isStrength: isStrength,
    isCf: isCf,
    isAux: isAux,
    showSetCards: showSetCards,
    secMainLabel: secMainLabel,
    secAccLabel: secAccLabel,
    mainCards: mainCards,
    accCards: accCards,
    restNote: restNote,
    auxNote: auxNote,
    mainName: input.mainName || ''
  }
}

/** 周期详情：按周槽位生成与今天页一致的卡片数据 */
function buildCycleDayCards(profile, week, slot, slots, slotIndex) {
  var copyProfile = Object.assign({}, profile || {}, { currentWeek: week })
  if (!slot) {
    return buildSessionCards({ type: 'rest', profile: copyProfile })
  }
  if (slot.type === 'strength') {
    var day = getStrengthDay(copyProfile, slot)
    if (!day || !day.main) {
      return buildSessionCards({
        type: 'strength',
        main: { name: slot.label || '力量', sets: 0, reps: '' },
        accessories: [],
        profile: copyProfile
      })
    }
    return buildSessionCards({
      type: 'strength',
      main: day.main,
      accessories: day.accessories || [],
      profile: copyProfile
    })
  }
  if (slot.type === 'rest') {
    return buildSessionCards({ type: 'rest', profile: copyProfile })
  }
  var aux = getAuxSession(slot, copyProfile, slots, slotIndex)
  var session = (aux && aux.session) || null
  if (!session) {
    return buildSessionCards({
      type: 'aux',
      session: { name: slot.label || '调节', blocks: [], closed: false },
      profile: copyProfile
    })
  }
  return buildSessionCards({
    type: 'aux',
    layout: session.layout || '',
    session: session,
    profile: copyProfile
  })
}

/**
 * 普通辅助日执行段：有 N×R 的按组拆；纯计时段保持一段。
 */
function expandAuxExecutionBlocks(session) {
  session = session || {}
  if (session.closed) return []
  var raw = session.blocks || []
  var out = []
  for (var i = 0; i < raw.length; i++) {
    var blk = raw[i] || {}
    var text = blockDetailText(blk) + ' ' + (blk.prescription || '') + ' ' + (blk.name || '')
    var parsed = parseCfSetsReps(text)
    var mins = Number(blk.minutes != null ? blk.minutes : blk.durationMin) || 5
    if (parsed && parsed.sets > 1) {
      var each = Math.max(1, Math.round((mins / parsed.sets) * 10) / 10)
      for (var s = 0; s < parsed.sets; s++) {
        out.push(
          Object.assign({}, blk, {
            detail: '每组 ' + parsed.repsText + ' 次',
            minutes: each,
            setIndex: s + 1,
            setTotal: parsed.sets,
            unit: '组',
            modeHint: 'set'
          })
        )
      }
    } else {
      out.push(
        Object.assign({}, blk, {
          setIndex: 1,
          setTotal: 1,
          unit: '段',
          modeHint: /metcon|for time|amrap|emom/i.test(blk.name || '') ? 'up' : 'down'
        })
      )
    }
  }
  return out
}

/**
 * CF 执行段：与今日/周期预览卡同一套拆组规则，供训练页逐步对照。
 * @returns {Array<object>}
 */
function expandCfExecutionBlocks(session, profile) {
  session = session || {}
  if (session.closed) return []
  var blocks = []
  var cfMain = session.main || {}
  var cfDetail = blockDetailText(cfMain)
  var mainBudget = Number(cfMain.minutes) || 15
  var skillHint = String(cfMain.hint || '')

  function pushSetBlocks(list, base) {
    var n = list.length || 1
    var eachMin = Math.max(1.5, Math.round((base.budgetMin / n) * 10) / 10)
    for (var i = 0; i < list.length; i++) {
      var card = list[i]
      blocks.push({
        name: card.name,
        detail: card.detail,
        kind: base.kind,
        kindLabel: base.kindLabel,
        role: base.role,
        phase: base.phase,
        minutes: eachMin,
        kg: base.kg != null ? base.kg : null,
        kgText: card.kgText || '',
        hasKg: !!card.hasKg,
        plateUnit: card.plateUnit || '',
        setIndex: i + 1,
        setTotal: n,
        unit: base.unit || '组',
        modeHint: base.modeHint || ''
      })
    }
  }

  // 技能：计时跟处方分钟走（如 × 8′），不再用估算值拆错时长
  var skillCards = expandSkillHintCards(skillHint, profile)
  if (skillCards.length) {
    var skillBudget =
      parseMinutesFromText(skillHint) ||
      Math.min(10, Math.max(4, skillCards.length * 1.5))
    mainBudget = Math.max(8, (Number(cfMain.minutes) || 15) - skillBudget)
    // 技能多为整段练习（波比节奏 8′），单卡用满时长；多卡才均分
    if (skillCards.length === 1) {
      blocks.push({
        name: skillCards[0].name,
        detail: skillCards[0].detail,
        kind: 'skill',
        kindLabel: '技能',
        role: 'skill',
        phase: '技能',
        minutes: skillBudget,
        kg: null,
        kgText: skillCards[0].kgText || '',
        hasKg: !!skillCards[0].hasKg,
        plateUnit: skillCards[0].plateUnit || '',
        setIndex: 1,
        setTotal: 1,
        unit: '段',
        modeHint: 'down'
      })
    } else {
      pushSetBlocks(skillCards, {
        kind: 'skill',
        kindLabel: '技能',
        role: 'skill',
        phase: '技能',
        budgetMin: skillBudget,
        unit: '组',
        modeHint: 'set'
      })
    }
  }

  // 主项力量：组间推进用固定作业窗，不把「本站 12 分」拆成每组 2.4 分
  var cfLeft = resolveLeftMetric('load', cfMain, cfDetail, profile)
  var mainCards = expandSetsToCards({
    name: cfMain.name || '力量',
    detail: cfDetail,
    left: cfLeft,
    phase: '力量',
    tone: cfLeft.tone || 'work'
  })
  var strengthWorkMin = 2
  for (var si = 0; si < mainCards.length; si++) {
    var sc = mainCards[si]
    blocks.push({
      name: sc.name,
      detail:
        (sc.detail || '') +
        (mainBudget ? (sc.detail ? ' · ' : '') + '本站约 ' + mainBudget + ' 分钟' : ''),
      kind: 'strength',
      kindLabel: '力量',
      role: 'main',
      phase: '力量',
      minutes: strengthWorkMin,
      kg: cfMain.kg != null ? cfMain.kg : null,
      kgText: sc.kgText || '',
      hasKg: !!sc.hasKg,
      plateUnit: sc.plateUnit || '',
      setIndex: si + 1,
      setTotal: mainCards.length || 1,
      unit: '组',
      modeHint: 'set'
    })
  }

  var cfAcc = session.accessories || []
  for (var ci = 0; ci < cfAcc.length; ci++) {
    var wod = cfAcc[ci]
    var wodDetail = blockDetailText(wod)
    var wodName = wod.name || 'WOD'
    var wodMinutes = Number(wod.minutes || wod.capMin || wod.durationMin) || 12
    var ladder = parseLadderRounds(wodName + ' ' + wodDetail)
    var movements = wod.movements || []
    var moveText =
      movements.length > 0
        ? movements.join(' · ')
        : wodDetail.replace(/^\d+\s*[-–]\s*\d+\s*[-–]\s*\d+\s*(For\s*Time)?/i, '').trim() ||
          wodDetail

    if (isStrengthLikeBlock(wod) && parseCfSetsReps(wodDetail)) {
      var strLeft = resolveLeftMetric('load', wod, wodDetail, profile)
      var strCards = expandSetsToCards({
        name: wodName,
        detail: wodDetail,
        left: strLeft,
        phase: '力量',
        tone: strLeft.tone || 'work'
      })
      for (var wi = 0; wi < strCards.length; wi++) {
        var wc = strCards[wi]
        blocks.push({
          name: wc.name,
          detail: (wc.detail || '') + ' · 本站约 ' + wodMinutes + ' 分钟',
          kind: 'strength',
          kindLabel: '力量',
          role: 'wod',
          phase: '力量',
          minutes: 2,
          kg: wod.kg != null ? wod.kg : null,
          kgText: wc.kgText || '',
          hasKg: !!wc.hasKg,
          plateUnit: wc.plateUnit || '',
          setIndex: wi + 1,
          setTotal: strCards.length || 1,
          unit: '组',
          modeHint: 'set'
        })
      }
      continue
    }

    // 21-15-9：正计时完成各回合，不均分总时限到每回合倒计时
    if (ladder) {
      for (var li = 0; li < ladder.length; li++) {
        blocks.push({
          name: shortMoveTitle((moveText || '').split(' · ')[0]) || '回合 ' + ladder[li],
          detail:
            wodName +
            ' · 本回合 ' +
            ladder[li] +
            ' 个' +
            (moveText ? ' · ' + moveText : '') +
            (wodMinutes ? ' · 时限 ' + wodMinutes + ' 分' : ''),
          kind: 'metcon',
          kindLabel: 'WOD',
          role: 'wod',
          phase: '回合',
          minutes: wodMinutes,
          kg: null,
          kgText: ladder[li],
          hasKg: false,
          plateUnit: '个',
          setIndex: li + 1,
          setTotal: ladder.length,
          unit: '回合',
          modeHint: 'up'
        })
      }
      continue
    }

    // EMOM：每分 1 分钟；AMRAP：整段一个计时（与计划分钟一致）
    if (shouldSplitEmomMinutes(wod, movements, wodMinutes)) {
      for (var mi = 0; mi < movements.length; mi++) {
        var line = String(movements[mi] || '')
        blocks.push({
          name: shortMoveTitle(line),
          detail: wodName + (line ? ' · ' + line : ''),
          kind: 'metcon',
          kindLabel: 'WOD',
          role: 'wod',
          phase: 'EMOM',
          minutes: 1,
          kg: null,
          kgText: '1',
          hasKg: false,
          plateUnit: '分',
          setIndex: mi + 1,
          setTotal: movements.length,
          unit: '分',
          modeHint: 'down'
        })
      }
      continue
    }

    var wodTitle = wodName
    var wodDetailLine = moveText || wodDetail
    if (isAmrapMetcon(wod) && movements.length) {
      wodTitle = wodName
      wodDetailLine = movements.join(' · ')
    }

    blocks.push({
      name: wodTitle,
      detail: wodDetailLine,
      kind: 'metcon',
      kindLabel: 'WOD',
      role: 'wod',
      phase: isAmrapMetcon(wod) ? 'AMRAP' : isEmomMetcon(wod) ? 'EMOM' : 'WOD',
      minutes: wodMinutes,
      kg: null,
      kgText: String(wodMinutes),
      hasKg: false,
      plateUnit: '分',
      setIndex: 1,
      setTotal: 1,
      unit: '段',
      modeHint: isTimedMetcon(wod) || isForTimeMetcon(wod) ? 'up' : 'down'
    })
  }

  return blocks
}

module.exports = {
  makeSetCard: makeSetCard,
  formatAccessoryBlock: formatAccessoryBlock,
  blockDetailText: blockDetailText,
  resolveLeftMetric: resolveLeftMetric,
  buildSessionCards: buildSessionCards,
  buildCycleDayCards: buildCycleDayCards,
  expandCfExecutionBlocks: expandCfExecutionBlocks,
  expandAuxExecutionBlocks: expandAuxExecutionBlocks,
  parseCfSetsReps: parseCfSetsReps,
  buildPlainExecView: buildPlainExecView,
  plainHowto: plainHowto,
  plainPhaseLabel: plainPhaseLabel
}
