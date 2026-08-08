const storage = require('../../../utils/storage')
const { buildTodayView } = require('../../../services/plan')
const { formatMmSs, minWorkUnlockSec } = require('../../../utils/format')
const timerRing = require('../../../utils/timer-ring')
const copy = require('../../../utils/copy')
const { applyStrengthAdjustments } = require('../../../services/ready-adjust')
const {
  buildMainSetPlan,
  buildAccessorySetPlan,
  rowLabel
} = require('../../../services/warmup-sets')
const { customNavPadTopPx } = require('../../../utils/nav')
const quality = require('../../../services/session-quality')
const { scoreCompletedSession } = quality

/** 工作组倒计时：2 分钟；热身组更短 */
var WORK_SET_SEC = 120
var WARMUP_SET_SEC = 60
var RING_TICK_MS = timerRing.TICK_MS

Page({
  data: {
    navPadTop: 64,
    phase: 'ready',
    name: '',
    setIndex: 0,
    totalSets: 3,
    reps: 4,
    kg: 155,
    kgLabel: '',
    timerText: '2:00',
    restText: '5:00',
    displayTime: '2:00',
    unitHint: '准备开始',
    subText: '',
    targetInfo: '',
    phaseLabel: '',
    paused: false,
    timerHot: false,
    showExit: false,
    dots: [],
    dotsCompact: false,
    progressLabel: '',
    progressPct: 0,
    showCountdown: false,
    countdownNum: 3,
    ringPct: 100,
    ringColor: 'rgba(255, 45, 85, 0.55)',
    glowIntensity: 0.55,
    canComplete: false,
    completeLabel: '完成本组',
    unlockLeftSec: 0
  },

  timer: null,
  restTimer: null,
  countdownTimer: null,
  setStartedAt: 0,
  workEndsAt: 0,
  workRemainSec: WORK_SET_SEC,
  workBudgetSec: WORK_SET_SEC,
  minUnlockSec: 30,
  activeElapsedBefore: 0,
  restEndsAt: 0,
  restRemainSec: 0,
  restTotalSec: 0,
  session: null,
  completedSets: [],
  restAddCount: 0,

  noop() {},

  onBackPress() {
    if (this.data.showExit) {
      this.closeExit()
      return true
    }
    this.openExit()
    return true
  },

  setWorkBudget(setIndex) {
    var set = this.currentSet(setIndex)
    if (set && set.kind === 'warmup') return WARMUP_SET_SEC
    if (set && set.kind === 'accessory') return 90
    return WORK_SET_SEC
  },

  currentSet(setIndex) {
    var plan = (this.session && this.session.setPlan) || []
    var i = setIndex != null ? setIndex : this.data.setIndex
    return plan[i] || null
  },

  setTargetInfo(set) {
    if (!set) return '按屏幕提示完成这一组'
    var reps = set.reps != null ? set.reps : ''
    if (set.kind === 'warmup') {
      return reps !== '' ? '热身：做 ' + reps + ' 次，活动开就行' : '热身：活动开就行'
    }
    if (set.kind === 'accessory') {
      if (set.bodyweight || !set.kg) {
        return reps !== '' ? '辅助：自重做 ' + reps + ' 次' : '辅助：按自重完成'
      }
      return reps !== '' ? '辅助：做 ' + reps + ' 次' : '辅助：完成本组'
    }
    var label = rowLabel(set)
    if (label && label !== '工作' && label !== '正式') {
      return label + '：做 ' + reps + ' 次'
    }
    return reps !== '' ? '这一组做 ' + reps + ' 次' : '完成本组次数'
  },

  phaseLabelForSet(set) {
    if (!set) return '训练'
    if (set.kind === 'warmup') return '热身'
    if (set.kind === 'accessory') return '辅助动作'
    return '力量练习'
  },

  displayNameForSet(set) {
    if (set && set.kind === 'accessory' && set.moveName) return set.moveName
    return (this.session && this.session.name) || this.data.name || ''
  },

  buildSubText(setIndex, totalSets, paused) {
    var plan = (this.session && this.session.setPlan) || []
    var set = plan[setIndex]
    var text = '第 ' + (setIndex + 1) + ' / ' + totalSets + ' 组'
    if (set && set.kind === 'warmup') {
      var wi = 0
      var wt = 0
      for (var i = 0; i < plan.length; i++) {
        if (plan[i].kind === 'warmup') {
          wt++
          if (i <= setIndex) wi++
        }
      }
      text = '热身第 ' + wi + ' / ' + wt + ' 组'
    } else if (set && set.kind === 'accessory') {
      var ai = 0
      var at = 0
      for (var a = 0; a < plan.length; a++) {
        if (plan[a].kind === 'accessory' && plan[a].block === set.block) {
          at++
          if (a <= setIndex) ai++
        }
      }
      text = '辅助第 ' + ai + ' / ' + at + ' 组'
    } else if (set && set.kind === 'work') {
      var wki = 0
      var wkt = 0
      for (var k = 0; k < plan.length; k++) {
        if (plan[k].kind === 'work') {
          wkt++
          if (k <= setIndex) wki++
        }
      }
      text = '正式第 ' + wki + ' / ' + wkt + ' 组'
    }
    if (paused) text += ' · 已暂停'
    return text
  },

  ringVisual(phase, paused) {
    if (phase === 'working') {
      var budgetMs = Math.max(1, (this.workBudgetSec || this.setWorkBudget(this.data.setIndex)) * 1000)
      var leftMs = paused
        ? Math.max(0, (this.workRemainSec || 0) * 1000)
        : Math.max(0, this.workEndsAt - Date.now())
      return timerRing.countdownRing(leftMs, budgetMs, !!paused)
    }
    if (phase === 'rest') {
      var totalMs = Math.max(1, (this.restTotalSec || 1) * 1000)
      var restLeftMs = Math.max(0, this.restEndsAt - Date.now())
      return timerRing.countdownRing(restLeftMs, totalMs, false)
    }
    return timerRing.idleRing()
  },

  apply(patch) {
    const next = Object.assign({}, this.data, patch || {})
    const phase = next.phase
    const paused = next.paused
    const budget = this.setWorkBudget(next.setIndex)
    let displayTime = next.timerText
    let unitHint = '准备开始'
    if (phase === 'rest') {
      displayTime = next.restText
      unitHint = '休息一下'
    } else if (phase === 'working') {
      displayTime = next.timerText
      unitHint = paused ? '已暂停' : '本组剩余'
    } else {
      unitHint = '准备好再开始'
      displayTime = next.timerText || formatMmSs(budget)
    }
    var ring = this.ringVisual(phase, paused)
    var curSet = this.currentSet(next.setIndex)
    var name = next.name
    if (curSet) {
      name = copy.moveName(this.displayNameForSet(curSet))
    }
    var kgPatch = {}
    if (curSet && patch && (patch.setIndex != null || patch.kg != null || patch.phase)) {
      if (curSet.bodyweight || (curSet.kind === 'accessory' && !curSet.kg)) {
        kgPatch.kg = 0
        kgPatch.kgLabel = '自重'
      } else {
        kgPatch.kgLabel = ''
      }
    }
    var progress = this.progressMeta(next.setIndex, (this.session && this.session.setPlan) || [])
    patch = Object.assign({}, patch || {}, ring, kgPatch, progress, {
      name: name,
      phaseLabel: this.phaseLabelForSet(curSet),
      displayTime: displayTime,
      unitHint: unitHint,
      targetInfo: this.setTargetInfo(curSet),
      subText: this.buildSubText(next.setIndex, next.totalSets, paused)
    })
    this.setData(patch)
  },

  onLoad(query) {
    this.setData({ navPadTop: customNavPadTopPx() })
    wx.setKeepScreenOn({ keepScreenOn: true })
    if (query.resume === '1') {
      const draft = storage.getDraft()
      if (!draft || draft.kind !== 'strength') {
        wx.showToast({ title: '没有可恢复的力量课', icon: 'none' })
        setTimeout(function () {
          wx.navigateBack()
        }, 500)
        return
      }
      this.restore(draft)
      return
    }
    const profile0 = storage.getProfile()
    const view0 = buildTodayView(profile0)
    const dayLog0 = quality.findDayLog(
      storage.getLogs(),
      quality.todayKey(),
      view0.slot && view0.slot.weekday
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
    const payload = wx.getStorageSync('af_ready_payload') || null
    this.initFresh(payload)
  },

  onUnload() {
    this.clearTimers()
    wx.setKeepScreenOn({ keepScreenOn: false })
  },

  initFresh(payload) {
    const profile = storage.getProfile()
    const view = buildTodayView(profile)
    const detail = view.detail
    if (!detail || !detail.main) {
      wx.showToast({ title: '今日不是力量日', icon: 'none' })
      return
    }
    const adj = (payload && payload.adjustments) || {}
    const applied = applyStrengthAdjustments(detail, adj)
    const main = applied.main
    const accessories = applied.accessories || []
    const setPlan = buildMainSetPlan(main).concat(buildAccessorySetPlan(accessories))
    const totalSets = setPlan.length || main.sets || 3
    const first = setPlan[0] || {
      kind: 'work',
      kg: main.kg != null ? main.kg : 60,
      reps: main.reps,
      restSec: main.restSec || 180
    }
    this.session = {
      kind: 'strength',
      date: (payload && payload.date) || quality.todayKey(),
      weekday: view.slot.weekday,
      name: main.name,
      totalSets: totalSets,
      setPlan: setPlan,
      workSets: main.sets || 3,
      workReps: main.reps,
      restSec: main.restSec || 180,
      adjustments: applied.adjustments,
      accessories: accessories,
      startedAt: Date.now(),
      restAddCount: 0
    }
    this.completedSets = []
    this.restAddCount = 0
    this.apply({
      phase: 'ready',
      name: copy.moveName(this.displayNameForSet(first)),
      setIndex: 0,
      totalSets: totalSets,
      reps: first.reps,
      kg: first.bodyweight ? 0 : first.kg,
      kgLabel: first.bodyweight ? '自重' : '',
      timerText: formatMmSs(this.setWorkBudget(0)),
      targetInfo: this.setTargetInfo(first),
      dots: this.makeDots(0, setPlan),
      paused: false,
      showExit: false,
      showCountdown: false
    })
    this.persistDraft('待开始')
  },

  restore(draft) {
    this.session = draft
    if (!this.session.setPlan || !this.session.setPlan.length) {
      this.session.setPlan = buildMainSetPlan({
        kg: draft.kg,
        sets: draft.workSets || draft.totalSets,
        reps: draft.workReps || draft.reps,
        restSec: draft.restSec
      }).concat(buildAccessorySetPlan(draft.accessories || []))
      this.session.totalSets = this.session.setPlan.length
    }
    this.completedSets = draft.completedSets || []
    this.restAddCount = Number(draft.restAddCount) || 0
    this.session.restAddCount = this.restAddCount
    const setIndex = draft.setIndex || 0
    const cur = this.currentSet(setIndex) || {
      kg: draft.kg,
      reps: draft.reps,
      kind: 'work'
    }
    const budget = this.setWorkBudget(setIndex)
    this.apply({
      phase: draft.phase || 'ready',
      name: copy.moveName(this.displayNameForSet(cur)),
      setIndex: setIndex,
      totalSets: this.session.totalSets,
      reps: cur.reps,
      kg: cur.bodyweight ? 0 : cur.kg,
      kgLabel: cur.bodyweight ? '自重' : '',
      timerText: formatMmSs(budget),
      targetInfo: this.setTargetInfo(cur),
      dots: this.makeDots(setIndex, this.session.setPlan),
      paused: false,
      showExit: false,
      showCountdown: false
    })
    if (draft.phase === 'working') {
      this.beginWorking(draft.workRemainSec != null ? draft.workRemainSec : budget)
    }
    if (draft.phase === 'rest') {
      var prev = this.session.setPlan[Math.max(0, setIndex - 1)]
      this.startRest(draft.restRemainSec || (prev && prev.restSec) || draft.restSec)
    }
  },

  makeDots(active, plan) {
    const list = plan || (this.session && this.session.setPlan) || []
    const arr = []
    for (let i = 0; i < list.length; i++) {
      var state = i < active ? 'done' : i === active ? 'on' : 'todo'
      if (list[i].kind === 'warmup') state += ' warm'
      arr.push(state)
    }
    return arr
  },

  progressMeta(active, plan) {
    var list = plan || (this.session && this.session.setPlan) || []
    var total = list.length || Number(this.data.totalSets) || 0
    var cur = Math.min(total, (Number(active) || 0) + 1)
    var compact = total > 8
    var pct = total > 0 ? Math.round((cur / total) * 100) : 0
    return {
      dotsCompact: compact,
      progressLabel: total > 0 ? cur + ' / ' + total : '',
      progressPct: pct
    }
  },

  persistDraft(summary) {
    if (!this.session) return
    storage.setDraft({
      kind: this.session.kind,
      date: this.session.date,
      weekday: this.session.weekday,
      name: this.session.name,
      totalSets: this.session.totalSets,
      setPlan: this.session.setPlan,
      workSets: this.session.workSets,
      workReps: this.session.workReps,
      reps: this.data.reps,
      restSec: this.session.restSec,
      adjustments: this.session.adjustments,
      accessories: this.session.accessories,
      startedAt: this.session.startedAt,
      updatedAt: Date.now(),
      kg: this.data.kg,
      setIndex: this.data.setIndex,
      phase: this.data.phase,
      completedSets: this.completedSets,
      restAddCount: this.restAddCount || 0,
      restRemainSec: this.restRemainSec,
      workRemainSec: this.workRemainSec,
      summary:
        summary ||
        this.session.name +
          ' ' +
          this.data.setIndex +
          '/' +
          this.session.totalSets +
          ' 组'
    })
  },

  clearCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    this.countdownTimer = null
  },

  clearTimers() {
    this.clearCountdown()
    if (this.timer) clearInterval(this.timer)
    if (this.restTimer) clearInterval(this.restTimer)
    this.timer = null
    this.restTimer = null
  },

  vibrateTick() {
    try {
      wx.vibrateShort({ type: 'medium' })
    } catch (e) {}
  },

  startSet() {
    if (this.data.showCountdown) return
    this.runCountdownThenWork()
  },

  nextSet() {
    if (this.data.showCountdown) return
    this.runCountdownThenWork()
  },

  runCountdownThenWork() {
    var that = this
    this.clearTimers()
    this.vibrateTick()
    this.setData({ showCountdown: true, countdownNum: 3 })
    var n = 3
    this.countdownTimer = setInterval(function () {
      n -= 1
      if (n <= 0) {
        that.clearCountdown()
        that.setData({ showCountdown: false })
        that.vibrateTick()
        that.beginWorking()
        return
      }
      that.vibrateTick()
      that.setData({ countdownNum: n })
    }, 1000)
  },

  completeGatePatch(elapsedSec) {
    var need = this.minUnlockSec || 30
    var left = Math.max(0, need - Math.floor(Number(elapsedSec) || 0))
    var can = left <= 0
    return {
      canComplete: can,
      unlockLeftSec: left,
      completeLabel: can ? '完成本组' : '完成本组 ' + left + 's'
    }
  },

  workElapsedSec() {
    var budget = this.workBudgetSec || this.setWorkBudget(this.data.setIndex)
    if (this.data.paused) {
      return Math.max(0, budget - (this.workRemainSec || 0))
    }
    var left = Math.max(0, Math.ceil((this.workEndsAt - Date.now()) / 1000))
    return Math.max(0, budget - left)
  },

  startWorkTicker() {
    var that = this
    if (this.timer) clearInterval(this.timer)
    this._lastPaintSec = null
    this.timer = setInterval(function () {
      that.paintWorkTick()
    }, RING_TICK_MS)
    this.paintWorkTick()
  },

  paintWorkTick() {
    if (this.data.phase !== 'working' || this.data.paused) return
    var leftMs = Math.max(0, this.workEndsAt - Date.now())
    var sec = Math.max(0, Math.ceil(leftMs / 1000))
    this.workRemainSec = sec
    var budgetMs = Math.max(1, (this.workBudgetSec || WORK_SET_SEC) * 1000)
    var ring = timerRing.countdownRing(leftMs, budgetMs, false)
    var gate = this.completeGatePatch(this.workElapsedSec())
    var patch = Object.assign({}, ring, gate)
    if (sec !== this._lastPaintSec) {
      this._lastPaintSec = sec
      patch.timerText = formatMmSs(sec)
      patch.displayTime = formatMmSs(sec)
      patch.unitHint = '本组剩余'
    }
    this.setData(patch)
    if (leftMs <= 0) {
      this.clearTimers()
      this.vibrateTick()
      this.apply(
        Object.assign(
          { timerText: '0:00', paused: false },
          this.completeGatePatch(this.workBudgetSec)
        )
      )
      this.persistDraft('本组时间到')
    }
  },

  beginWorking(remainSec) {
    this.clearTimers()
    var budget = this.setWorkBudget(this.data.setIndex)
    var left = remainSec != null ? remainSec : budget
    if (left < 0) left = 0
    if (left > budget) left = budget
    this.workBudgetSec = budget
    this.minUnlockSec = minWorkUnlockSec(budget)
    this.workRemainSec = left
    this.workEndsAt = Date.now() + left * 1000
    this.setStartedAt = Date.now() - (budget - left) * 1000
    this.activeElapsedBefore = budget - left
    var gate = this.completeGatePatch(this.activeElapsedBefore)
    this.apply(
      Object.assign(
        {
          phase: 'working',
          paused: false,
          timerText: formatMmSs(left),
          showCountdown: false
        },
        gate
      )
    )
    this.persistDraft('本组倒计时中')
    this.startWorkTicker()
  },

  togglePause() {
    if (this.data.phase !== 'working') return
    if (!this.data.paused) {
      var leftMs = Math.max(0, this.workEndsAt - Date.now())
      this.workRemainSec = Math.max(0, Math.ceil(leftMs / 1000))
      this.activeElapsedBefore = this.workElapsedSec()
      this.apply(
        Object.assign(
          { paused: true, timerText: formatMmSs(this.workRemainSec) },
          this.completeGatePatch(this.activeElapsedBefore)
        )
      )
      this.persistDraft('已暂停')
    } else {
      this.workEndsAt = Date.now() + this.workRemainSec * 1000
      this.apply({ paused: false })
      this.persistDraft('本组倒计时中')
      if (this.workRemainSec <= 0) {
        this.apply(this.completeGatePatch(this.workBudgetSec))
        return
      }
      this.startWorkTicker()
    }
  },

  endSet() {
    if (!this.data.canComplete) {
      wx.showToast({
        title: '再练 ' + (this.data.unlockLeftSec || 0) + ' 秒',
        icon: 'none'
      })
      return
    }
    this.clearTimers()
    const cur = this.currentSet(this.data.setIndex) || {
      kind: 'work',
      kg: this.data.kg,
      reps: this.data.reps,
      restSec: this.session.restSec
    }
    const budget = this.setWorkBudget(this.data.setIndex)
    const durationSec = Math.max(0, budget - (this.workRemainSec || 0))
    this.completedSets.push({
      index: this.data.setIndex + 1,
      kind: cur.kind || 'work',
      block: cur.block || '',
      label: rowLabel(cur),
      moveName: this.displayNameForSet(cur),
      kg: this.data.kg,
      reps: this.data.reps,
      durationSec: durationSec
    })
    const next = this.data.setIndex + 1
    if (next >= this.data.totalSets) {
      this.finishSession()
      return
    }
    const nextSet = this.currentSet(next) || {}
    this.apply({
      setIndex: next,
      phase: 'rest',
      kg: nextSet.bodyweight ? 0 : nextSet.kg,
      kgLabel: nextSet.bodyweight ? '自重' : '',
      reps: nextSet.reps,
      dots: this.makeDots(next, this.session.setPlan),
      targetInfo: this.setTargetInfo(nextSet)
    })
    this.startRest(cur.restSec || nextSet.restSec || this.session.restSec)
  },

  startRest(sec) {
    var that = this
    this.clearTimers()
    this.restTotalSec = sec
    this.restRemainSec = sec
    this.restEndsAt = Date.now() + sec * 1000
    this._lastRestPaintSec = null
    this.apply({ restText: formatMmSs(sec), phase: 'rest' })
    this.persistDraft('组间休息 ' + formatMmSs(sec))
    this.restTimer = setInterval(function () {
      that.paintRestTick()
    }, RING_TICK_MS)
    this.paintRestTick()
  },

  paintRestTick() {
    if (this.data.phase !== 'rest') return
    var leftMs = Math.max(0, this.restEndsAt - Date.now())
    var sec = Math.max(0, Math.ceil(leftMs / 1000))
    this.restRemainSec = sec
    var totalMs = Math.max(1, (this.restTotalSec || 1) * 1000)
    var ring = timerRing.countdownRing(leftMs, totalMs, false)
    var patch = Object.assign({}, ring)
    if (sec !== this._lastRestPaintSec) {
      this._lastRestPaintSec = sec
      patch.restText = formatMmSs(sec)
      patch.displayTime = formatMmSs(sec)
      patch.unitHint = '休息一下'
    }
    this.setData(patch)
    if (leftMs <= 0) this.clearTimers()
  },

  addRest() {
    if (this.data.phase !== 'rest' || this.data.showCountdown) return
    this.restEndsAt += 20000
    this.restRemainSec += 20
    this.restTotalSec += 20
    this.restAddCount = (this.restAddCount || 0) + 1
    if (this.session) this.session.restAddCount = this.restAddCount
    this._lastRestPaintSec = null
    this.paintRestTick()
    this.persistDraft()
  },

  finishSession() {
    this.clearTimers()
    const grade = scoreCompletedSession({
      kind: 'strength',
      restAddCount: this.restAddCount || 0
    })
    const log = {
      date: this.session.date,
      weekday: this.session.weekday,
      kind: 'strength',
      name: this.session.name,
      sets: this.completedSets,
      accessories: this.session.accessories,
      startedAt: this.session.startedAt,
      durationSec: Math.max(
        0,
        Math.round((Date.now() - (this.session.startedAt || Date.now())) / 1000)
      ),
      durationMin: Math.max(
        0,
        Math.round((Date.now() - (this.session.startedAt || Date.now())) / 60000)
      ),
      restAddCount: this.restAddCount || 0,
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
    if (this.data.showCountdown) {
      this.clearCountdown()
      this.setData({ showCountdown: false })
    }
    this.apply({ showExit: true })
    if (this.data.phase === 'working' && !this.data.paused) {
      this.togglePause()
    }
  },

  closeExit() {
    this.apply({ showExit: false })
  },

  saveExit() {
    this.persistDraft('已保存，可继续')
    this.apply({ showExit: false })
    wx.reLaunch({ url: '/pages/today/today' })
  },

  discardExit() {
    storage.clearDraft()
    this.apply({ showExit: false })
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
