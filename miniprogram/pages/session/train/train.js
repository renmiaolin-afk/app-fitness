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

/**
 * 杠铃换片耗时：组间重量变化时并入休息倒计时。
 * 蹲推拉 / 实力推等外负载组适用；自重动作不计。
 */
function plateChangeSec(fromSet, toSet) {
  if (!fromSet || !toSet) return 0
  if (fromSet.bodyweight || toSet.bodyweight) return 0
  var fromKg = Number(fromSet.kg)
  var toKg = Number(toSet.kg)
  if (!(fromKg > 0) || !(toKg > 0)) return 0
  var delta = Math.abs(toKg - fromKg)
  if (delta < 2.5) return 0
  if (delta >= 40) return 75
  if (delta >= 20) return 60
  if (delta >= 10) return 45
  return 30
}

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
    headMeta: '',
    targetInfo: '',
    metricKgLabel: '重量',
    metricKg: '—',
    metricKgUnit: '',
    metricRepsLabel: '次数',
    metricReps: '—',
    metricRepsUnit: '',
    phaseLabel: '',
    paused: false,
    timerHot: false,
    showExit: false,
    sheetOpen: false,
    dots: [],
    dotsCompact: false,
    progressLabel: '',
    progressPct: 0,
    showCountdown: false,
    countdownNum: 3,
    countdownPop: false,
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
  sheetCloseTimer: null,
  sheetOpenTimer: null,
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

  /** 双指标：上小标签 · 下大数字 */
  loadPresentation(set, phase) {
    var kgLabel = '重量'
    var kg = '—'
    var kgUnit = ''
    var repsLabel = '次数'
    var reps = '—'
    var repsUnit = ''
    if (phase === 'rest') {
      kgLabel = '下一组'
      repsLabel = '次数'
    } else if (phase === 'ready') {
      kgLabel = '本组'
      repsLabel = '次数'
    }
    if (set) {
      if (set.bodyweight || (set.kind === 'accessory' && !set.kg)) {
        kg = '自重'
        kgUnit = ''
      } else if (set.kg != null && set.kg !== '') {
        kg = String(set.kg)
        kgUnit = 'kg'
      }
      if (set.reps != null && set.reps !== '') {
        reps = String(set.reps)
        repsUnit = '次'
      }
    }
    return {
      metricKgLabel: kgLabel,
      metricKg: kg,
      metricKgUnit: kgUnit,
      metricRepsLabel: repsLabel,
      metricReps: reps,
      metricRepsUnit: repsUnit
    }
  },

  phaseLabelForSet(set) {
    if (!set) return ''
    if (set.kind === 'warmup') return '热身'
    if (set.kind === 'accessory') return '辅助'
    return ''
  },

  displayNameForSet(set) {
    if (set && set.kind === 'accessory' && set.moveName) return set.moveName
    return (this.session && this.session.name) || this.data.name || ''
  },

  /** 顶栏：深蹲 + 3/9 组 */
  buildHeadMeta(setIndex, totalSets, paused) {
    var total = totalSets || 0
    var cur = Math.min(total, (Number(setIndex) || 0) + 1)
    if (!(total > 0)) return paused ? '已暂停' : ''
    var text = cur + '/' + total + ' 组'
    if (paused) text += ' · 已暂停'
    return text
  },

  buildSubText(setIndex, totalSets, paused) {
    return this.buildHeadMeta(setIndex, totalSets, paused)
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
      unitHint = this._restIncludesPlate ? '休息 · 含换片' : '休息一下'
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
    var load = this.loadPresentation(curSet, phase)
    var headMeta = this.buildHeadMeta(next.setIndex, next.totalSets, paused)
    patch = Object.assign({}, patch || {}, ring, kgPatch, progress, load, {
      name: name,
      phaseLabel: this.phaseLabelForSet(curSet),
      displayTime: displayTime,
      unitHint: unitHint,
      targetInfo: this.setTargetInfo(curSet),
      headMeta: headMeta,
      subText: headMeta
    })
    this.setData(patch)
  },

  onLoad(query) {
    this.setData({ navPadTop: customNavPadTopPx() })
    wx.setKeepScreenOn({ keepScreenOn: true })
    if (query.resume === '1') {
      const draft = storage.getDraft()
      if (!draft || draft.kind !== 'strength') {
        wx.showToast({ title: '没有能接着练的力量课', icon: 'none' })
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
      wx.showToast({ title: '今天已经练完了', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 400)
      return
    }
    if (dayLog0 && dayLog0.kind === 'leave') {
      wx.showToast({ title: '今天已经请过假了', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack()
      }, 400)
      return
    }
    const payload = wx.getStorageSync('af_ready_payload') || null
    this.initFresh(payload)
  },

  onHide() {
    this._leftForeground = true
    if (this.session) this.persistDraft()
    // 后台会冻结 interval，回来后按绝对结束时间续跑
    this.clearTimers()
  },

  onShow() {
    if (!this.session) return
    this.resumeAfterForeground()
  },

  onUnload() {
    if (this.session) this.persistDraft()
    this.clearTimers()
    this.clearSheetTimers()
    wx.setKeepScreenOn({ keepScreenOn: false })
  },

  initFresh(payload) {
    const profile = storage.getProfile()
    const view = buildTodayView(profile)
    const detail = view.detail
    if (!detail || !detail.main) {
      wx.showToast({ title: '今天不是力量日', icon: 'none' })
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
      sheetOpen: false,
      showCountdown: false,
      countdownPop: false
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
    this._restIncludesPlate = !!draft.restIncludesPlate
    const setIndex = draft.setIndex || 0
    const cur = this.currentSet(setIndex) || {
      kg: draft.kg,
      reps: draft.reps,
      kind: 'work'
    }
    const budget = this.setWorkBudget(setIndex)
    var paused = !!draft.paused
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
      paused: paused,
      showExit: false,
      sheetOpen: false,
      showCountdown: false,
      countdownPop: false
    })
    if (draft.phase === 'working') {
      if (paused) {
        var remain =
          draft.workRemainSec != null ? draft.workRemainSec : budget
        this.beginWorking(remain, { paused: true, budget: draft.workBudgetSec })
      } else {
        this.beginWorking(null, {
          endsAt: Number(draft.workEndsAt) || 0,
          remainSec: draft.workRemainSec,
          budget: draft.workBudgetSec,
          fromBackground: true
        })
      }
    }
    if (draft.phase === 'rest') {
      var prev = this.session.setPlan[Math.max(0, setIndex - 1)]
      if (draft.restIncludesPlate == null) {
        this._restIncludesPlate = plateChangeSec(prev, cur) > 0
      }
      this.startRest(null, {
        endsAt: Number(draft.restEndsAt) || 0,
        remainSec: draft.restRemainSec,
        totalSec: draft.restTotalSec,
        fallbackSec: (prev && prev.restSec) || draft.restSec,
        fromBackground: true
      })
    }
  },

  /** 从后台回到前台：按绝对结束时间续跑 / 已结束则提醒 */
  resumeAfterForeground() {
    if (this.data.showCountdown) return
    var leftBg = !!this._leftForeground
    this._leftForeground = false
    if (this.data.phase === 'rest') {
      this.startRest(null, {
        endsAt: this.restEndsAt,
        totalSec: this.restTotalSec,
        remainSec: this.restRemainSec,
        fromBackground: leftBg
      })
      return
    }
    if (this.data.phase === 'working') {
      if (this.data.paused) {
        this.persistDraft('已暂停')
        return
      }
      this.beginWorking(null, {
        endsAt: this.workEndsAt,
        remainSec: this.workRemainSec,
        budget: this.workBudgetSec,
        fromBackground: leftBg
      })
    }
  },

  /** 休息/本组计时结束后的提醒（后台回来时弹窗；前台只震动） */
  notifyTimerEnded(kind, opts) {
    opts = opts || {}
    var endsAt = kind === 'rest' ? this.restEndsAt : this.workEndsAt
    var key = kind + ':' + String(endsAt || 0)
    if (this._notifiedTimerKey === key) return
    this._notifiedTimerKey = key
    this.vibrateTick()
    try {
      wx.vibrateLong({})
    } catch (e) {}
    if (!opts.modal) return
    var title = kind === 'rest' ? '休息时间到了' : '本组时间到了'
    var content =
      kind === 'rest' ? '可以接着干下一组了' : '可以点「完成本组」继续'
    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
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
    var pct = total > 0 ? Math.round((cur / total) * 100) : 0
    return {
      dotsCompact: true,
      progressLabel: total > 0 ? cur + ' / ' + total : '',
      progressPct: pct
    }
  },

  persistDraft(summary) {
    if (!this.session) return
    // 离开前按墙上时钟刷新剩余秒，避免草稿落后
    if (this.data.phase === 'rest' && this.restEndsAt) {
      this.restRemainSec = Math.max(
        0,
        Math.ceil((this.restEndsAt - Date.now()) / 1000)
      )
    }
    if (
      this.data.phase === 'working' &&
      !this.data.paused &&
      this.workEndsAt
    ) {
      this.workRemainSec = Math.max(
        0,
        Math.ceil((this.workEndsAt - Date.now()) / 1000)
      )
    }
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
      paused: !!this.data.paused,
      completedSets: this.completedSets,
      restAddCount: this.restAddCount || 0,
      restRemainSec: this.restRemainSec,
      restEndsAt: this.restEndsAt || 0,
      restTotalSec: this.restTotalSec || 0,
      restIncludesPlate: !!this._restIncludesPlate,
      workRemainSec: this.workRemainSec,
      workEndsAt: this.workEndsAt || 0,
      workBudgetSec: this.workBudgetSec || 0,
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

  bumpCountdownPop(num) {
    var that = this
    this.setData({ countdownNum: num, countdownPop: false })
    setTimeout(function () {
      that.setData({ countdownPop: true })
    }, 20)
  },

  runCountdownThenWork() {
    var that = this
    this.clearTimers()
    this.vibrateTick()
    this.setData({ showCountdown: true })
    this.bumpCountdownPop(3)
    var n = 3
    this.countdownTimer = setInterval(function () {
      n -= 1
      if (n <= 0) {
        that.clearCountdown()
        that.setData({ showCountdown: false, countdownPop: false })
        that.vibrateTick()
        that.beginWorking()
        return
      }
      that.vibrateTick()
      that.bumpCountdownPop(n)
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
      this.notifyTimerEnded('work', { modal: false })
      this.apply(
        Object.assign(
          { timerText: '0:00', paused: false },
          this.completeGatePatch(this.workBudgetSec)
        )
      )
      this.persistDraft('本组时间到')
    }
  },

  beginWorking(remainSec, opts) {
    opts = opts || {}
    this.clearTimers()
    if (!opts.endsAt && !opts.fromBackground) this._notifiedTimerKey = ''
    var budget =
      opts.budget != null && opts.budget > 0
        ? Number(opts.budget)
        : this.setWorkBudget(this.data.setIndex)
    var left
    var endsAt = Number(opts.endsAt) || 0
    if (endsAt > 0 && !opts.paused) {
      left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      this.workEndsAt = endsAt
    } else if (remainSec != null) {
      left = remainSec
    } else if (opts.remainSec != null) {
      left = Number(opts.remainSec)
    } else {
      left = budget
    }
    if (left < 0) left = 0
    if (left > budget) left = budget
    this.workBudgetSec = budget
    this.minUnlockSec = minWorkUnlockSec(budget)
    this.workRemainSec = left
    if (!(endsAt > 0) || opts.paused) {
      this.workEndsAt = Date.now() + left * 1000
    }
    this.setStartedAt = Date.now() - (budget - left) * 1000
    this.activeElapsedBefore = budget - left
    var gate = this.completeGatePatch(this.activeElapsedBefore)
    this.apply(
      Object.assign(
        {
          phase: 'working',
          paused: !!opts.paused,
          timerText: formatMmSs(left),
          displayTime: formatMmSs(left),
          unitHint: opts.paused ? '已暂停' : left <= 0 ? '本组时间到' : '本组剩余',
          showCountdown: false
        },
        gate
      )
    )
    this.persistDraft(opts.paused ? '已暂停' : '本组倒计时中')
    if (opts.paused) return
    if (left <= 0) {
      this.apply(
        Object.assign(
          { timerText: '0:00', displayTime: '0:00', paused: false },
          this.completeGatePatch(this.workBudgetSec)
        )
      )
      this.notifyTimerEnded('work', { modal: !!opts.fromBackground })
      return
    }
    this.startWorkTicker()
  },

  togglePause() {
    if (this.data.phase !== 'working') return
    if (!this.data.paused) {
      var leftMs = Math.max(0, this.workEndsAt - Date.now())
      this.workRemainSec = Math.max(0, Math.ceil(leftMs / 1000))
      this.activeElapsedBefore = this.workElapsedSec()
      this.clearTimers()
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
    var baseRest = cur.restSec || nextSet.restSec || this.session.restSec
    var plateSec = plateChangeSec(cur, nextSet)
    this._restIncludesPlate = plateSec > 0
    this.startRest(baseRest + plateSec)
  },

  /**
   * @param {number|null} sec 新开休息的秒数；恢复时传 null，用 opts.endsAt
   * @param {object} [opts]
   */
  startRest(sec, opts) {
    opts = opts || {}
    this.clearTimers()
    if (sec != null && !opts.fromBackground) this._notifiedTimerKey = ''
    var endsAt = Number(opts.endsAt) || 0
    var total
    var left
    if (endsAt > 0) {
      left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      total =
        opts.totalSec != null && opts.totalSec > 0
          ? Number(opts.totalSec)
          : Math.max(left, Number(opts.remainSec) || left || 1)
      this.restEndsAt = endsAt
    } else if (sec != null) {
      left = Math.max(0, Number(sec) || 0)
      total = left
      this.restEndsAt = Date.now() + left * 1000
    } else if (opts.remainSec != null) {
      left = Math.max(0, Number(opts.remainSec) || 0)
      total =
        opts.totalSec != null && opts.totalSec > 0
          ? Number(opts.totalSec)
          : left
      this.restEndsAt = Date.now() + left * 1000
    } else {
      left = Math.max(0, Number(opts.fallbackSec) || 180)
      total = left
      this.restEndsAt = Date.now() + left * 1000
    }
    if (total < left) total = left
    if (total <= 0) total = 1
    this.restTotalSec = total
    this.restRemainSec = left
    this._lastRestPaintSec = null
    var hint = this._restIncludesPlate ? '休息 · 含换片' : '休息一下'
    if (left <= 0) hint = '休息结束'
    this.apply({
      restText: formatMmSs(left),
      displayTime: formatMmSs(left),
      phase: 'rest',
      unitHint: hint
    })
    var draftLabel =
      left <= 0
        ? '休息结束'
        : this._restIncludesPlate
          ? '组间休息（含换片） ' + formatMmSs(left)
          : '组间休息 ' + formatMmSs(left)
    this.persistDraft(draftLabel)
    if (left <= 0) {
      this.notifyTimerEnded('rest', { modal: !!opts.fromBackground })
      return
    }
    var that = this
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
      patch.unitHint = this._restIncludesPlate ? '休息 · 含换片' : '休息一下'
    }
    this.setData(patch)
    if (leftMs <= 0) {
      this.clearTimers()
      this.notifyTimerEnded('rest', { modal: false })
      this.setData({
        unitHint: '休息结束',
        restText: '0:00',
        displayTime: '0:00'
      })
      this.persistDraft('休息结束')
    }
  },

  addRest() {
    if (this.data.phase !== 'rest' || this.data.showCountdown) return
    // 已结束时 +20 相当于重新开 20s
    if ((this.restRemainSec || 0) <= 0 && this.restEndsAt <= Date.now()) {
      this.restEndsAt = Date.now() + 20000
      this.restRemainSec = 20
      this.restTotalSec = 20
    } else {
      this.restEndsAt += 20000
      this.restRemainSec += 20
      this.restTotalSec += 20
    }
    this.restAddCount = (this.restAddCount || 0) + 1
    if (this.session) this.session.restAddCount = this.restAddCount
    this._lastRestPaintSec = null
    this._notifiedTimerKey = ''
    this.persistDraft()
    if (!this.restTimer) {
      var that = this
      this.restTimer = setInterval(function () {
        that.paintRestTick()
      }, RING_TICK_MS)
    }
    this.paintRestTick()
  },

  finishSession() {
    this.clearTimers()
    const grade = scoreCompletedSession({
      kind: 'strength',
      restAddCount: this.restAddCount || 0
    })
    const durationSec = Math.max(
      0,
      Math.round((Date.now() - (this.session.startedAt || Date.now())) / 1000)
    )
    const log = {
      date: this.session.date,
      weekday: this.session.weekday,
      kind: 'strength',
      name: this.session.name,
      sets: this.completedSets,
      accessories: this.session.accessories,
      startedAt: this.session.startedAt,
      durationSec: durationSec,
      durationMin: Math.max(0, Math.round(durationSec / 60)),
      restAddCount: this.restAddCount || 0,
      score: grade.score,
      title: grade.title,
      finishedAt: Date.now()
    }
    const cal = require('../../../services/calories').estimateSessionCalories(
      log,
      storage.getProfile()
    )
    if (cal.kcal > 0) {
      log.kcal = cal.kcal
      log.kcalText = cal.text
    }
    storage.appendLog(log)
    storage.clearDraft()
    wx.setStorageSync('af_summary', log)
    wx.redirectTo({ url: '/pages/session/summary/summary' })
  },

  clearSheetTimers() {
    if (this.sheetCloseTimer) {
      clearTimeout(this.sheetCloseTimer)
      this.sheetCloseTimer = null
    }
    if (this.sheetOpenTimer) {
      clearTimeout(this.sheetOpenTimer)
      this.sheetOpenTimer = null
    }
  },

  openExit() {
    var that = this
    if (this.data.showCountdown) {
      this.clearCountdown()
      this.setData({ showCountdown: false, countdownPop: false })
    }
    this.clearSheetTimers()
    this.apply({ showExit: true, sheetOpen: false })
    this.sheetOpenTimer = setTimeout(function () {
      that.apply({ sheetOpen: true })
      that.sheetOpenTimer = null
    }, 20)
    if (this.data.phase === 'working' && !this.data.paused) {
      this.togglePause()
    }
  },

  closeExit() {
    var that = this
    if (!this.data.showExit) return
    this.clearSheetTimers()
    this.apply({ sheetOpen: false })
    this.sheetCloseTimer = setTimeout(function () {
      that.apply({ showExit: false })
      that.sheetCloseTimer = null
    }, 240)
  },

  saveExit() {
    this.clearSheetTimers()
    this.persistDraft('已保存，可继续')
    this.apply({ showExit: false, sheetOpen: false })
    wx.reLaunch({ url: '/pages/today/today' })
  },

  discardExit() {
    this.clearSheetTimers()
    storage.clearDraft()
    this.apply({ showExit: false, sheetOpen: false })
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
