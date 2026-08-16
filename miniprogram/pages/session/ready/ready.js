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
    hint: '选好状态后，重量和组数会自动帮你调',
    cta: '按这个开始'
  },

  pick(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    var hint = '没什么变化，直接开始就行'
    var cta = '按这个开始'
    if (id === 'tired') {
      hint = '有点累：重量降一点，少练一组，后面也精简'
      cta = '按调整后开始'
    } else if (id === 'pain') {
      hint = '不太舒服：再保守一点，只练大动作'
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
