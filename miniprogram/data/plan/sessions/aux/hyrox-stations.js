module.exports = {
  "id": "hyrox-stations",
  "auxId": "hyrox",
  "name": "Hyrox 站技轻课",
  "durationMin": 28,
  "rpeCap": 7,
  "intensityModes": {
    "default": "stations_plus_easy_run",
    "technique": "stations_only_light"
  },
  "blocks": [
    {
      "name": "轻松跑过渡",
      "minutes": 8,
      "distanceKm": 1.2,
      "mode": "default",
      "cues": [
        "Zone2",
        "模拟赛后进站前的呼吸节奏"
      ]
    },
    {
      "name": "站技 1–2 项",
      "minutes": 16,
      "stationCount": 2,
      "picks": [
        "sled_push_light",
        "sled_pull_light",
        "farmer_carry",
        "wall_ball",
        "lunges_sandbag"
      ],
      "cues": [
        "负荷低于比赛重量",
        "质量与节奏，不追求力竭",
        "technique 模式只做站技、取消跑段"
      ]
    },
    {
      "name": "收尾",
      "minutes": 4,
      "distanceKm": 0.4,
      "cues": [
        "散步降心率",
        "髋屈肌与小腿放松"
      ]
    }
  ],
  "scaling": {
    "technique": {
      "durationMin": 20,
      "skipRun": true
    },
    "default": {
      "durationMin": 28
    }
  }
}
