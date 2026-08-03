/**
 * 动作示范内容。
 * videos[].src 需配置到小程序后台「下载合法域名」；开发阶段可用真机调试忽略校验。
 * 上线前替换为你们 CDN / 云点播地址。
 */
var DEMO =
  'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4'

var CATALOG = {
  深蹲: {
    title: '深蹲',
    cues: ['脚距约与肩同宽，脚尖略外展', '髋膝同步下蹲，膝沿脚尖方向', '保持躯干刚性，完成完整幅度'],
    videos: [
      { title: '杠铃深蹲示范', src: DEMO },
      { title: '常见错误纠正', src: DEMO }
    ]
  },
  卧推: {
    title: '卧推',
    cues: ['肩胛后收下沉，五点支撑', '杠触及胸骨中下段后推起', '肘与躯干夹角约 45°–70°'],
    videos: [
      { title: '杠铃卧推示范', src: DEMO },
      { title: '肩胛稳定要点', src: DEMO }
    ]
  },
  硬拉: {
    title: '硬拉',
    cues: ['杠贴近小腿，肩在杠前上方', '腿蹬地起，髋锁定完成', '下放保持背平，勿塌腰借力'],
    videos: [
      { title: '传统硬拉示范', src: DEMO },
      { title: '启动与锁定', src: DEMO }
    ]
  },
  实力推: {
    title: '实力推',
    cues: ['严格站姿，不借腿借腰', '杠路径贴近面部推至锁定', '核心收紧，肘完全伸直'],
    videos: [{ title: '实力推示范', src: DEMO }]
  },
  罗马尼亚硬拉: {
    title: '罗马尼亚硬拉',
    cues: ['微屈膝，髋主导后移', '杠贴近大腿下行至腘绳张力位', '伸髋站起，勿圆背甩杠'],
    videos: [{ title: 'RDL 示范', src: DEMO }]
  },
  腿举: {
    title: '腿举',
    cues: ['腰贴靠背，全程可控', '膝随脚尖方向屈伸', '底部保留张力，顶峰不完全锁死借力'],
    videos: [{ title: '腿举示范', src: DEMO }]
  },
  悬垂举腿: {
    title: '悬垂举腿',
    cues: ['肩胛稳定悬挂，避免甩腿', '屈髋举腿至目标幅度', '控制下放，腹直肌持续发力'],
    videos: [{ title: '悬垂举腿示范', src: DEMO }]
  },
  核心: {
    title: '悬垂举腿',
    cues: ['肩胛稳定悬挂，避免甩腿', '屈髋举腿至目标幅度', '控制下放，腹直肌持续发力'],
    videos: [{ title: '悬垂举腿示范', src: DEMO }]
  },
  绳索面拉: {
    title: '绳索面拉',
    cues: ['肘高位外展，拉向面部', '肩外旋收紧上背', '避免耸肩与腰部代偿'],
    videos: [{ title: '面拉示范', src: DEMO }]
  },
  面拉: {
    title: '绳索面拉',
    cues: ['肘高位外展，拉向面部', '肩外旋收紧上背', '避免耸肩与腰部代偿'],
    videos: [{ title: '面拉示范', src: DEMO }]
  },
  绳索三头下压: {
    title: '绳索三头下压',
    cues: ['上臂贴肋固定', '仅前臂伸展完成动作', '顶峰充分伸肘，下放可控'],
    videos: [{ title: '三头下压示范', src: DEMO }]
  },
  三头下压: {
    title: '绳索三头下压',
    cues: ['上臂贴肋固定', '仅前臂伸展完成动作', '顶峰充分伸肘，下放可控'],
    videos: [{ title: '三头下压示范', src: DEMO }]
  },
  杠铃臀推: {
    title: '杠铃臀推',
    cues: ['上背靠垫，杠置于髋部', '伸髋至躯干与大腿一线', '顶峰臀肌收缩，下放不借腰反弓'],
    videos: [{ title: '臀推示范', src: DEMO }]
  },
  臀推: {
    title: '杠铃臀推',
    cues: ['上背靠垫，杠置于髋部', '伸髋至躯干与大腿一线', '顶峰臀肌收缩，下放不借腰反弓'],
    videos: [{ title: '臀推示范', src: DEMO }]
  },
  哑铃侧平举: {
    title: '哑铃侧平举',
    cues: ['微屈肘，向侧上方抬至肩平', '以三角肌中束主导', '避免耸肩与甩臂借力'],
    videos: [{ title: '侧平举示范', src: DEMO }]
  },
  侧平举: {
    title: '哑铃侧平举',
    cues: ['微屈肘，向侧上方抬至肩平', '以三角肌中束主导', '避免耸肩与甩臂借力'],
    videos: [{ title: '侧平举示范', src: DEMO }]
  },
  窄握卧推: {
    title: '窄握卧推',
    cues: ['握距窄于常规卧推', '肘贴近躯干下行', '推起至伸肘，强调三头发力'],
    videos: [{ title: '窄握卧推示范', src: DEMO }]
  },
  潘德勒划船: {
    title: '潘德勒划船',
    cues: ['躯干接近水平，每下地板停稳', '爆发拉至下胸/上腹', '不借甩，保持背平'],
    videos: [{ title: '潘德勒划船示范', src: DEMO }]
  },
  引体向上: {
    title: '引体向上',
    cues: ['悬垂开始，肩胛先启动', '下巴过杠，完整幅度', '控制下放至伸臂'],
    videos: [{ title: '引体向上示范', src: DEMO }]
  }
}

function getMoveMedia(name) {
  if (!name) return null
  var item = CATALOG[name]
  if (item) return item
  // 兼容「动作名（说明）」
  var base = String(name).replace(/（.*）/, '').replace(/\(.*\)/, '').trim()
  return CATALOG[base] || {
    title: name,
    cues: ['保持完整幅度与稳定节奏', '按处方组次数完成', '动作变形时立即减重'],
    videos: [{ title: '动作示范', src: DEMO }]
  }
}

module.exports = {
  getMoveMedia: getMoveMedia,
  CATALOG: CATALOG
}
