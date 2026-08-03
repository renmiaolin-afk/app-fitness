const storage = require('../../utils/storage')
const { buildCycleOverview } = require('../../services/plan')
const { statusNavPadTopPx } = require('../../utils/nav')

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

    const profile = storage.getProfile()
    if (!profile) {
      wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
      return
    }
    const overview = buildCycleOverview(profile)
    const gain = overview.gain || {}
    const weeks = (overview.weeks || []).map(function (w) {
      return {
        week: w.week,
        phase: w.phase,
        current: w.current,
        head: '第 ' + w.week + ' 周 · ' + (w.phase || ''),
        days: (w.days || []).map(function (d) {
          return {
            dayLabel: d.dayLabel,
            kind: d.kind,
            layout: d.layout || '',
            mainName: d.mainName || d.title,
            mainSets: d.mainSets || '',
            accessories: d.accessories || []
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

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.redirectTo({ url: '/pages/me/me' })
      }
    })
  }
})
