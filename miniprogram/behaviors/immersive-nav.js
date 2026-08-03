const { customNavPadTopPx } = require('../utils/nav')

function applyNavPad(page) {
  try {
    var pad = customNavPadTopPx()
    if (!(pad > 0) || pad !== pad) pad = 88
    if (pad > 200) pad = 200
    var pages = getCurrentPages() || []
    page.setData({
      navPadTop: pad,
      showNavBack: pages.length > 1
    })
  } catch (e) {
    try {
      page.setData({ navPadTop: 88 })
    } catch (e2) {}
  }
}

/** 沉浸式自定义导航：顶部位移 + 可返回 */
module.exports = Behavior({
  data: {
    navPadTop: 88,
    showNavBack: false
  },

  onLoad() {
    applyNavPad(this)
  },

  onShow() {
    applyNavPad(this)
  },

  methods: {
    onNavBack() {
      wx.navigateBack({
        fail: function () {
          wx.reLaunch({ url: '/pages/today/today' })
        }
      })
    }
  }
})
