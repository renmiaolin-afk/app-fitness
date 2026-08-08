module.exports = {
  "version": 4,
  "description": "辅助组合 → 七天槽位。辅助仅单选（CF / Hyrox / AthX）。四套力量举均含每周肩背专项日。",
  "keyRule": "将用户所选 aux id 按字母序排序后用 + 拼接；空选为 none",
  "basePlan": "strength-hybrid-mix",
  "dayTypes": {
    "strength": "力量主课",
    "aux_high": "高强度辅助（CF / Hyrox / AthX）",
    "aux_zone2": "轻松有氧辅助（已弃用）",
    "aux_low": "低强度技术/恢复（双硬辅冲突时降级用）",
    "rest": "休息"
  },
  "plans": {
    "strength-hybrid-mix": {
      "name": "挪威高频",
      "badge": "涨力快",
      "meta": "每周蹲推拉更密 + 肩背；恢复好时三大项涨得最快",
      "combinations": {
        "none": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "strength",
            "key": "deadlift_light",
            "label": "轻拉"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "crossfit": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "hyrox": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "hyrox",
            "label": "Hyrox",
            "session": "sessions/aux/hyrox-stations.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "athx": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "athx",
            "label": "AthX",
            "session": "sessions/aux/athx-hybrid.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ]
      }
    },
    "strength-linear": {
      "name": "线性加重",
      "badge": "打基础",
      "meta": "蹲卧 5×5、硬拉 1×5 + 肩背；结构简单，适合连续进步",
      "combinations": {
        "none": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "crossfit": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "hyrox": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_low",
            "key": "hyrox",
            "label": "Hyrox轻",
            "session": "sessions/aux/hyrox-stations.json",
            "intensity": "technique"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "athx": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "athx",
            "label": "AthX",
            "session": "sessions/aux/athx-hybrid.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ]
      }
    },
    "strength-time-efficient": {
      "name": "省时顶组",
      "badge": "省时间",
      "meta": "5/3/1 顶组循环 + 肩背；单次更短，护恢复可长期练",
      "combinations": {
        "none": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "crossfit": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "hyrox": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_low",
            "key": "hyrox",
            "label": "Hyrox轻",
            "session": "sessions/aux/hyrox-stations.json",
            "intensity": "technique"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "athx": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "athx",
            "label": "AthX",
            "session": "sessions/aux/athx-hybrid.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ]
      }
    },
    "strength-build": {
      "name": "四天力量",
      "badge": "练饱满",
      "meta": "蹲 / 卧推 / 硬拉 / 肩背各一天；力量上涨同时练得更厚实",
      "combinations": {
        "none": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "crossfit": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "hyrox": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_low",
            "key": "hyrox",
            "label": "Hyrox轻",
            "session": "sessions/aux/hyrox-stations.json",
            "intensity": "technique"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "athx": [
          {
            "weekday": 1,
            "type": "strength",
            "key": "squat",
            "label": "深蹲"
          },
          {
            "weekday": 2,
            "type": "strength",
            "key": "bench",
            "label": "卧推"
          },
          {
            "weekday": 3,
            "type": "strength",
            "key": "deadlift",
            "label": "硬拉"
          },
          {
            "weekday": 4,
            "type": "rest",
            "key": "rest",
            "label": "休"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩背"
          },
          {
            "weekday": 6,
            "type": "aux_high",
            "key": "athx",
            "label": "AthX",
            "session": "sessions/aux/athx-hybrid.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ]
      }
    }
  },
  "resolveExample": {
    "input": {
      "planId": "strength-hybrid-mix",
      "auxiliaries": [
        "running",
        "crossfit"
      ]
    },
    "combinationKey": "crossfit+running",
    "weekLabels": [
      "深蹲",
      "卧推",
      "硬拉",
      "跑",
      "肩推",
      "CF",
      "休"
    ]
  },
  "plansNote": "挪威=高频波浪；线性5×5=稳加重；5/3/1=顶组周期省时"
}
