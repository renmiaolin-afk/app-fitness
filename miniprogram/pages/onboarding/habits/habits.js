const storage = require('../../../utils/storage')

Page({
  data: {
    fromMe: false,
    ctaLabel: '查看推荐计划',
    sleep: 'ok',
    body: 'none',
    duration: 60,
    sleepOptions: [
      { id: 'good', label: '很好' },
      { id: 'ok', label: '一般' },
      { id: 'poor', label: '较差' }
    ],
    bodyOptions: [
      { id: 'none', label: '没有' },
      { id: 'old', label: '旧伤' },
      { id: 'sore', label: '易酸痛' }
    ],
    durationOptions: [
      { id: 30, label: '30 分钟' },
      { id: 60, label: '约 1 小时' },
      { id: 90, label: '90 分钟+' }
    ]
  },

  onLoad(query) {
    const fromMe = !!(query && query.from === 'me')
    const p = storage.getProfile() || {}
    const h = p.habits || {}
    this.setData({
      fromMe: fromMe,
      ctaLabel: fromMe ? '保存' : '查看推荐计划',
      sleep: h.sleep || 'ok',
      body: h.body || 'none',
      duration: h.durationMin || 60
    })
  },

  pick(e) {
    const { field, id } = e.currentTarget.dataset
    const value = field === 'duration' ? Number(id) : id
    this.setData({ [field]: value })
  },

  next() {
    const prev = storage.getProfile() || {}
    storage.setProfile(
      Object.assign({}, prev, {
        habits: {
          sleep: this.data.sleep,
          body: this.data.body,
          durationMin: Number(this.data.duration)
        }
      })
    )
    if (this.data.fromMe) {
      wx.navigateBack({
        fail: function () {
          wx.redirectTo({ url: '/pages/me/me' })
        }
      })
      return
    }
    wx.navigateTo({ url: '/pages/onboarding/plans/plans' })
  }
})
