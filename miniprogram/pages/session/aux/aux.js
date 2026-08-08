const storage = require('../../../utils/storage')
const { buildTodayView } = require('../../../services/plan')
const { formatMmSs, minWorkUnlockSec } = require('../../../utils/format')
const timerRing = require('../../../utils/timer-ring')
const { customNavPadTopPx } = require('../../../utils/nav')
const quality = require('../../../services/session-quality')
const { scoreCompletedSession } = quality
const {
  expandCfExecutionBlocks,
  expandAuxExecutionBlocks,
  buildPlainExecView
} = require('../../../services/set-cards')

var RING_TICK_MS = timerRing.TICK_MS

function resolveExecBlocks(session, profile) {
  if (!session) return []
  if (session.layout === 'main-wod' && (session.main || (session.accessories || []).length)) {
    var cfBlocks = expandCfExecutionBlocks(session, profile)
    if (cfBlocks && cfBlocks.length) return cfBlocks
  }
  var auxBlocks = expandAuxExecutionBlocks(session)
  if (auxBlocks && auxBlocks.length) return auxBlocks
  return session.blocks || []
}

Page({
  data: {
    navPadTop: 64,
    title: '',
    phaseLabel: '',
    howto: '',
    segmentIndex: 0,
    blocks: [],
    timerText: '0:00',
    cta: '完成本段',
    completeLabel: '完成本段',
    canComplete: false,
    unlockLeftSec: 0,
    mode: 'down',
    zoneText: '剩余时间',
    subText: '',
    loadText: '',
    showExit: false,
    dots: [],
    dotsCompact: false,
    progressLabel: '',
    progressPct: 0,
    isCfSets: false,
    paused: false,
    timerHot: false,
    ringPct: 100,
    ringColor: 'rgba(255, 45, 85, 0.55)',
    glowIntensity: 0.55
  },



  noop() {},

  tick: null,
  endsAt: 0,
  startedAt: 0,
  sessionMeta: null,
  elapsedBefore: 0,
  plannedSec: 0,
  minUnlockSec: 30,
  segmentPaused: false,
  ctaBase: '完成本段',

  onLoad(query) {
    this.setData({ navPadTop: customNavPadTopPx() })
    wx.setKeepScreenOn({ keepScreenOn: true })
    if (query.resume === '1') {
      const draft = storage.getDraft()
      if (!draft || draft.kind !== 'aux') {
        wx.showToast({ title: '没有可恢复的辅助课', icon: 'none' })
        return
      }
      this.boot(draft.blocks, draft.segmentIndex || 0, draft, !!draft.isCfSets)
      return
    }
    const profile = storage.getProfile()
    const view = buildTodayView(profile)
    const dayLog0 = quality.findDayLog(
      storage.getLogs(),
      quality.todayKey(),
      view.slot && view.slot.weekday
    )
    if (quality.isCompletedLog(dayLog0)) {
      wx.showToast({ title: '今天已练完', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 400)
      return
    }
    if (dayLog0 && dayLog0.kind === 'leave') {
      wx.showToast({ title: '今天已请假', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 400)
      return
    }
    const session = view.detail && view.detail.session
    if (!session) {
      wx.showToast({ title: '今日不是辅助日', icon: 'none' })
      return
    }
    const blocks = resolveExecBlocks(session, profile)
    if (session.closed || !blocks.length) {
      wx.showToast({ title: session.note || '本周无此辅助课', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 500)
      return
    }
    const isCfSets = session.layout === 'main-wod'
    const meta = {
      kind: 'aux',
      date: quality.todayKey(),
      weekday: view.slot.weekday,
      name: session.name,
      key: view.slot.key,
      startedAt: Date.now(),
      isCfSets: isCfSets,
      layout: session.layout || ''
    }
    this.boot(blocks, 0, meta, isCfSets)
  },

  onUnload() {
    if (this.tick) clearInterval(this.tick)
    wx.setKeepScreenOn({ keepScreenOn: false })
  },

  onBackPress() {
    if (this.data.showExit) {
      this.closeExit()
      return true
    }
    this.openExit()
    return true
  },

  progressMeta(index, total) {
    var t = total || 0
    var cur = Math.min(t, (Number(index) || 0) + 1)
    var compact = t > 8
    var pct = t > 0 ? Math.round((cur / t) * 100) : 0
    return {
      dotsCompact: compact,
      progressLabel: t > 0 ? cur + ' / ' + t : '',
      progressPct: pct
    }
  },

  completeGatePatch(elapsedSec) {
    var need = this.minUnlockSec || 30
    var left = Math.max(0, need - Math.floor(Number(elapsedSec) || 0))
    var can = left <= 0
    var base = this.ctaBase || this.data.cta || '完成本段'
    return {
      canComplete: can,
      unlockLeftSec: left,
      completeLabel: can ? base : base + ' ' + left + 's'
    }
  },

  segmentElapsedSec() {
    if (this.data.mode === 'up') {
      if (this.data.paused || this.segmentPaused) return this.elapsedBefore || 0
      return Math.floor((Date.now() - this.startedAt) / 1000) + (this.elapsedBefore || 0)
    }
    if (this.data.paused || this.segmentPaused) {
      var pausedLeft = this._pausedLeft != null ? this._pausedLeft : this.plannedSec
      return Math.max(0, this.plannedSec - pausedLeft)
    }
    var left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000))
    return Math.max(0, this.plannedSec - left)
  },

  ringVisual(paused) {
    var plannedMs = Math.max(1, (this.plannedSec || 1) * 1000)
    if (this.data.mode === 'up') {
      var elapsedMs
      if (paused || this.segmentPaused) {
        elapsedMs = (this.elapsedBefore || 0) * 1000
      } else {
        elapsedMs = Date.now() - this.startedAt + (this.elapsedBefore || 0) * 1000
      }
      return timerRing.countupRing(elapsedMs, plannedMs, !!paused)
    }
    var leftMs
    if (paused || this.segmentPaused) {
      leftMs = (this._pausedLeft != null ? this._pausedLeft : this.plannedSec) * 1000
    } else {
      leftMs = Math.max(0, this.endsAt - Date.now())
    }
    return timerRing.countdownRing(leftMs, plannedMs, !!paused)
  },

  boot(blocks, index, meta, isCfSets) {
    this.sessionMeta = meta
    this.completedSegments = (meta && meta.segments) || []
    const dots = blocks.map(function (_, i) {
      return i < index ? 'done' : i === index ? 'on' : 'todo'
    })
    this.setData(
      Object.assign(
        {
          blocks: blocks,
          segmentIndex: index,
          dots: dots,
          isCfSets: !!isCfSets,
          paused: false
        },
        this.progressMeta(index, blocks.length)
      )
    )
    this.startSegment(index)
  },

  startSegment(index) {
    if (this.tick) clearInterval(this.tick)
    this.segmentPaused = false
    const block = this.data.blocks[index]
    if (!block) {
      this.finish()
      return
    }
    const minutes = Number(block.minutes) > 0 ? Number(block.minutes) : 5
    const plannedSec = Math.round(minutes * 60)
    this.plannedSec = plannedSec
    const isLast = index >= this.data.blocks.length - 1
    const isMetconLike =
      block.modeHint === 'up' ||
      block.kind === 'metcon' ||
      /metcon|for time|amrap|emom/i.test(block.name || '')
    const mode = block.modeHint === 'down' ? 'down' : isMetconLike ? 'up' : 'down'
    this.startedAt = Date.now()
    this.elapsedBefore = 0
    this.endsAt = Date.now() + plannedSec * 1000
    this.minUnlockSec = minWorkUnlockSec(plannedSec)
    this._pausedLeft = null

    const unit = block.unit || '段'
    var plain = buildPlainExecView(block, {
      index: block.setIndex || index + 1,
      total: block.setTotal || this.data.blocks.length
    })

    var cta = '做完了'
    if (unit === '组') cta = isLast ? '完成训练' : '完成本组'
    else if (unit === '回合') cta = isLast ? '完成训练' : '完成本回合'
    else if (unit === '分') cta = isLast ? '完成训练' : '下一分钟'
    else if (isLast) cta = '完成训练'
    else cta = '做完了'
    this.ctaBase = cta

    this.setData({ mode: mode })
    var ring = this.ringVisual(false)
    var progress = this.progressMeta(index, this.data.blocks.length)
    var gate = this.completeGatePatch(0)
    var overall =
      '总进度 ' + (index + 1) + ' / ' + this.data.blocks.length

    this.setData(
      Object.assign(
        {
          title: plain.title,
          phaseLabel: plain.phaseLabel,
          howto: plain.howto,
          segmentIndex: index,
          loadText: plain.loadText,
          mode: mode,
          zoneText: mode === 'up' ? '已用时' : '剩余时间',
          subText: plain.progressText + ' · ' + overall,
          timerText: mode === 'up' ? '0:00' : formatMmSs(plannedSec),
          cta: cta,
          paused: false,
          dots: this.data.blocks.map(function (_, i) {
            return i < index ? 'done' : i === index ? 'on' : 'todo'
          })
        },
        ring,
        progress,
        gate
      )
    )
    this.persist()
    this._lastAuxPaintSec = null
    var that = this
    this.tick = setInterval(function () {
      that.onTick()
    }, RING_TICK_MS)
    this.onTick()
  },

  onTick() {
    if (this.segmentPaused || this.data.paused) return
    var ring = this.ringVisual(false)
    var elapsed = this.segmentElapsedSec()
    var gate = this.completeGatePatch(elapsed)
    var patch = Object.assign({}, ring, gate)
    if (this.data.mode === 'up') {
      var secUp = Math.floor((Date.now() - this.startedAt) / 1000) + (this.elapsedBefore || 0)
      if (secUp !== this._lastAuxPaintSec) {
        this._lastAuxPaintSec = secUp
        patch.timerText = formatMmSs(secUp)
        patch.zoneText = '已用时'
      }
    } else {
      var leftMs = Math.max(0, this.endsAt - Date.now())
      var secDown = Math.max(0, Math.ceil(leftMs / 1000))
      if (secDown !== this._lastAuxPaintSec) {
        this._lastAuxPaintSec = secDown
        patch.timerText = formatMmSs(secDown)
        patch.zoneText = '剩余时间'
      }
    }
    this.setData(patch)
  },

  togglePause() {
    if (!this.data.paused) {
      if (this.data.mode === 'up') {
        this.elapsedBefore =
          Math.floor((Date.now() - this.startedAt) / 1000) + (this.elapsedBefore || 0)
      } else {
        var left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000))
        this._pausedLeft = left
      }
      this.segmentPaused = true
      var elapsedPause = this.segmentElapsedSec()
      this.setData(
        Object.assign(
          {
            paused: true,
            zoneText: '已暂停'
          },
          this.ringVisual(true),
          this.completeGatePatch(elapsedPause)
        )
      )
      this.persist()
      return
    }
    if (this.data.mode === 'up') {
      this.startedAt = Date.now()
    } else {
      var resumeLeft = this._pausedLeft != null ? this._pausedLeft : this.plannedSec
      this.endsAt = Date.now() + resumeLeft * 1000
    }
    this.segmentPaused = false
    this._lastAuxPaintSec = null
    this.setData({
      paused: false,
      zoneText: this.data.mode === 'up' ? '已用时' : '剩余时间'
    })
    this.persist()
    this.onTick()
  },

  persist() {
    storage.setDraft(
      Object.assign({}, this.sessionMeta, {
        blocks: this.data.blocks,
        segmentIndex: this.data.segmentIndex,
        segments: this.completedSegments || [],
        isCfSets: !!this.data.isCfSets,
        updatedAt: Date.now(),
        summary:
          (this.sessionMeta.name || '辅助') +
          ' · ' +
          (this.data.segmentIndex + 1) +
          '/' +
          this.data.blocks.length
      })
    )
  },

  recordCurrentSegment() {
    var block = this.data.blocks[this.data.segmentIndex]
    if (!block) return
    var sec = 0
    if (this.data.mode === 'up') {
      if (this.data.paused) {
        sec = this.elapsedBefore || 0
      } else {
        sec = Math.floor((Date.now() - this.startedAt) / 1000) + (this.elapsedBefore || 0)
      }
    } else {
      var planned = this.plannedSec || Math.round((Number(block.minutes) > 0 ? Number(block.minutes) : 5) * 60)
      var left
      if (this.data.paused) {
        left = this._pausedLeft != null ? this._pausedLeft : planned
      } else {
        left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000))
      }
      sec = Math.max(0, planned - left)
    }
    if (!this.completedSegments) this.completedSegments = []
    this.completedSegments.push({
      name: block.name || '段落',
      moveName: block.name || '段落',
      label: block.phase || block.kindLabel || block.unit || '段',
      block: block.name || '段落',
      kind: block.kind || 'aux',
      durationSec: sec
    })
  },

  next() {
    if (!this.data.canComplete) {
      wx.showToast({
        title: '再练 ' + (this.data.unlockLeftSec || 0) + ' 秒',
        icon: 'none'
      })
      return
    }
    this.recordCurrentSegment()
    const nextIndex = this.data.segmentIndex + 1
    if (nextIndex >= this.data.blocks.length) {
      this.finish()
      return
    }
    this.startSegment(nextIndex)
  },

  finish() {
    if (this.tick) clearInterval(this.tick)
    var segs = this.completedSegments || []
    if (segs.length < this.data.blocks.length) {
      this.recordCurrentSegment()
      segs = this.completedSegments || []
    }
    const grade = scoreCompletedSession({ kind: 'aux', restAddCount: 0 })
    const log = {
      date: this.sessionMeta.date,
      weekday: this.sessionMeta.weekday,
      kind: 'aux',
      name: this.sessionMeta.name,
      key: this.sessionMeta.key,
      startedAt: this.sessionMeta.startedAt,
      sets: segs,
      durationSec: Math.max(
        0,
        Math.round((Date.now() - (this.sessionMeta.startedAt || Date.now())) / 1000)
      ),
      durationMin: Math.max(
        0,
        Math.round((Date.now() - (this.sessionMeta.startedAt || Date.now())) / 60000)
      ),
      restAddCount: 0,
      score: grade.score,
      title: grade.title,
      finishedAt: Date.now()
    }
    storage.appendLog(log)
    storage.clearDraft()
    wx.setStorageSync('af_summary', log)
    wx.redirectTo({ url: '/pages/session/summary/summary' })
  },

  openExit() {
    if (!this.data.paused) {
      this.togglePause()
    }
    this.setData({ showExit: true })
  },

  closeExit() {
    this.setData({ showExit: false })
  },

  saveExit() {
    this.persist()
    this.setData({ showExit: false })
    wx.reLaunch({ url: '/pages/today/today' })
  },

  discardExit() {
    storage.clearDraft()
    this.setData({ showExit: false })
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
