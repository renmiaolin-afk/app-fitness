/**
 * 周期计划页 / 半浮层共用的展示数据
 */
const storage = require('../utils/storage')
const { buildCycleOverview, resolveWeekSlots, normalizePlanId } = require('./plan')
const { buildCycleDayCards } = require('./set-cards')
const quality = require('./session-quality')
const { formatMmSs } = require('../utils/format')

function buildCycleViewData(profile) {
  const overview = buildCycleOverview(profile)
  const gain = overview.gain || {}
  const planId = normalizePlanId(profile && profile.planId)
  const slots = resolveWeekSlots(profile, planId)
  const outcomeByWd = quality.weekOutcomeMap(storage.getLogs(), quality.todayKey())
  const weeks = (overview.weeks || []).map(function (w) {
    return {
      week: w.week,
      phase: w.phase,
      current: w.current,
      expanded: !!w.current,
      head: '第 ' + w.week + ' 周 · ' + (w.phase || ''),
      days: (w.days || []).map(function (d, i) {
        if (d.empty) {
          return {
            dayLabel: d.dayLabel,
            kind: 'empty',
            layout: '',
            closed: true,
            detailOpen: false,
            summaryLine: '无',
            showSetCards: false,
            isRest: false,
            isLeave: false,
            isMissed: false,
            isDone: false,
            showQualityBanner: false,
            qualityNote: '',
            qualityTitle: '',
            qualityScore: null,
            qualityTone: 'mid',
            qualityKicker: '',
            showDuration: false,
            durationText: '',
            durationItems: [],
            hasDurationItems: false,
            durationExpanded: false,
            statusChip: '',
            secMainLabel: '',
            secAccLabel: '',
            mainCards: [],
            accCards: [],
            mainName: '无',
            restNote: '',
            auxNote: ''
          }
        }
        const slotIndex = d.slotIndex != null ? d.slotIndex : i
        const slot = slots[slotIndex] || {}
        const calWd = i + 1
        const dayLog = w.current ? outcomeByWd[calWd] : null
        const grade = dayLog ? quality.ensureGrade(dayLog) : null
        const isLeave = !!(dayLog && dayLog.kind === 'leave' && slot.type !== 'rest')
        const isMissed = !!(
          dayLog &&
          quality.isMissedLog(dayLog) &&
          slot.type !== 'rest'
        )
        const isDone = !!(
          dayLog &&
          quality.isCompletedLog(dayLog) &&
          slot.type !== 'rest'
        )
        const cards = buildCycleDayCards(
          profile,
          d.programWeek || w.week,
          slot,
          slots,
          slotIndex
        )
        var kind = d.kind
        if (isLeave) kind = 'leave'
        else if (isMissed) kind = 'missed'
        else if (isDone) kind = 'done'
        var qualityNote = isLeave ? '这节课过了，补不了' : ''
        var durationSec = isDone ? quality.durationSecFromLog(dayLog) : 0
        var showDuration = !!(isDone && durationSec > 0)
        var durationItems = showDuration ? quality.durationItemsFromLog(dayLog) : []
        var summaryLine = ''
        if (cards.isRest && !isLeave && !isMissed && !isDone) {
          summaryLine = '休息'
        } else if (cards.mainName || d.mainName || d.title) {
          summaryLine = cards.mainName || d.mainName || d.title || ''
          if (d.mainSets && d.mainSets !== '休') {
            summaryLine += ' · ' + d.mainSets
          }
        } else {
          summaryLine = d.title || slot.label || '训练'
        }

        return {
          dayLabel: d.dayLabel,
          kind: kind,
          layout: d.layout || '',
          closed: !!d.closed,
          detailOpen: false,
          summaryLine: summaryLine,
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
          qualityKicker: '这节课怎么样',
          showDuration: showDuration,
          durationText: showDuration ? formatMmSs(durationSec) : '',
          durationItems: durationItems,
          hasDurationItems: durationItems.length > 0,
          durationExpanded: false,
          statusChip: isLeave
            ? '假'
            : isMissed
              ? dayLog && dayLog.outcome === 'partial'
                ? '半'
                : '缺'
              : isDone
                ? '完'
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
    goalHint = gain.disclaimer || '估算值：按相对力量、年龄与恢复情况推算'
  } else if (
    goalTarget === '待估算' ||
    (overview.outcome || '').indexOf('录入') >= 0
  ) {
    goalTarget = '填好三大项后再估涨幅'
    goalHint = ''
  }

  return {
    cycleName: overview.cycleName,
    goalTarget: goalTarget,
    goalHint: goalHint,
    currentWeek: overview.currentWeek,
    weeks: weeks
  }
}

module.exports = {
  buildCycleViewData: buildCycleViewData
}
