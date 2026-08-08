const storage = require('../../utils/storage')
const { buildCycleOverview, resolveWeekSlots } = require('../../services/plan')
const { buildCycleDayCards } = require('../../services/set-cards')
const { statusNavPadTopPx } = require('../../utils/nav')
const quality = require('../../services/session-quality')
const { formatMmSs } = require('../../utils/format')
const disclaimer = require('../../services/disclaimer')

Page({
  data: {
    ready: false,
    navPadTop: 88,
    cycleName: '',
    goalTarget: '',
    goalHint: '',
    currentWeek: 1,
    weeks: []
  },

  onLoad() {
    this.setData({ navPadTop: statusNavPadTopPx() })
  },

  onShow() {
    this.setData({ navPadTop: statusNavPadTopPx() })

    if (!disclaimer.ensureReadyForApp()) return
    const profile = storage.getProfile()
    quality.settlePastTrainingDays(profile)
    quality.maybeAdvanceTrainingWeek(profile)
    const overview = buildCycleOverview(storage.getProfile() || profile)
    const gain = overview.gain || {}
    const planId = (profile && profile.planId) || 'strength-hybrid-mix'
    const slots = resolveWeekSlots(profile, planId)
    const outcomeByWd = quality.weekOutcomeMap(storage.getLogs(), quality.todayKey())
    const weeks = (overview.weeks || []).map(function (w) {
      return {
        week: w.week,
        phase: w.phase,
        current: w.current,
        head: '第 ' + w.week + ' 周 · ' + (w.phase || ''),
        days: (w.days || []).map(function (d, i) {
          const slot = slots[i] || {}
          const wd = Number(slot.weekday) || i + 1
          const dayLog = w.current ? outcomeByWd[wd] : null
          const grade = dayLog ? quality.ensureGrade(dayLog) : null
          const isLeave = !!(dayLog && dayLog.kind === 'leave' && slot.type !== 'rest')
          const isMissed = !!(dayLog && quality.isMissedLog(dayLog) && slot.type !== 'rest')
          const isDone = !!(dayLog && quality.isCompletedLog(dayLog) && slot.type !== 'rest')
          const cards = buildCycleDayCards(profile, w.week, slot, slots, i)
          var kind = d.kind
          if (isLeave) kind = 'leave'
          else if (isMissed) kind = 'missed'
          else if (isDone) kind = 'done'
          var qualityNote = isLeave ? '本课作废，不能补练' : ''
          var durationSec = isDone ? quality.durationSecFromLog(dayLog) : 0
          var showDuration = !!(isDone && durationSec > 0)
          var durationItems = showDuration ? quality.durationItemsFromLog(dayLog) : []

          return {
            dayLabel: d.dayLabel,
            kind: kind,
            layout: d.layout || '',
            closed: !!d.closed,
            showSetCards: !!cards.showSetCards,
            isRest: !!cards.isRest && !isLeave && !isMissed && !isDone,
            isLeave: isLeave,
            isMissed: isMissed,
            isDone: isDone,
            showQualityBanner: !!(grade && (isLeave || isMissed || isDone)),
            qualityNote: qualityNote,
            qualityTitle: grade ? grade.title : '',
            qualityScore: grade ? grade.score : null,
            qualityTone: grade ? grade.tone : 'mid',
            qualityKicker: '训练总结',
            showDuration: showDuration,
            durationText: showDuration ? formatMmSs(durationSec) : '',
            durationItems: durationItems,
            hasDurationItems: durationItems.length > 0,
            durationExpanded: false,
            statusChip: isLeave
              ? '已请假'
              : isMissed
                ? dayLog && dayLog.outcome === 'partial'
                  ? '未练完'
                  : '未训练'
                : isDone
                  ? '已完成'
                  : '',
            secMainLabel: cards.secMainLabel || '',
            secAccLabel: cards.secAccLabel || '',
            mainCards: cards.mainCards || [],
            accCards: cards.accCards || [],
            mainName: cards.mainName || d.mainName || d.title || '',
            restNote: cards.restNote || '',
            auxNote: cards.auxNote || ''
          }
        })
      }
    })

    var goalTarget = gain.headline || overview.outcome || ''
    var goalHint = ''
    if (gain.low != null && gain.high != null && (gain.low > 0 || gain.high > 0)) {
      goalHint = gain.disclaimer || '估算值：按相对力量、年龄与恢复情况推算，测力周核对'
    } else if (goalTarget === '待估算' || (overview.outcome || '').indexOf('录入') >= 0) {
      goalTarget = '录入三大项 1RM 后生成增幅目标'
      goalHint = ''
    }

    this.setData({
      ready: true,
      cycleName: overview.cycleName,
      goalTarget: goalTarget,
      goalHint: goalHint,
      currentWeek: overview.currentWeek,
      weeks: weeks
    })
  },

  toggleDuration(e) {
    var weekIndex = Number(e.currentTarget.dataset.week)
    var dayIndex = Number(e.currentTarget.dataset.day)
    var key = 'weeks[' + weekIndex + '].days[' + dayIndex + '].durationExpanded'
    var weeks = this.data.weeks || []
    var day = weeks[weekIndex] && weeks[weekIndex].days && weeks[weekIndex].days[dayIndex]
    if (!day || !day.showDuration) return
    var patch = {}
    patch[key] = !day.durationExpanded
    this.setData(patch)
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.redirectTo({ url: '/pages/me/me' })
      }
    })
  }
})
