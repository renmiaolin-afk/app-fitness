const storage = require('../../../utils/storage')
const { buildTodayView } = require('../../../services/plan')
const { formatMmSs } = require('../../../utils/format')
const copy = require('../../../utils/copy')
const { applyStrengthAdjustments } = require('../../../services/ready-adjust')
const { buildMainSetPlan, rowLabel } = require('../../../services/warmup-sets')
const { customNavPadTopPx } = require('../../../utils/nav')

/** 工作组倒计时：2 分钟；热身组更短 */
var WORK_SET_SEC = 120
var WARMUP_SET_SEC = 60
var RING_IDLE = 'rgba(255,255,255,0.22)'
var RING_HOT = '#ff2d55'
var RING_REST = '#ffffff'

Page({
  data: {
    navPadTop: 64,
    phase: 'ready',
    name: '',
    setIndex: 0,
    totalSets: 3,
    reps: 4,
    kg: 155,
    timerText: '2:00',
    restText: '5:00',
    displayTime: '2:00',
    unitHint: '准备开始',
    subText: '',
    targetInfo: '',
    paused: false,
    pauseText: '暂停',
    timerHot: false,
    showExit: false,
    dots: [],
    moveSheetShow: false,
    showCountdown: false,
    countdownNum: 3,
    ringPct: 0,
    ringColor: RING_IDLE
  },

  timer: null,
  restTimer: null,
  countdownTimer: null,
  setStartedAt: 0,
  workEndsAt: 0,
  workRemainSec: WORK_SET_SEC,
  restEndsAt: 0,
  restRemainSec: 0,
  restTotalSec: 0,
  session: null,
  completedSets: [],

  noop() {},

  openMoveSheet() {
    if (!this.data.name) return
    this.setData({ moveSheetShow: true })
  },

  closeMoveSheet() {
    this.setData({ moveSheetShow: false })
  },

  setWorkBudget(setIndex) {
    var set = this.currentSet(setIndex)
    return set && set.kind === 'warmup' ? WARMUP_SET_SEC : WORK_SET_SEC
  },

  currentSet(setIndex) {
    var plan = (this.session && this.session.setPlan) || []
    var i = setIndex != null ? setIndex : this.data.setIndex
    return plan[i] || null
  },

  setTargetInfo(set) {
    if (!set) return ''
    if (set.kind === 'warmup') return '热身 · 本组做 ' + set.reps + ' 次'
    var label = rowLabel(set)
    if (label && label !== '工作') return label + ' · 本组做 ' + set.reps + ' 次'
    return '本组做 ' + set.reps + ' 次'
  },

  buildSubText(setIndex, totalSets, paused) {
    var plan = (this.session && this.session.setPlan) || []
    var set = plan[setIndex]
    var text
    if (set && set.kind === 'warmup') {
      var wi = 0
      var wt = 0
      for (var i = 0; i < plan.length; i++) {
        if (plan[i].kind === 'warmup') {
          wt++
          if (i <= setIndex) wi++
        }
      }
      text = '热身 ' + wi + '/' + wt
    } else if (set && set.block && set.block !== 'work') {
      var bi = 0
      var bt = 0
      for (var j = 0; j < plan.length; j++) {
        if (plan[j].block === set.block) {
          bt++
          if (j <= setIndex) bi++
        }
      }
      text = rowLabel(set) + ' ' + bi + '/' + bt + ' · 共 ' + totalSets + ' 组'
    } else if (set && set.kind === 'work') {
      var wki = 0
      var wkt = 0
      for (var k = 0; k < plan.length; k++) {
        if (plan[k].kind === 'work') {
          wkt++
          if (k <= setIndex) wki++
        }
      }
      text = '工作 ' + wki + '/' + wkt + ' · 共 ' + totalSets + ' 组'
    } else {
      text = '第 ' + (setIndex + 1) + ' 组 · 共 ' + totalSets + ' 组'
    }
    if (paused) text += ' · 已暂停'
    return text
  },

  ringState(phase, leftSec, paused, budgetSec) {
    var pct = 0
    var color = RING_IDLE
    var budget = budgetSec || WORK_SET_SEC
    if (phase === 'working') {
      pct = Math.max(0, Math.min(100, Math.round(((leftSec || 0) / budget) * 100)))
      color = RING_HOT
    } else if (phase === 'rest') {
      var total = this.restTotalSec || 1
      pct = Math.max(0, Math.min(100, Math.round(((leftSec || 0) / total) * 100)))
      color = RING_REST
    } else if (phase === 'ready') {
      pct = 100
      color = RING_IDLE
    }
    return { ringPct: pct, ringColor: color, timerHot: phase === 'working' && !paused }
  },

  apply(patch) {
    const next = Object.assign({}, this.data, patch || {})
    const phase = next.phase
    const paused = next.paused
    const budget = this.setWorkBudget(next.setIndex)
    let displayTime = next.timerText
    let unitHint = '准备开始'
    let leftSec = 0
    if (phase === 'rest') {
      displayTime = next.restText
      unitHint = '组间休息'
      leftSec = this.restRemainSec
    } else if (phase === 'working') {
      displayTime = next.timerText
      unitHint = paused ? '已暂停' : '本组剩余'
      leftSec = this.workRemainSec
    } else {
      unitHint = '待开始'
      displayTime = next.timerText || formatMmSs(budget)
      leftSec = budget
    }
    var ring = this.ringState(phase, leftSec, paused, budget)
    patch = Object.assign({}, patch || {}, ring, {
      displayTime: displayTime,
      unitHint: unitHint,
      subText: this.buildSubText(next.setIndex, next.totalSets, paused),
      pauseText: paused ? '继续' : '暂停'
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
    const setPlan = buildMainSetPlan(main)
    const totalSets = setPlan.length || main.sets || 3
    const first = setPlan[0] || {
      kind: 'work',
      kg: main.kg != null ? main.kg : 60,
      reps: main.reps,
      restSec: main.restSec || 180
    }
    this.session = {
      kind: 'strength',
      date: (payload && payload.date) || new Date().toISOString().slice(0, 10),
      weekday: view.slot.weekday,
      name: main.name,
      totalSets: totalSets,
      setPlan: setPlan,
      workSets: main.sets || 3,
      workReps: main.reps,
      restSec: main.restSec || 180,
      adjustments: applied.adjustments,
      accessories: applied.accessories || [],
      startedAt: Date.now()
    }
    this.completedSets = []
    this.apply({
      phase: 'ready',
      name: copy.moveName(main.name),
      setIndex: 0,
      totalSets: totalSets,
      reps: first.reps,
      kg: first.kg,
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
      })
      this.session.totalSets = this.session.setPlan.length
    }
    this.completedSets = draft.completedSets || []
    const setIndex = draft.setIndex || 0
    const cur = this.currentSet(setIndex) || {
      kg: draft.kg,
      reps: draft.reps,
      kind: 'work'
    }
    const budget = this.setWorkBudget(setIndex)
    this.apply({
      phase: draft.phase || 'ready',
      name: draft.name,
      setIndex: setIndex,
      totalSets: this.session.totalSets,
      reps: cur.reps,
      kg: cur.kg,
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
      kg: this.data.kg,
      setIndex: this.data.setIndex,
      phase: this.data.phase,
      completedSets: this.completedSets,
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

  beginWorking(remainSec) {
    var that = this
    this.clearTimers()
    var budget = this.setWorkBudget(this.data.setIndex)
    var left = remainSec != null ? remainSec : budget
    if (left < 0) left = 0
    if (left > budget) left = budget
    this.workRemainSec = left
    this.workEndsAt = Date.now() + left * 1000
    this.setStartedAt = Date.now() - (budget - left) * 1000
    this.apply({
      phase: 'working',
      paused: false,
      timerText: formatMmSs(left),
      showCountdown: false
    })
    this.persistDraft('本组倒计时中')
    this.timer = setInterval(function () {
      if (that.data.paused) return
      var sec = Math.max(0, Math.ceil((that.workEndsAt - Date.now()) / 1000))
      that.workRemainSec = sec
      that.apply({ timerText: formatMmSs(sec) })
      if (sec <= 0) {
        that.clearTimers()
        that.vibrateTick()
        that.apply({ timerText: '0:00', paused: false })
        that.persistDraft('本组时间到')
      }
    }, 200)
  },

  togglePause() {
    if (this.data.phase !== 'working') return
    if (!this.data.paused) {
      this.workRemainSec = Math.max(0, Math.ceil((this.workEndsAt - Date.now()) / 1000))
      this.apply({ paused: true, timerText: formatMmSs(this.workRemainSec) })
      this.persistDraft('已暂停')
    } else {
      this.workEndsAt = Date.now() + this.workRemainSec * 1000
      this.apply({ paused: false })
      this.persistDraft('本组倒计时中')
      if (this.workRemainSec <= 0) return
      var that = this
      if (!this.timer) {
        this.timer = setInterval(function () {
          if (that.data.paused) return
          var sec = Math.max(0, Math.ceil((that.workEndsAt - Date.now()) / 1000))
          that.workRemainSec = sec
          that.apply({ timerText: formatMmSs(sec) })
          if (sec <= 0) {
            that.clearTimers()
            that.vibrateTick()
            that.apply({ timerText: '0:00' })
            that.persistDraft('本组时间到')
          }
        }, 200)
      }
    }
  },

  endSet() {
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
      kg: this.data.kg,
      reps: this.data.reps,
      durationSec: durationSec
    })
    const next = this.data.setIndex + 1
    if (next >= this.data.totalSets) {
      this.finishSession()
      return
    }
    const nextSet = this.currentSet(next)
    this.apply({
      setIndex: next,
      phase: 'rest',
      kg: nextSet.kg,
      reps: nextSet.reps,
      dots: this.makeDots(next, this.session.setPlan),
      targetInfo: this.setTargetInfo(nextSet)
    })
    this.startRest(cur.restSec || this.session.restSec)
  },

  startRest(sec) {
    const that = this
    this.clearTimers()
    this.restTotalSec = sec
    this.restRemainSec = sec
    this.restEndsAt = Date.now() + sec * 1000
    this.apply({ restText: formatMmSs(sec), phase: 'rest' })
    this.persistDraft('组间休息 ' + formatMmSs(sec))
    this.restTimer = setInterval(function () {
      const left = Math.max(0, Math.ceil((that.restEndsAt - Date.now()) / 1000))
      that.restRemainSec = left
      that.apply({ restText: formatMmSs(left) })
      if (left <= 0) that.clearTimers()
    }, 200)
  },

  addRest() {
    if (this.data.phase !== 'rest' || this.data.showCountdown) return
    this.restEndsAt += 20000
    this.restRemainSec += 20
    this.restTotalSec += 20
    this.apply({ restText: formatMmSs(this.restRemainSec) })
    this.persistDraft()
  },

  finishSession() {
    this.clearTimers()
    const log = {
      date: this.session.date,
      weekday: this.session.weekday,
      kind: 'strength',
      name: this.session.name,
      sets: this.completedSets,
      accessories: this.session.accessories,
      durationMin: Math.round((Date.now() - this.session.startedAt) / 60000),
      score: 90,
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
