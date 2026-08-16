const storage = require('../../utils/storage')
const quality = require('../../services/session-quality')
const disclaimer = require('../../services/disclaimer')
const { buildCycleViewData } = require('../../services/cycle-view')

Page({
  behaviors: [require('../../behaviors/immersive-nav')],
  data: {
    ready: false,
    navPadTop: 88,
    cycleName: '',
    goalTarget: '',
    goalHint: '',
    currentWeek: 1,
    weeks: []
  },

  onShow() {
    if (!disclaimer.ensureReadyForApp()) return
    const profile0 = storage.getProfile()
    quality.settlePastTrainingDays(profile0)
    quality.maybeAdvanceTrainingWeek(storage.getProfile() || profile0)
    const profile = quality.ensureCycleAnchors(
      storage.getProfile() || profile0,
      storage
    )
    const view = buildCycleViewData(profile)
    this.setData({
      ready: true,
      cycleName: view.cycleName,
      goalTarget: view.goalTarget,
      goalHint: view.goalHint,
      currentWeek: view.currentWeek,
      weeks: view.weeks
    })
  },

  toggleWeek(e) {
    var idx = Number(e.currentTarget.dataset.index)
    var weeks = this.data.weeks || []
    if (!weeks[idx]) return
    var key = 'weeks[' + idx + '].expanded'
    var patch = {}
    patch[key] = !weeks[idx].expanded
    this.setData(patch)
  },

  toggleDay(e) {
    var wi = Number(e.currentTarget.dataset.week)
    var di = Number(e.currentTarget.dataset.day)
    var weeks = this.data.weeks || []
    var day = weeks[wi] && weeks[wi].days && weeks[wi].days[di]
    if (!day || day.kind === 'empty') return
    var key = 'weeks[' + wi + '].days[' + di + '].detailOpen'
    var patch = {}
    patch[key] = !day.detailOpen
    this.setData(patch)
  },

  toggleDuration(e) {
    var weekIndex = Number(e.currentTarget.dataset.week)
    var dayIndex = Number(e.currentTarget.dataset.day)
    var weeks = this.data.weeks || []
    var day =
      weeks[weekIndex] &&
      weeks[weekIndex].days &&
      weeks[weekIndex].days[dayIndex]
    if (!day || !day.showDuration) return
    var key =
      'weeks[' + weekIndex + '].days[' + dayIndex + '].durationExpanded'
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
