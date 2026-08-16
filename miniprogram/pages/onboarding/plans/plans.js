const storage = require('../../../utils/storage')
const disclaimer = require('../../../services/disclaimer')
const { callRecommendPlans } = require('../../../services/api')
const {
  getWeekSlots,
  serializeWeekSlots,
  PLAN_OPTIONS,
  normalizeAuxiliaries
} = require('../../../services/plan')
const { estimateBlockGain } = require('../../../services/progress-target')
const cycleDay = require('../../../utils/cycle-day')
const copy = require('../../../utils/copy')

function planCatalog(id) {
  for (var i = 0; i < PLAN_OPTIONS.length; i++) {
    if (PLAN_OPTIONS[i].id === id) return PLAN_OPTIONS[i]
  }
  return null
}

/** 格子 = 建档日起连续 7 天（与今日页计划日映射一致） */
function cellsFromSlots(slots, dragFrom, dragOver, startKey) {
  var start = startKey || cycleDay.todayKey()
  return (slots || []).map(function (s, i) {
    var date = cycleDay.addDaysKey(start, i)
    var short = copy.slotLabelShort(s.label)
    return {
      day: cycleDay.dayLabelForDate(date),
      date: date,
      label: short,
      rest: s.type === 'rest' || s.label === '休' || short === '休' || short === '休息',
      dragging: dragFrom === i,
      dragOver: dragOver === i && dragFrom !== i
    }
  })
}

function mapPlansForUi(result, profile, startKey) {
  const selectedId = result.selectedId
  const aux = (profile && profile.auxiliaries) || []
  return (result.plans || []).map(function (p) {
    var cat = planCatalog(p.id) || {}
    var slots = getWeekSlots(p.id, aux)
    var gain = estimateBlockGain(Object.assign({}, profile || {}, { planId: p.id }))
    var resultLine = gain.summary || p.outcome || ''
    var blurb = p.meta || cat.meta || ''
    return {
      id: p.id,
      name: p.name,
      result: resultLine,
      blurb: blurb,
      weekSlots: serializeWeekSlots(slots),
      weekCells: cellsFromSlots(slots, -1, -1, startKey),
      selected: p.id === selectedId
    }
  })
}

function startKeyFor(when) {
  var today = cycleDay.todayKey()
  if (when === 'tomorrow') return cycleDay.addDaysKey(today, 1)
  return today
}

function dragHintFor(when) {
  if (when === 'tomorrow') {
    return '从明天起的 7 天。长按某一天拖到别的日子，就能把训练或休息换过去'
  }
  return '从今天起的 7 天。长按某一天拖到别的日子，就能把训练或休息换过去'
}

function confirmLabelFor(when) {
  return when === 'tomorrow' ? '就用这套，明天开始' : '就用这套，今天开始'
}

function hitCellIndex(rects, x, y) {
  if (!rects || !rects.length) return -1
  for (var i = 0; i < rects.length; i++) {
    var r = rects[i]
    if (!r) continue
    if (x >= r.left && x <= r.right && y >= r.top - 8 && y <= r.bottom + 8) {
      return i
    }
  }
  // 同一行：仅用 x 命中，避免手指略偏时丢目标
  for (var j = 0; j < rects.length; j++) {
    var c = rects[j]
    if (!c) continue
    if (x >= c.left && x <= c.right) return j
  }
  return -1
}

Page({
  behaviors: [require('../../../behaviors/immersive-nav')],

  data: {
    analyzing: true,
    plans: [],
    selectedId: '',
    isDragging: false,
    listEntered: false,
    listSettled: false,
    previewStart: '',
    startWhen: 'today',
    dragHint: '从今天起的 7 天。长按某一天拖到别的日子，就能把训练或休息换过去',
    confirmLabel: '就用这套，今天开始'
  },

  onLoad() {
    if (!disclaimer.ensureConsent()) return
    const profile = storage.getProfile() || {}
    var previewStart = startKeyFor('today')
    this.setData({
      analyzing: true,
      plans: [],
      selectedId: '',
      startWhen: 'today',
      previewStart: previewStart,
      dragHint: dragHintFor('today'),
      confirmLabel: confirmLabelFor('today')
    })
    this._drag = null

    var that = this
    var startedAt = Date.now()
    var MIN_ANALYZING_MS = 800

    setTimeout(function () {
      callRecommendPlans(profile).then(function (result) {
        var plans = mapPlansForUi(result, profile, previewStart)
        var wait = Math.max(0, MIN_ANALYZING_MS - (Date.now() - startedAt))
        setTimeout(function () {
          that.setData({
            analyzing: false,
            plans: plans,
            selectedId: result.selectedId,
            listEntered: false,
            listSettled: false
          })
          setTimeout(function () {
            that.setData({ listEntered: true })
            setTimeout(function () {
              that.setData({ listSettled: true })
            }, 420)
          }, 30)
          if (result.source !== 'cloud') {
            wx.showToast({ title: '暂时离线，先用本地推荐', icon: 'none' })
          }
        }, wait)
      })
    }, 50)
  },

  select(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const plans = this.data.plans.map(function (p) {
      return Object.assign({}, p, { selected: p.id === id })
    })
    this.setData({ selectedId: id, plans: plans })
  },

  selectStart(e) {
    var when = e.currentTarget.dataset.when
    if (when !== 'today' && when !== 'tomorrow') return
    if (when === this.data.startWhen) return
    var start = startKeyFor(when)
    var plans = this.data.plans.map(function (p) {
      return Object.assign({}, p, {
        weekCells: cellsFromSlots(p.weekSlots, -1, -1, start)
      })
    })
    this.setData({
      startWhen: when,
      previewStart: start,
      plans: plans,
      dragHint: dragHintFor(when),
      confirmLabel: confirmLabelFor(when)
    })
  },

  onWeekLongPress(e) {
    var planId = e.currentTarget.dataset.planId
    var index = Number(e.currentTarget.dataset.index)
    if (!planId || isNaN(index)) return

    if (this.data.selectedId !== planId) {
      this.select({ currentTarget: { dataset: { id: planId } } })
    }

    var that = this
    this._drag = {
      active: false,
      planId: planId,
      from: index,
      over: index
    }
    this._dragRects = null

    var query = wx.createSelectorQuery()
    query.selectAll('.week-cell-' + planId).boundingClientRect()
    query.exec(function (res) {
      if (!that._drag || that._drag.planId !== planId) return
      that._dragRects = (res && res[0]) || []
      if (!that._dragRects.length) {
        that._drag = null
        return
      }
      that._drag.active = true
      var over = index
      if (that._drag.pendingX != null) {
        var hit = hitCellIndex(
          that._dragRects,
          that._drag.pendingX,
          that._drag.pendingY
        )
        if (hit >= 0) over = hit
      }
      that._drag.over = over
      that._paintDrag(planId, index, over)
      that.setData({ isDragging: true })
      try {
        wx.vibrateShort({ type: 'light' })
      } catch (err) {}
    })
  },

  onWeekTouchMove(e) {
    if (!this._drag) return
    var touch = e.touches && e.touches[0]
    if (!touch) return
    this._drag.pendingX = touch.clientX
    this._drag.pendingY = touch.clientY

    // 长按后 rects 未就绪时先记下手指位置，就绪后再命中
    if (!this._drag.active || !this._dragRects || !this._dragRects.length) {
      return
    }

    var over = hitCellIndex(this._dragRects, touch.clientX, touch.clientY)
    if (over < 0) return
    if (over === this._drag.over) return
    this._drag.over = over
    this._paintDrag(this._drag.planId, this._drag.from, over)
  },

  onWeekTouchEnd() {
    if (!this._drag) {
      if (this.data.isDragging) this.setData({ isDragging: false })
      return
    }
    var planId = this._drag.planId
    var from = this._drag.from
    var to = this._drag.over
    var pendingX = this._drag.pendingX
    var pendingY = this._drag.pendingY
    var active = this._drag.active
    var rects = this._dragRects
    this._drag = null
    this._dragRects = null
    this.setData({ isDragging: false })

    if (!active) {
      this._paintDrag('', -1, -1)
      return
    }

    // 松手前若只移了一步且 over 仍是 from，用最后坐标再算一次
    if ((to == null || to === from) && rects && pendingX != null) {
      var hit = hitCellIndex(rects, pendingX, pendingY)
      if (hit >= 0) to = hit
    }

    if (to != null && to >= 0 && to !== from) {
      this._swapWeekSlots(planId, from, to)
    } else {
      this._paintDrag('', -1, -1)
    }
  },

  _paintDrag(planId, from, over) {
    var startKey = this.data.previewStart
    var plans = this.data.plans.map(function (p) {
      var f = p.id === planId ? from : -1
      var o = p.id === planId ? over : -1
      return Object.assign({}, p, {
        weekCells: cellsFromSlots(p.weekSlots, f, o, startKey)
      })
    })
    this.setData({ plans: plans })
  },

  _swapWeekSlots(planId, from, to) {
    var startKey = this.data.previewStart
    var plans = this.data.plans.map(function (p) {
      if (p.id !== planId) {
        return Object.assign({}, p, {
          weekCells: cellsFromSlots(p.weekSlots, -1, -1, startKey)
        })
      }
      var next = (p.weekSlots || []).slice()
      var tmp = next[from]
      next[from] = next[to]
      next[to] = tmp
      next = serializeWeekSlots(next)
      return Object.assign({}, p, {
        weekSlots: next,
        weekCells: cellsFromSlots(next, -1, -1, startKey)
      })
    })
    this.setData({ plans: plans })
  },

  confirm() {
    if (!this.data.selectedId) {
      wx.showToast({ title: '先选一个计划', icon: 'none' })
      return
    }
    var selectedId = this.data.selectedId
    var chosen = null
    for (var i = 0; i < this.data.plans.length; i++) {
      if (this.data.plans[i].id === selectedId) {
        chosen = this.data.plans[i]
        break
      }
    }
    const prev = storage.getProfile() || {}
    const start = this.data.previewStart || cycleDay.todayKey()
    storage.setProfile(
      Object.assign({}, prev, {
        planId: selectedId,
        auxiliaries: normalizeAuxiliaries(prev.auxiliaries),
        weekSlotsOverride: {
          planId: selectedId,
          slots: serializeWeekSlots((chosen && chosen.weekSlots) || [])
        },
        currentWeek: prev.currentWeek || 1,
        trainingWeekStart: start,
        cycleStartDate: start,
        completedBlocks: prev.completedBlocks || 0,
        onboardedAt: Date.now()
      })
    )
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
