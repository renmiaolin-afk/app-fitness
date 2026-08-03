/** rpx → px（按屏宽 750 基准） */
function rpxToPx(rpx) {
  try {
    var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    var w = (info && info.windowWidth) || 375
    if (!(w > 0)) w = 375
    return (Number(rpx) * w) / 750
  } catch (e) {
    return Number(rpx) / 2
  }
}

/** 胶囊/状态栏底边 + 少量间距（紧凑顶栏页用，不含大标题下移） */
function statusNavPadTopPx() {
  var pad = 56
  try {
    var menu = wx.getMenuButtonBoundingClientRect()
    if (menu && menu.bottom > 0 && menu.bottom < 160) {
      pad = Math.ceil(menu.bottom + rpxToPx(16))
    } else {
      var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      pad = Math.ceil((info.statusBarHeight || 20) + 44)
    }
  } catch (e) {
    pad = 56
  }
  return pad
}

/** 自定义导航页：避让状态栏/胶囊，再下移 100rpx 标题区 */
function customNavPadTopPx() {
  var extra = rpxToPx(100)
  if (!(extra >= 0) || extra !== extra) extra = 50
  var base = 44
  try {
    var menu = wx.getMenuButtonBoundingClientRect()
    if (menu && menu.bottom > 0 && menu.bottom < 160) {
      base = menu.bottom + 8
    } else {
      var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      base = (info.statusBarHeight || 20) + 44
    }
  } catch (e) {
    try {
      var info2 = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      base = (info2.statusBarHeight || 20) + 44
    } catch (e2) {
      base = 64
    }
  }
  return Math.ceil(base + extra)
}

module.exports = {
  customNavPadTopPx: customNavPadTopPx,
  statusNavPadTopPx: statusNavPadTopPx,
  rpxToPx: rpxToPx
}
