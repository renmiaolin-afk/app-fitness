const storage = require('../../utils/storage')
const { fetchWechatUserProfile } = require('../../utils/wechat-user')
const { buildTodayView } = require('../../services/plan')
const copy = require('../../utils/copy')
const {
  BODY_OPTIONS,
  applyStrengthAdjustments,
  resolveAdjustments
} = require('../../services/ready-adjust')
const { formatMainSetSheet } = require('../../services/warmup-sets')
const {
  formatAccessoryBlock,
  buildSessionCards
} = require('../../services/set-cards')
const quality = require('../../services/session-quality')
const { formatMmSs } = require('../../utils/format')
const disclaimer = require('../../services/disclaimer')

const BODY_KEY = 'af_today_body'
const FULL_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function loadBodyForToday() {
  try {
    var saved = wx.getStorageSync(BODY_KEY)
    var today = quality.todayKey()
    if (saved && saved.date === today && saved.body) return saved.body
  } catch (e) {}
  return 'normal'
}

function saveBodyForToday(body) {
  wx.setStorageSync(BODY_KEY, {
    date: quality.todayKey(),
    body: body || 'normal'
  })
}

function buildUi(view, draft, dayLog, body, outcomeByWd) {
  const slot = view.slot || {}
  const detail = view.detail || {}
  const isRest = slot.type === 'rest'
  const grade = dayLog ? quality.ensureGrade(dayLog) : null
  const isLeave = !!(dayLog && dayLog.kind === 'leave') && !isRest
  const isMissed = !!(dayLog && quality.isMissedLog(dayLog)) && !isRest
  const isCompleted = !!(dayLog && quality.isCompletedLog(dayLog)) && !isRest
  const session = detail.session || {}
  // 计划内容与结局解耦：请假/漏练也要展示当天课表
  const isStrength = slot.type === 'strength' && !!detail.main
  const isCf = !isRest && !isStrength && session.layout === 'main-wod' && !!session.main
  const isAux = !isRest && !isStrength && !isCf
  const mainBase = detail.main || {}
  const canTrain =
    view.isToday &&
    !isRest &&
    !isLeave &&
    !isMissed &&
    !isCompleted &&
    !(session && session.closed)

  let ctaText = '开始训练'
  let statusChip = '未开始'
  var draftSummary = (draft && draft.summary) || '存在未完成课次，可从中断处继续'
  if (isLeave) {
    statusChip = '已请假'
  } else if (isMissed) {
    statusChip = dayLog.outcome === 'partial' ? '未练完' : '未训练'
  } else if (draft) {
    ctaText = '继续未完成课次'
    statusChip = '训练中'
    if (quality.isDraftStaleOver24h(draft)) {
      draftSummary = '超过一天的未完成课次，可从中断处继续'
    }
  } else if (isCompleted) {
    statusChip = '已完成'
  }

  let cardTitle = isRest ? '休息日' : isLeave ? '请假' : isMissed ? '未完成' : ''
  var showStatus = !isRest && statusChip !== '未开始'
  var qualityTitle = grade ? grade.title : ''
  var qualityScore = grade ? grade.score : null

  var mainName = copy.moveName(mainBase.name)
  var mainSetSheet = isStrength ? formatMainSetSheet(mainBase) : []
  var mainSetsText = isStrength
    ? ''
    : copy.setsRepsLoad(mainBase.sets, mainBase.reps, mainBase.kg)
  var accessories = (detail.accessories || []).map(function (a) {
    return formatAccessoryBlock(a)
  })
  var adjustNote = ''
  var showBodyAdjust = !!(isStrength && canTrain && !draft && !isCompleted)
  var strengthMain = mainBase
  var strengthAccessories = detail.accessories || []

  if (isStrength && canTrain && view.isToday) {
    var applied = applyStrengthAdjustments(detail, body || 'normal')
    if (applied.main) {
      strengthMain = applied.main
      strengthAccessories = applied.accessories || []
      mainName = copy.moveName(applied.main.name)
      mainSetSheet = formatMainSetSheet(applied.main)
      accessories = strengthAccessories.map(function (a) {
        return formatAccessoryBlock(a)
      })
      adjustNote = applied.note || ''
    }
  }

  var cards
  if (isRest) {
    cards = buildSessionCards({ type: 'rest' })
  } else if (isStrength) {
    cards = buildSessionCards({
      type: 'strength',
      main: strengthMain,
      accessories: strengthAccessories,
      mainName: mainName,
      mainSetSheet: mainSetSheet,
      accessoryBlocks: accessories,
      profile: storage.getProfile(),
      showStatus: showStatus,
      statusChip: statusChip
    })
  } else {
    cards = buildSessionCards({
      type: 'aux',
      layout: session.layout || '',
      session: Object.assign({}, session, {
        name: session.name || copy.slotLabel(slot.label) || '调节'
      }),
      profile: storage.getProfile(),
      showStatus: showStatus,
      statusChip: statusChip
    })
  }

  var leaveNote = '本课作废，不计完成，也不能补练'
  var skippedLabel = copy.slotLabel(slot.label) || ''
  if (skippedLabel) {
    leaveNote = '已跳过「' + skippedLabel + '」，本课作废，不能补练'
  }

  // 总结区：称号 + 分数；完成课展示总时长；请假附说明
  var qualityNote = isLeave ? leaveNote : ''
  var qualityTone = grade ? grade.tone : ''
  var qualityKicker = '训练总结'
  var durationSec = isCompleted ? quality.durationSecFromLog(dayLog) : 0
  var showDuration = !!(isCompleted && durationSec > 0)
  var durationText = showDuration ? formatMmSs(durationSec) : ''
  var durationItems = showDuration ? quality.durationItemsFromLog(dayLog) : []

  var canLeave =
    view.isToday &&
    !isRest &&
    !isLeave &&
    !isMissed &&
    !isCompleted &&
    !(session && session.closed)

  return {
    isRest: isRest,
    isLeave: isLeave,
    isMissed: isMissed,
    isCompleted: isCompleted,
    isStrength: isStrength,
    isCf: isCf,
    isAux: isAux,
    showSetCards: !isRest && !!cards.showSetCards,
    showQualityBanner: !!(!isRest && qualityTitle && (isLeave || isMissed || isCompleted)),
    showStart: canTrain,
    showRestActions: view.isToday && isRest && !isLeave,
    showLeaveActions: view.isToday && isLeave,
    showLeaveLink: canLeave,
    showPreviewHint: !view.isToday,
    showBodyAdjust: showBodyAdjust,
    cardTitle: cardTitle,
    showStatus: showStatus,
    phaseText: view.phase || '',
    mainName: mainName || cards.mainName,
    mainSetSheet: mainSetSheet,
    mainSetsText: mainSetsText,
    accessories: accessories,
    secMainLabel: cards.secMainLabel,
    secAccLabel: cards.secAccLabel,
    mainCards: cards.mainCards,
    accCards: cards.accCards,
    adjustNote: adjustNote,
    restNote: cards.restNote,
    leaveNote: leaveNote,
    qualityNote: qualityNote,
    qualityTitle: qualityTitle,
    qualityScore: qualityScore,
    qualityTone: qualityTone,
    qualityKicker: qualityKicker,
    showDuration: showDuration,
    durationText: durationText,
    durationItems: durationItems,
    hasDurationItems: durationItems.length > 0,
    auxName: session.name || copy.slotLabel(slot.label) || '调节课',
    auxDuration: session.durationMin || 30,
    auxDurationText: session.closed ? '休' : (session.durationMin || 30) + ' 分钟',
    auxNote: cards.auxNote,
    auxClosed: !!session.closed,
    ctaText: ctaText,
    statusChip: statusChip,
    hasDraft: !!draft,
    draftSummary: draftSummary,
    slots: (view.slots || []).map(function (s, i) {
      var wd = Number(s.weekday) || i + 1
      var ol = outcomeByWd && outcomeByWd[wd]
      var left = !!(ol && ol.kind === 'leave')
      var missed = !!(ol && ol.kind === 'missed')
      var done = !!(ol && quality.isCompletedLog(ol))
      var label = copy.slotLabelShort(s.label)
      if (left) label = '假'
      else if (missed) label = '缺'
      return {
        weekday: s.weekday,
        dayLabel: FULL_WEEKDAY_LABELS[wd - 1] || s.dayLabel,
        label: label,
        active: i === view.selectedIndex,
        left: left,
        missed: missed,
        done: done
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
    weekLine: '',
    weekHint: '',
    goalText: '目标：三大项成绩',
    selectedIndex: 0,
    ui: {},
    viewIsToday: true,
    body: 'normal',
    bodyOptions: BODY_OPTIONS,
    moveSheetShow: false,
    moveSheetName: '',
    avatarUrl: '',
    durationExpanded: false
  },

  onShow() {
    if (!disclaimer.ensureReadyForApp()) return
    const profile = storage.getProfile()
    try {
      quality.settlePastTrainingDays(profile)
      quality.maybeAdvanceTrainingWeek(storage.getProfile() || profile)
    } catch (e) {
      console.warn('today settle/advance failed', e)
    }
    try {
      this.refresh(this._selectedIndex)
    } catch (e2) {
      console.error('today refresh failed', e2)
      this.setData({ ready: true })
    }
  },

  onHide() {
    if (this.data.moveSheetShow) {
      this.setData({ moveSheetShow: false })
    }
  },

  refresh(selectedIndex) {
    var profile = storage.getProfile()
    quality.settlePastTrainingDays(profile)
    quality.maybeAdvanceTrainingWeek(profile)
    profile = storage.getProfile()
    const view = buildTodayView(profile, selectedIndex)
    this._selectedIndex = view.selectedIndex
    const draftRaw = storage.getDraft()
    const dateKey = quality.todayKey()
    const logs = storage.getLogs()
    const weekday =
      view.slots[view.selectedIndex] && view.slots[view.selectedIndex].weekday
    var draft = null
    if (draftRaw && draftRaw.date === dateKey) {
      if (draftRaw.weekday == null || draftRaw.weekday === '') {
        draft = view.isToday ? draftRaw : null
      } else if (Number(draftRaw.weekday) === Number(weekday)) {
        draft = draftRaw
      }
    }
    const selectedDate = quality.dateForWeekday(dateKey, weekday)
    const dayLog = quality.findDayLog(logs, selectedDate, weekday)
    const outcomeByWd = quality.weekOutcomeMap(logs, dateKey)
    const body = loadBodyForToday()
    const ui = buildUi(view, draft, dayLog, body, outcomeByWd)
    var weekHint = ''
    if (
      profile &&
      profile.lastWeekQuality &&
      profile.trainingWeekStart === quality.mondayKey(dateKey)
    ) {
      weekHint = quality.weekQualityHintText(profile.lastWeekQuality)
    }
    this._view = view
    var weekLine =
      '第 ' +
      view.week +
      ' 周' +
      (view.phase ? ' · ' + view.phase : '') +
      ' · 目标：三大项成绩'
    this.setData({
      ready: true,
      cycleName: view.cycleName,
      week: view.week,
      phase: view.phase || '',
      weekLine: weekLine,
      weekHint: weekHint,
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
    const profile = storage.getProfile() || {}
    if (profile.avatarUrl) {
      wx.navigateTo({ url: '/pages/me/me' })
      return
    }
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
    this.setData({ durationExpanded: false })
    this.refresh(index)
  },

  toggleDuration(e) {
    if (e && e.stopPropagation) e.stopPropagation()
    if (!this.data.ui || !this.data.ui.showDuration) return
    this.setData({ durationExpanded: !this.data.durationExpanded })
  },

  markLeave() {
    const ui = this.data.ui
    if (!ui || !ui.showLeaveLink) return
    if (!this.data.viewIsToday) {
      wx.showToast({ title: '只能请今天的假', icon: 'none' })
      return
    }
    const that = this
    const view =
      this._view || buildTodayView(storage.getProfile(), this.data.selectedIndex)
    const slot = view.slot || {}
    const label = copy.slotLabel(slot.label) || '今天的课'
    var content =
      '「' + label + '」记为请假（0 分）。课表不后移，本课作废，不能补练。'
    if (this.data.draft) {
      content =
        '将放弃未完成课次，并把「' +
        label +
        '」记为请假（0 分，不能补练）。'
    }
    wx.showModal({
      title: '今天请假？',
      content: content,
      confirmText: '请假',
      confirmColor: '#FF2D55',
      success(res) {
        if (!res.confirm) return
        storage.clearDraft()
        var grade = quality.scoreLeave()
        storage.appendLog({
          date: quality.todayKey(),
          weekday: slot.weekday,
          kind: 'leave',
          name: slot.label || label,
          reason: 'manual',
          score: grade.score,
          title: grade.title,
          finishedAt: Date.now()
        })
        that.refresh(that.data.selectedIndex)
        wx.showToast({ title: '已请假', icon: 'none' })
      }
    })
  },

  revokeLeave() {
    const ui = this.data.ui
    if (!ui || !ui.showLeaveActions) return
    const that = this
    const view =
      this._view || buildTodayView(storage.getProfile(), this.data.selectedIndex)
    wx.showModal({
      title: '撤销请假？',
      content: '撤销后可重新开始今天的训练',
      confirmText: '撤销',
      success(res) {
        if (!res.confirm) return
        storage.removeLeaveLog(quality.todayKey(), view.slot && view.slot.weekday)
        that.refresh(that.data.selectedIndex)
      }
    })
  },

  goCycle() {
    wx.navigateTo({ url: '/pages/cycle/cycle' })
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
    if (ui.isLeave) {
      wx.showToast({ title: '今天已请假', icon: 'none' })
      return
    }
    if (ui.isMissed) {
      wx.showToast({ title: '今天没练就是没练', icon: 'none' })
      return
    }
    if (ui.isCompleted) {
      wx.showToast({ title: '今天已练完', icon: 'none' })
      return
    }
    if (this.data.draft) {
      this.continueDraft()
      return
    }
    const view =
      this._view || buildTodayView(storage.getProfile(), this.data.selectedIndex)
    if (ui.isStrength) {
      const adjustments = resolveAdjustments(this.data.body || 'normal')
      wx.setStorageSync('af_ready_payload', {
        date: quality.todayKey(),
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

})
