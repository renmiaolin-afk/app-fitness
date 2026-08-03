const storage = require('../../../utils/storage')
const { buildTodayView } = require('../../../services/plan')
const {
  BODY_OPTIONS,
  resolveAdjustments
} = require('../../../services/ready-adjust')

/** 兼容旧入口：三态后直达训练；主路径已迁到今日页 */
Page({
  data: {
    body: 'normal',
    bodyOptions: BODY_OPTIONS,
    hint: '选择状态后，重量、组数与辅项会自动调整',
    cta: '按此开始训练'
  },

  pick(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    var hint = '无变化可直接开始'
    var cta = '按此开始训练'
    if (id === 'tired') {
      hint = '疲劳：重量略降，组数缩短，辅项精简'
      cta = '按调整后开始'
    } else if (id === 'pain') {
      hint = '不适：保守重量，仅保留主动作'
      cta = '按调整后开始'
    }
    this.setData({ body: id, hint: hint, cta: cta })
  },

  start(skip) {
    const profile = storage.getProfile()
    const view = buildTodayView(profile)
    const adjustments = resolveAdjustments(skip ? 'normal' : this.data.body)

    wx.setStorageSync('af_ready_payload', {
      date: new Date().toISOString().slice(0, 10),
      weekday: view.slot.weekday,
      slot: view.slot,
      adjustments: adjustments,
      startedAt: Date.now()
    })
    wx.setStorageSync('af_today_body', {
      date: new Date().toISOString().slice(0, 10),
      body: adjustments.body
    })

    if (view.slot.type === 'strength') {
      wx.redirectTo({ url: '/pages/session/train/train' })
    } else {
      wx.redirectTo({ url: '/pages/session/aux/aux' })
    }
  },

  confirm() {
    this.start(false)
  },

  skip() {
    this.start(true)
  }
})
