Component({
  options: {
    virtualHost: true,
    styleIsolation: 'isolated'
  },

  properties: {
    /** 0–1，随计时紧迫度调整亮度/呼吸节奏；色相固定品牌红 */
    intensity: {
      type: Number,
      value: 0.55
    }
  },

  observers: {
    intensity: function (intensity) {
      this.applyIntensity(intensity)
    }
  },

  data: {
    wrapStyle: ''
  },

  lifetimes: {
    attached() {
      this.applyIntensity(this.data.intensity)
    }
  },

  methods: {
    applyIntensity(intensity) {
      var t = Number(intensity)
      if (isNaN(t)) t = 0.55
      if (t < 0.25) t = 0.25
      if (t > 1) t = 1
      var durA = (22 - t * 14).toFixed(1) + 's'
      var durB = (28 - t * 16).toFixed(1) + 's'
      this.setData({
        wrapStyle:
          'opacity:' +
          (0.55 + t * 0.45).toFixed(3) +
          ';--glow-dur-a:' +
          durA +
          ';--glow-dur-b:' +
          durB +
          ';'
      })
    }
  }
})
