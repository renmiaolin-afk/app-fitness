module.exports = {
  "version": 3,
  "description": "辅助组合 → 七天槽位。三套力量举均含每周肩推专项日（兼带背部辅项）。",
  "keyRule": "将用户所选 aux id 按字母序排序后用 + 拼接；空选为 none",
  "basePlan": "strength-hybrid-mix",
  "dayTypes": {
    "strength": "力量主课",
    "aux_high": "高强度辅助（CF / Hyrox）",
    "aux_zone2": "轻松有氧辅助（跑步 Zone2）",
    "aux_low": "低强度技术/恢复（双硬辅冲突时降级用）",
    "rest": "休息"
  },
  "plans": {
    "strength-hybrid-mix": {
      "name": "挪威力训计划",
      "badge": "高频",
      "meta": "12周 · 4×4/2×2/1×8 + 每周肩推专项；硬拉重/轻双日",
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
            "label": "肩推"
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
            "label": "肩推"
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
            "label": "肩推"
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
        "running": [
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
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
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
        "crossfit+running": [
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
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
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
        "hyrox+running": [
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
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
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
        "crossfit+hyrox": [
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
            "type": "aux_low",
            "key": "hyrox",
            "label": "Hyrox轻",
            "session": "sessions/aux/hyrox-stations.json",
            "intensity": "technique"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
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
        ]
      }
    },
    "strength-linear": {
      "name": "线性 5×5 计划",
      "badge": "稳加重",
      "meta": "12周 · 蹲卧5×5、硬拉1×5 + 每周肩推专项",
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
            "label": "肩推"
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
        "running": [
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
            "label": "肩推"
          },
          {
            "weekday": 6,
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
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
            "label": "肩推"
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
            "label": "肩推"
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
        "crossfit+running": [
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
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
          },
          {
            "weekday": 6,
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "hyrox+running": [
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
            "type": "aux_low",
            "key": "hyrox",
            "label": "Hyrox轻",
            "session": "sessions/aux/hyrox-stations.json",
            "intensity": "technique"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
          },
          {
            "weekday": 6,
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "crossfit+hyrox": [
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
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json",
            "note": "双硬辅只保留短 CF；Hyrox 暂缓"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
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
        ]
      }
    },
    "strength-time-efficient": {
      "name": "5/3/1 力量计划",
      "badge": "可持续",
      "meta": "12周 · 5/3/1 顶组周循环 + 每周肩推专项",
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
            "label": "肩推"
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
        "running": [
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
            "label": "肩推"
          },
          {
            "weekday": 6,
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
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
            "label": "肩推"
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
            "label": "肩推"
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
        "crossfit+running": [
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
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
          },
          {
            "weekday": 6,
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "hyrox+running": [
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
            "type": "aux_low",
            "key": "hyrox",
            "label": "Hyrox轻",
            "session": "sessions/aux/hyrox-stations.json",
            "intensity": "technique"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
          },
          {
            "weekday": 6,
            "type": "aux_zone2",
            "key": "running",
            "label": "跑",
            "session": "sessions/aux/running-zone2.json"
          },
          {
            "weekday": 7,
            "type": "rest",
            "key": "rest",
            "label": "休"
          }
        ],
        "crossfit+hyrox": [
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
            "type": "aux_high",
            "key": "crossfit",
            "label": "CF",
            "session": "sessions/aux/crossfit-short-metcon.json",
            "note": "双硬辅只保留短 CF；Hyrox 暂缓"
          },
          {
            "weekday": 5,
            "type": "strength",
            "key": "ohp",
            "label": "肩推"
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
