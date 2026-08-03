const { getMoveMedia } = require('../../data/move-media')

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    moveName: {
      type: String,
      value: ''
    }
  },

  data: {
    media: {
      title: '',
      cues: [],
      videos: []
    }
  },

  observers: {
    'show, moveName': function (show, moveName) {
      if (!show || !moveName) return
      var media = getMoveMedia(moveName)
      this.setData({ media: media })
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close')
    },

    onAfterLeave() {
      // 与 page-container 状态同步
      this.triggerEvent('close')
    },

    onVideoError() {
      wx.showToast({
        title: '视频暂不可播，先看要点',
        icon: 'none'
      })
    }
  }
})
