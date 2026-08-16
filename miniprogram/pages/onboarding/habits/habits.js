const storage = require('../../../utils/storage')
const disclaimer = require('../../../services/disclaimer')

var EFFORT_OPTIONS = [
  { id: 'easy', label: '轻松练练', hint: '先把习惯养住，练完别累垮' },
  { id: 'solid', label: '好好练', hint: '认真进步，剂量适中，能长期练下去' },
  { id: 'hard', label: '拼一把', hint: '愿意多投入，想尽快看到涨力' }
]

function hintFor(effort) {
  for (var i = 0; i < EFFORT_OPTIONS.length; i++) {
    if (EFFORT_OPTIONS[i].id === effort) return EFFORT_OPTIONS[i].hint
  }
  return ''
}

Page({
  behaviors: [require('../../../behaviors/immersive-nav')],

  data: {
    fromMe: false,
    ctaLabel: '查看推荐计划',
    effort: 'solid',
    effortHint: hintFor('solid'),
    sleep: 'ok',
    body: 'none',
    duration: 60,
    effortOptions: EFFORT_OPTIONS,
    sleepOptions: [
      { id: 'good', label: '睡得挺好' },
      { id: 'ok', label: '一般般' },
      { id: 'poor', label: '经常不够' }
    ],
    bodyOptions: [
      { id: 'none', label: '没什么' },
      { id: 'old', label: '有旧伤' },
      { id: 'sore', label: '容易酸' }
    ],
    durationOptions: [
      { id: 30, label: '半小时左右' },
      { id: 60, label: '大概 1 小时' },
      { id: 90, label: '一个半小时+' }
    ]
  },

  onLoad(query) {
    const fromMe = !!(query && query.from === 'me')
    if (!fromMe && !disclaimer.ensureConsent()) return
    const p = storage.getProfile() || {}
    const h = p.habits || {}
    const effort = h.effort || 'solid'
    this.setData({
      fromMe: fromMe,
      ctaLabel: fromMe ? '保存' : '查看推荐计划',
      effort: effort,
      effortHint: hintFor(effort),
      sleep: h.sleep || 'ok',
      body: h.body || 'none',
      duration: h.durationMin || 60
    })
  },

  pick(e) {
    const { field, id } = e.currentTarget.dataset
    const value = field === 'duration' ? Number(id) : id
    const patch = { [field]: value }
    if (field === 'effort') patch.effortHint = hintFor(value)
    this.setData(patch)
  },

  next() {
    const prev = storage.getProfile() || {}
    storage.setProfile(
      Object.assign({}, prev, {
        habits: {
          effort: this.data.effort || 'solid',
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
