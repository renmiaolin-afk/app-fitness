const storage = require('../../../utils/storage')
const {
  ensureGrade,
  durationSecFromLog,
  durationItemsFromLog
} = require('../../../services/session-quality')
const { formatMmSs } = require('../../../utils/format')
const { buildTodayView } = require('../../../services/plan')
const { buildSessionCards } = require('../../../services/set-cards')
const copy = require('../../../utils/copy')

function buildCompletedSetRows(raw) {
  var blockCount = {}
  return (raw || []).map(function (s) {
    var label =
      s.label ||
      (s.kind === 'warmup' ? '热身' : s.kind === 'accessory' ? '辅项' : '工作')
    var key = s.block || label
    blockCount[key] = (blockCount[key] || 0) + 1
    var title = label + ' ' + blockCount[key]
    var detail =
      (s.kg != null && Number(s.kg) > 0
        ? s.kg + 'kg'
        : s.kind === 'accessory'
          ? '自重'
          : '-') +
      (s.reps != null ? ' × ' + s.reps : '') +
      ' · ' +
      (s.durationSec != null ? s.durationSec : 0) +
      's'
    return Object.assign({}, s, { title: title, detail: detail })
  })
}

function buildPlanFromToday(log) {
  var profile = storage.getProfile()
  if (!profile) return null
  var view = buildTodayView(profile)
  var slot = view.slot || {}
  var detail = view.detail || {}
  var session = detail.session || {}

  if (slot.type === 'strength' && detail.main) {
    return buildSessionCards({
      type: 'strength',
      main: detail.main,
      accessories: detail.accessories || [],
      profile: profile,
      showStatus: true,
      statusChip: '已完成'
    })
  }

  if (session && !session.closed) {
    return buildSessionCards({
      type: 'aux',
      layout: session.layout || '',
      session: Object.assign({}, session, {
        name: session.name || log.name || copy.slotLabel(slot.label) || '训练'
      }),
      profile: profile,
      showStatus: true,
      statusChip: '已完成'
    })
  }

  return null
}

Page({
  data: {
    name: '',
    durationText: '',
    durationItems: [],
    hasDurationItems: false,
    durationExpanded: false,
    showDuration: false,
    score: 90,
    title: '',
    tone: 'great',
    sets: [],
    hasSets: false,
    showPlan: false,
    secMainLabel: '今日计划',
    secAccLabel: '',
    mainCards: [],
    accCards: []
  },

  onLoad() {
    const log = wx.getStorageSync('af_summary') || {}
    const grade = ensureGrade(log) || { score: log.score || 0, title: log.title || '' }
    const sets = buildCompletedSetRows(log.sets || [])
    var durationSec = durationSecFromLog(log)

    var plan = null
    try {
      plan = buildPlanFromToday(log)
    } catch (e) {
      plan = null
    }

    var mainCards = (plan && plan.mainCards) || []
    var accCards = (plan && plan.accCards) || []
    var showPlan = !!(plan && plan.showSetCards && (mainCards.length || accCards.length))
    var durationItems = durationSec > 0 ? durationItemsFromLog(log) : []
    var showDuration = durationSec > 0

    this.setData({
      name: log.name || '训练',
      showDuration: showDuration,
      durationText: showDuration ? formatMmSs(durationSec) : '',
      durationItems: durationItems,
      hasDurationItems: durationItems.length > 0,
      durationExpanded: false,
      score: grade.score,
      title: grade.title,
      tone: grade.tone || 'great',
      sets: sets,
      hasSets: log.kind === 'strength' && sets.length > 0,
      showPlan: showPlan,
      secMainLabel: (plan && plan.secMainLabel) || '今日计划',
      secAccLabel: (plan && plan.secAccLabel) || '辅项',
      mainCards: mainCards,
      accCards: accCards
    })
  },

  toggleDuration() {
    if (!this.data.showDuration) return
    this.setData({ durationExpanded: !this.data.durationExpanded })
  },

  backToday() {
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
