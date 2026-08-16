const storage = require('../../utils/storage')
const quality = require('../../services/session-quality')
const disclaimer = require('../../services/disclaimer')
const { buildCycleViewData } = require('../../services/cycle-view')

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    ready: false,
    cycleName: '',
    goalTarget: '',
    goalHint: '',
    weeks: []
  },

  observers: {
    show: function (show) {
      if (show) this.refresh()
    }
  },

  methods: {
    refresh() {
      if (!disclaimer.ensureReadyForApp()) return
      var profile0 = storage.getProfile()
      quality.settlePastTrainingDays(profile0)
      quality.maybeAdvanceTrainingWeek(storage.getProfile() || profile0)
      var profile = quality.ensureCycleAnchors(
        storage.getProfile() || profile0,
        storage
      )
      var view = buildCycleViewData(profile)
      this.setData({
        ready: true,
        cycleName: view.cycleName,
        goalTarget: view.goalTarget,
        goalHint: view.goalHint,
        weeks: view.weeks
      })
    },

    onClose() {
      this.triggerEvent('close')
    },

    onAfterLeave() {
      this.triggerEvent('close')
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
      var wi = Number(e.currentTarget.dataset.week)
      var di = Number(e.currentTarget.dataset.day)
      var weeks = this.data.weeks || []
      var day = weeks[wi] && weeks[wi].days && weeks[wi].days[di]
      if (!day || !day.showDuration) return
      var key = 'weeks[' + wi + '].days[' + di + '].durationExpanded'
      var patch = {}
      patch[key] = !day.durationExpanded
      this.setData(patch)
    },

    noop() {}
  }
})
