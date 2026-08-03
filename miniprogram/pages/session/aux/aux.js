const storage = require('../../../utils/storage')
const { buildTodayView } = require('../../../services/plan')
const { formatMmSs } = require('../../../utils/format')
const { customNavPadTopPx } = require('../../../utils/nav')

Page({
  data: {
    navPadTop: 64,
    title: '',
    segmentIndex: 0,
    blocks: [],
    timerText: '0:00',
    hint: '',
    cta: '结束本段',
    mode: 'down',
    zoneText: '剩余时间',
    subText: '',
    showExit: false,
    dots: []
  },

  noop() {},

  tick: null,
  endsAt: 0,
  startedAt: 0,
  sessionMeta: null,
  elapsedBefore: 0,

  onLoad(query) {
    this.setData({ navPadTop: customNavPadTopPx() })
    wx.setKeepScreenOn({ keepScreenOn: true })
    if (query.resume === '1') {
      const draft = storage.getDraft()
      if (!draft || draft.kind !== 'aux') {
        wx.showToast({ title: '没有可恢复的辅助课', icon: 'none' })
        return
      }
      this.boot(draft.blocks, draft.segmentIndex || 0, draft)
      return
    }
    const profile = storage.getProfile()
    const view = buildTodayView(profile)
    const session = view.detail && view.detail.session
    if (!session) {
      wx.showToast({ title: '今日不是辅助日', icon: 'none' })
      return
    }
    if (session.closed || !(session.blocks || []).length) {
      wx.showToast({ title: session.note || '本周无此辅助课', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 500)
      return
    }
    const meta = {
      kind: 'aux',
      date: new Date().toISOString().slice(0, 10),
      weekday: view.slot.weekday,
      name: session.name,
      key: view.slot.key,
      startedAt: Date.now()
    }
    this.boot(session.blocks || [], 0, meta)
  },

  onUnload() {
    if (this.tick) clearInterval(this.tick)
    wx.setKeepScreenOn({ keepScreenOn: false })
  },

  boot(blocks, index, meta) {
    this.sessionMeta = meta
    const dots = blocks.map(function (_, i) {
      return i < index ? 'done' : i === index ? 'on' : 'todo'
    })
    this.setData({ blocks: blocks, segmentIndex: index, dots: dots })
    this.startSegment(index)
  },

  startSegment(index) {
    if (this.tick) clearInterval(this.tick)
    const block = this.data.blocks[index]
    if (!block) {
      this.finish()
      return
    }
    const minutes = block.minutes || 5
    const isLast = index >= this.data.blocks.length - 1
    const isMetconLike =
      block.kind === 'metcon' || /metcon|for time|amrap|emom/i.test(block.name || '')
    const mode = isMetconLike ? 'up' : 'down'
    this.startedAt = Date.now()
    this.elapsedBefore = 0
    this.endsAt = Date.now() + minutes * 60 * 1000
    var roleLabel = ''
    if (block.role === 'main' || block.kind === 'strength') roleLabel = '主项'
    else if (block.role === 'wod' || block.kind === 'metcon') roleLabel = '辅项 · WOD'
    else if (block.kindLabel) roleLabel = block.kindLabel
    const title = roleLabel ? roleLabel + ' · ' + block.name : block.name
    const hint = block.detail || block.hint || (block.cues && block.cues[0]) || ''
    this.setData({
      title: title,
      segmentIndex: index,
      hint: hint,
      mode: mode,
      zoneText: mode === 'up' ? '已用时' : '剩余时间',
      subText:
        (roleLabel || '调节') +
        ' · ' +
        (index + 1) +
        ' / ' +
        this.data.blocks.length,
      timerText: mode === 'up' ? '0:00' : formatMmSs(minutes * 60),
      cta: isLast ? '完成本次训练' : '完成本段',
      dots: this.data.blocks.map(function (_, i) {
        return i < index ? 'done' : i === index ? 'on' : 'todo'
      })
    })
    this.persist()
    var that = this
    this.tick = setInterval(function () {
      that.onTick()
    }, 250)
  },

  onTick() {
    if (this.data.mode === 'up') {
      const sec = Math.floor((Date.now() - this.startedAt) / 1000) + this.elapsedBefore
      this.setData({ timerText: formatMmSs(sec) })
    } else {
      const left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000))
      this.setData({ timerText: formatMmSs(left) })
    }
  },

  persist() {
    storage.setDraft(
      Object.assign({}, this.sessionMeta, {
        blocks: this.data.blocks,
        segmentIndex: this.data.segmentIndex,
        summary:
          (this.sessionMeta.name || '辅助') +
          ' · 第 ' +
          (this.data.segmentIndex + 1) +
          '/' +
          this.data.blocks.length +
          ' 段'
      })
    )
  },

  next() {
    const nextIndex = this.data.segmentIndex + 1
    if (nextIndex >= this.data.blocks.length) {
      this.finish()
      return
    }
    this.startSegment(nextIndex)
  },

  finish() {
    if (this.tick) clearInterval(this.tick)
    const log = {
      date: this.sessionMeta.date,
      weekday: this.sessionMeta.weekday,
      kind: 'aux',
      name: this.sessionMeta.name,
      key: this.sessionMeta.key,
      durationMin: Math.round((Date.now() - this.sessionMeta.startedAt) / 60000),
      score: 88,
      finishedAt: Date.now()
    }
    storage.appendLog(log)
    storage.clearDraft()
    wx.setStorageSync('af_summary', log)
    wx.redirectTo({ url: '/pages/session/summary/summary' })
  },

  openExit() {
    this.setData({ showExit: true })
  },

  closeExit() {
    this.setData({ showExit: false })
  },

  saveExit() {
    this.persist()
    wx.reLaunch({ url: '/pages/today/today' })
  },

  discardExit() {
    storage.clearDraft()
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
