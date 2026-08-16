module.exports = {
  "version": 4,
  "description": "辅助组合 → 七天槽位。辅助仅单选（CF / Hyrox / AthX）。四套力量举均含每周肩背专项日。",
  "keyRule": "将用户所选 aux id 按字母序排序后用 + 拼接；空选为 none",
  "basePlan": "strength-frequent",
  "dayTypes": {
    "strength": "力量主课",
    "aux_high": "高强度辅助（CF / Hyrox / AthX）",
    "aux_zone2": "轻松有氧辅助（已弃用）",
    "aux_low": "低强度技术/恢复（双硬辅冲突时降级用）",
    "rest": "休息"
  },
  "plans": {
    "strength-frequent": {
      "name": "高频力训",
      "badge": "涨力快（恢复跟得上时）",
      "meta": "练得更密，恢复跟得上时三大项通常涨得最快",
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
    "strength-basic": {
      "name": "基础力训",
      "badge": "打基础",
      "meta": "结构简单，每周一点点往上加，适合把底子打稳",
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
    "strength-lean": {
      "name": "精简力训",
      "badge": "省时间",
      "meta": "单次更短，护住恢复，适合长期坚持",
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
    "strength-split": {
      "name": "分化力训",
      "badge": "练饱满",
      "meta": "蹲推拉和肩背拆成四天、每天容量更足，力量涨的同时练得更厚",
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
      "planId": "strength-frequent",
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
  "plansNote": "高频力训=密练涨力；基础力训=每周稳步加；精简力训=单次短；分化力训=分日练厚"
}
