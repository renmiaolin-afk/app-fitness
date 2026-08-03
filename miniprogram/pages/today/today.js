const storage = require('../../utils/storage')
const { fetchWechatUserProfile } = require('../../utils/wechat-user')
const { buildTodayView, resolveAccessoryKg } = require('../../services/plan')
const copy = require('../../utils/copy')
const {
  BODY_OPTIONS,
  applyStrengthAdjustments,
  resolveAdjustments
} = require('../../services/ready-adjust')
const { formatMainSetSheet } = require('../../services/warmup-sets')

const BODY_KEY = 'af_today_body'
const FULL_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function loadBodyForToday() {
  try {
    var saved = wx.getStorageSync(BODY_KEY)
    var today = new Date().toISOString().slice(0, 10)
    if (saved && saved.date === today && saved.body) return saved.body
  } catch (e) {}
  return 'normal'
}

function saveBodyForToday(body) {
  wx.setStorageSync(BODY_KEY, {
    date: new Date().toISOString().slice(0, 10),
    body: body || 'normal'
  })
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

function makeSetCard(opts) {
  var hasUnit = !!(opts.hasKg || opts.plateUnit)
  return {
    kgText: opts.kgText || '',
    hasKg: !!opts.hasKg,
    plateUnit: opts.plateUnit || '',
    plateClass: opts.plateClass != null ? opts.plateClass : hasUnit ? '' : 'body',
    name: opts.name || '',
    detail: opts.detail || '',
    setsText: opts.setsText != null ? String(opts.setsText) : '',
    setsLabel: opts.setsLabel || '组',
    tone: opts.tone || 'work',
    showStatus: !!opts.showStatus,
    statusChip: opts.statusChip || ''
  }
}

function parseSetsFromText(text) {
  var m = String(text || '').match(/(\d+)\s*[×xX]/)
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
  var lead = s.match(/(?:^|[：:·，,\s])(\d{1,3})(?!\s*[%％分钟分′'km])/ )
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

/**
 * 左侧主指标：力量→kg/%，跑步→km，AMRAP/EMOM→分，有氧→个数，站技→项数
 */
function resolveLeftMetric(kind, block, text) {
  var t = text || blockDetailText(block)
  var name = (block && block.name) || ''

  if (kind === 'load') {
    var kg = parseKgFromText(t) || parseKgFromText(name)
    if (!kg && block && block.kg != null && block.kg !== '') kg = String(block.kg)
    if (kg) return { kgText: kg, hasKg: true, plateUnit: '', plateClass: '', tone: 'work' }
    var pct = parsePctFromText(t) || parsePctFromText(name)
    if (pct) return { kgText: pct, hasKg: false, plateUnit: '%', plateClass: '', tone: 'peak' }
    // 壶铃/哑铃/绳索等：无处方重量时用建议 kg
    if (/壶铃|荡壶|哑铃|绳索|kettlebell/i.test(name)) {
      var est = resolveAccessoryKg(
        block || { name: name },
        typeof storage !== 'undefined' ? storage.getProfile() : null
      )
      if (est != null) {
        return { kgText: String(est), hasKg: true, plateUnit: '', plateClass: '', tone: 'work' }
      }
    }
    return { kgText: '力量', hasKg: false, plateUnit: '', plateClass: 'body', tone: 'work' }
  }

  if (kind === 'km') {
    var km =
      formatKm(block && block.distanceKm) ||
      estimateKmFromMinutes(block && (block.minutes != null ? block.minutes : block.durationMin))
    if (km) return { kgText: km, hasKg: false, plateUnit: 'km', plateClass: '', tone: 'work' }
    return { kgText: '跑', hasKg: false, plateUnit: '', plateClass: 'body', tone: 'body' }
  }

  if (kind === 'min') {
    var mins = parseMetconMinutes(block, name, t)
    if (mins) return { kgText: mins, hasKg: false, plateUnit: '分', plateClass: '', tone: 'work' }
    return { kgText: '计时', hasKg: false, plateUnit: '', plateClass: 'body', tone: 'body' }
  }

  if (kind === 'count') {
    var count =
      parseCountFromText(name) ||
      parseCountFromText(t) ||
      (block && block.reps != null ? String(block.reps) : '')
    if (count) return { kgText: count, hasKg: false, plateUnit: '个', plateClass: '', tone: 'work' }
    return { kgText: '有氧', hasKg: false, plateUnit: '', plateClass: 'body', tone: 'body' }
  }

  if (kind === 'station') {
    var sc = block && block.stationCount
    if (sc == null && block && block.picks && block.picks.length) sc = Math.min(2, block.picks.length)
    if (sc == null) {
      var sm = name.match(/(\d+)\s*[–\-]\s*(\d+)/)
      if (sm) sc = sm[2]
    }
    if (sc != null) return { kgText: String(sc), hasKg: false, plateUnit: '项', plateClass: '', tone: 'work' }
    return { kgText: '站', hasKg: false, plateUnit: '', plateClass: 'body', tone: 'body' }
  }

  return { kgText: '—', hasKg: false, plateUnit: '', plateClass: 'body', tone: 'body' }
}

function buildUi(view, draft, completedToday, body) {
  const slot = view.slot || {}
  const detail = view.detail || {}
  const isRest = slot.type === 'rest'
  const isStrength = slot.type === 'strength' && detail.main
  const session = detail.session || {}
  const isCf = !isRest && !isStrength && session.layout === 'main-wod' && session.main
  const isAux = !isRest && !isStrength && !isCf
  const mainBase = detail.main || {}
  let ctaText = '开始训练'
  let statusChip = '未开始'
  if (draft) {
    ctaText = '继续未完成课次'
    statusChip = '训练中'
  } else if (completedToday) {
    ctaText = '再练一次'
    statusChip = '已完成'
  }
  let cardTitle = isRest ? '休息日' : ''
  // 「未开始」是默认态，不展示；休息日也不显示状态标签
  var showStatus = !isRest && statusChip !== '未开始'

  var mainName = copy.moveName(mainBase.name)
  var mainSetSheet = isStrength ? formatMainSetSheet(mainBase) : []
  var mainSetsText = isStrength
    ? ''
    : copy.setsRepsLoad(mainBase.sets, mainBase.reps, mainBase.kg)
  var accessories = (detail.accessories || []).map(function (a) {
    return formatAccessoryBlock(a)
  })
  var adjustNote = ''
  var showBodyAdjust = !!(isStrength && view.isToday && !draft)

  if (isStrength && view.isToday) {
    var applied = applyStrengthAdjustments(detail, body || 'normal')
    if (applied.main) {
      mainName = copy.moveName(applied.main.name)
      mainSetSheet = formatMainSetSheet(applied.main)
      accessories = (applied.accessories || []).map(function (a) {
        return formatAccessoryBlock(a)
      })
      adjustNote = applied.note || ''
    }
  }

  // 统一卡片：左图 + 动作/内容 + 右侧数量
  var mainCards = []
  var accCards = []
  var secMainLabel = ''
  var secAccLabel = ''
  var showSetCards = false

  if (isStrength) {
    showSetCards = true
    secMainLabel = '主项'
    secAccLabel = '辅项'
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
          plateClass: hasKg ? '' : 'body',
          name: mainName,
          detail: detailParts.join(' · ') || '按计划完成',
          setsText: row.countText || '1',
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
          plateClass: 'body',
          tone: 'body'
        }
      }
      accCards.push(
        makeSetCard({
          kgText: accLeft.kgText,
          hasKg: accLeft.hasKg,
          plateUnit: accLeft.plateUnit,
          plateClass: accLeft.plateClass,
          name: acc.name,
          detail: acc.reps !== '—' ? '每组 ' + acc.reps + ' 次' : '按感觉完成',
          setsText: acc.sets !== '—' ? acc.sets : '1',
          setsLabel: '组',
          tone: accLeft.tone || 'body'
        })
      )
    }
  } else if (isCf && !session.closed) {
    showSetCards = true
    secMainLabel = '主项'
    secAccLabel = '辅项'
    var cfMain = session.main || {}
    var cfDetail = blockDetailText(cfMain)
    var cfSets = parseSetsFromText(cfDetail)
    var cfLeft = resolveLeftMetric('load', cfMain, cfDetail)
    mainCards.push(
      makeSetCard({
        kgText: cfLeft.kgText,
        hasKg: cfLeft.hasKg,
        plateUnit: cfLeft.plateUnit,
        plateClass: cfLeft.plateClass,
        name: cfMain.name || '力量',
        detail: cfDetail,
        setsText: cfSets || (cfMain.minutes != null ? cfMain.minutes : ''),
        setsLabel: cfSets ? '组' : '分',
        tone: cfLeft.tone || 'work',
        showStatus: showStatus,
        statusChip: statusChip
      })
    )
    var cfAcc = session.accessories || []
    for (var ci = 0; ci < cfAcc.length; ci++) {
      var wod = cfAcc[ci]
      var wodDetail = blockDetailText(wod)
      var wodKind = 'count'
      if (isStrengthLikeBlock(wod)) wodKind = 'load'
      else if (isTimedMetcon(wod)) wodKind = 'min'
      // For Time：左侧仍用回合/个数（如 21）；有独立时限时再走分钟
      else if (isForTimeMetcon(wod) && wod.capMin && !/\d+\s*[-–]\s*\d+\s*[-–]\s*\d+/.test(wod.name || ''))
        wodKind = 'min'
      var wodLeft = resolveLeftMetric(wodKind, wod, wod.name + ' ' + wodDetail)
      // 左侧已是分钟时，右侧不再重复时长
      var rightNum = '—'
      var rightLabel = ''
      if (wodKind === 'min') {
        rightNum = '—'
        rightLabel = ''
      } else if (wod.minutes != null && wod.minutes !== '') {
        rightNum = String(wod.minutes)
        rightLabel = '分'
      } else {
        var ladder = parseCountFromText(wod.name || '')
        if (ladder) {
          rightNum = ladder
          rightLabel = '个'
        }
      }
      accCards.push(
        makeSetCard({
          kgText: wodLeft.kgText,
          hasKg: wodLeft.hasKg,
          plateUnit: wodLeft.plateUnit,
          plateClass: wodLeft.plateClass,
          name: wod.name || 'WOD',
          detail: wodDetail,
          setsText: rightNum,
          setsLabel: rightLabel,
          tone: wodLeft.tone || 'body'
        })
      )
    }
  } else if (isAux && !session.closed) {
    showSetCards = true
    secMainLabel = session.name || copy.slotLabel(slot.label) || '调节'
    var blocks = session.blocks || []
    var auxId = session.auxId || slot.key || ''
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
      var blkLeft = resolveLeftMetric(leftKind, blk, blkText)
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
          showStatus: bi === 0 && showStatus,
          statusChip: statusChip
        })
      )
    }
  }

  const auxNote = session.closed
    ? session.note || '本周不安排此课'
    : session.note || '按段落顺序完成，动作质量优先'

  return {
    isRest: isRest,
    isStrength: isStrength,
    isCf: isCf,
    isAux: isAux,
    showSetCards: showSetCards,
    showStart: view.isToday && !isRest,
    showRestActions: view.isToday && isRest,
    showPreviewHint: !view.isToday,
    showBodyAdjust: showBodyAdjust,
    cardTitle: cardTitle,
    showStatus: showStatus,
    phaseText: view.phase || '',
    mainName: mainName,
    mainSetSheet: mainSetSheet,
    mainSetsText: mainSetsText,
    accessories: accessories,
    secMainLabel: secMainLabel,
    secAccLabel: secAccLabel,
    mainCards: mainCards,
    accCards: accCards,
    adjustNote: adjustNote,
    restNote: '今日不安排力量与高强度训练。完成 20–30 分钟 Zone2 步行 + 髋踝活动度，保证下周训练质量。',
    auxName: session.name || copy.slotLabel(slot.label) || '调节课',
    auxDuration: session.durationMin || 30,
    auxDurationText: session.closed ? '休' : (session.durationMin || 30) + ' 分钟',
    auxNote: auxNote,
    auxClosed: !!session.closed,
    ctaText: ctaText,
    statusChip: statusChip,
    hasDraft: !!draft,
    draftSummary: (draft && draft.summary) || '存在未完成课次，可从中断处继续',
    slots: (view.slots || []).map(function (s, i) {
      var wd = Number(s.weekday) || i + 1
      return {
        weekday: s.weekday,
        dayLabel: FULL_WEEKDAY_LABELS[wd - 1] || s.dayLabel,
        label: copy.slotLabelShort(s.label),
        active: i === view.selectedIndex
      }
    })
  }
}

Page({
  behaviors: [require('../../behaviors/immersive-nav')],
  data: {
    ready: false,
    cycleName: '',
    week: 1,
    phase: '',
    goalText: '目标：三大项成绩',
    selectedIndex: 0,
    ui: {},
    viewIsToday: true,
    body: 'normal',
    bodyOptions: BODY_OPTIONS,
    moveSheetShow: false,
    moveSheetName: '',
    avatarUrl: ''
  },

  onShow() {
    const profile = storage.getProfile()
    if (!profile || !profile.planId) {
      wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
      return
    }
    this.refresh(this._selectedIndex)
  },

  onHide() {
    if (this.data.moveSheetShow) {
      this.setData({ moveSheetShow: false })
    }
  },

  refresh(selectedIndex) {
    const profile = storage.getProfile()
    const view = buildTodayView(profile, selectedIndex)
    this._selectedIndex = view.selectedIndex
    const draftRaw = storage.getDraft()
    const todayKey = new Date().toISOString().slice(0, 10)
    const logs = storage.getLogs()
    const weekday = view.slots[view.selectedIndex] && view.slots[view.selectedIndex].weekday
    // 进行中只挂在草稿对应的那一天，不串到周历其他日
    var draft = null
    if (draftRaw && draftRaw.date === todayKey) {
      if (draftRaw.weekday == null || draftRaw.weekday === '') {
        draft = view.isToday ? draftRaw : null
      } else if (Number(draftRaw.weekday) === Number(weekday)) {
        draft = draftRaw
      }
    }
    const completedToday = logs.some(function (l) {
      return l.date === todayKey && Number(l.weekday) === Number(weekday)
    })
    const body = loadBodyForToday()
    const ui = buildUi(view, draft, completedToday, body)
    this._view = view
    this.setData({
      ready: true,
      cycleName: view.cycleName,
      week: view.week,
      phase: view.phase,
      goalText: '目标：三大项成绩',
      selectedIndex: view.selectedIndex,
      viewIsToday: view.isToday,
      slotType: view.slot.type,
      draft: draft,
      body: body,
      ui: ui,
      avatarUrl: (profile && profile.avatarUrl) || ''
    })
  },

  pickBody(e) {
    if (!this.data.ui.showBodyAdjust) return
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.body) return
    saveBodyForToday(id)
    this.setData({ body: id })
    this.refresh(this.data.selectedIndex)
  },

  goMe() {
    fetchWechatUserProfile(function () {
      wx.navigateTo({ url: '/pages/me/me' })
    })
  },

  openMoveSheet(e) {
    const name = e.currentTarget.dataset.name
    if (!name) return
    this.setData({
      moveSheetShow: true,
      moveSheetName: name
    })
  },

  closeMoveSheet() {
    this.setData({ moveSheetShow: false })
  },

  selectDay(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.refresh(index)
  },

  start() {
    const ui = this.data.ui
    if (!this.data.viewIsToday) {
      wx.showToast({ title: '非训练日不可开练', icon: 'none' })
      return
    }
    if (ui.isRest) {
      wx.showToast({ title: '今天休息', icon: 'none' })
      return
    }
    if (this.data.draft) {
      this.continueDraft()
      return
    }
    const view = this._view || buildTodayView(storage.getProfile(), this.data.selectedIndex)
    if (ui.isStrength) {
      const adjustments = resolveAdjustments(this.data.body || 'normal')
      wx.setStorageSync('af_ready_payload', {
        date: new Date().toISOString().slice(0, 10),
        weekday: view.slot.weekday,
        slot: view.slot,
        adjustments: adjustments,
        startedAt: Date.now()
      })
      wx.navigateTo({ url: '/pages/session/train/train' })
      return
    }
    wx.navigateTo({ url: '/pages/session/aux/aux' })
  },

  continueDraft() {
    const draft = this.data.draft
    if (!draft) return
    if (draft.kind === 'strength') {
      wx.navigateTo({ url: '/pages/session/train/train?resume=1' })
    } else {
      wx.navigateTo({ url: '/pages/session/aux/aux?resume=1' })
    }
  },

  discardDraft() {
    const that = this
    wx.showModal({
      title: '放弃未完成课次？',
      content: '已完成的组不会写入正式记录',
      confirmColor: '#FF2D55',
      success(res) {
        if (res.confirm) {
          storage.clearDraft()
          that.refresh(that.data.selectedIndex)
        }
      }
    })
  }
})
