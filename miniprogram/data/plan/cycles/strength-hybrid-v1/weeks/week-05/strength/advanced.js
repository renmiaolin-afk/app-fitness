module.exports = {
  "cycleId": "strength-hybrid-v1",
  "week": 5,
  "phase": "测力周",
  "strengthTier": "advanced",
  "note": "减量周之后插入；默认每 2 个训练块测一次。详见 ../testing.json",
  "days": {
    "mon": {
      "type": "test",
      "theme": "测深蹲",
      "main": {
        "name": "深蹲",
        "tag": "测力",
        "protocol": "1RM 试举",
        "warmupNote": "空杆 → 40% → 55% → 70% → 80% → 90% → opener",
        "attemptRule": "最多 3 次正式试举；当天只测一项",
        "load": {
          "type": "percent_1rm_opener",
          "percentOf1rm": 0.92,
          "note": "opener 基于建档/上周 e1RM；试举再按手感加码"
        },
        "exampleKg": 175,
        "restSec": 300
      },
      "accessories": [],
      "accessoryNote": "测力日不做辅助，测完即走"
    },
    "tue": {
      "type": "test",
      "theme": "测卧推",
      "main": {
        "name": "卧推",
        "tag": "测力",
        "protocol": "1RM 试举",
        "warmupNote": "空杆 → 40% → 55% → 70% → 80% → 90% → opener",
        "attemptRule": "最多 3 次正式试举；当天只测一项",
        "load": {
          "type": "percent_1rm_opener",
          "percentOf1rm": 0.92,
          "note": "opener 基于建档/上周 e1RM；试举再按手感加码"
        },
        "exampleKg": 130,
        "restSec": 240
      },
      "accessories": [],
      "accessoryNote": "测力日不做辅助，测完即走"
    },
    "wed": {
      "type": "test",
      "theme": "测硬拉",
      "main": {
        "name": "硬拉",
        "tag": "测力",
        "protocol": "1RM 试举",
        "warmupNote": "空杆 → 40% → 55% → 70% → 80% → 90% → opener",
        "attemptRule": "最多 3 次正式试举；当天只测一项",
        "load": {
          "type": "percent_1rm_opener",
          "percentOf1rm": 0.92,
          "note": "opener 基于建档/上周 e1RM；试举再按手感加码"
        },
        "exampleKg": 205,
        "restSec": 300
      },
      "accessories": [],
      "accessoryNote": "测力日不做辅助，测完即走"
    },
    "thu": {
      "type": "rest",
      "theme": "休息",
      "note": "测力周不排 CF"
    },
    "fri": {
      "type": "optional",
      "theme": "轻练或休",
      "note": "可选轻上肢/活动度；不想练就休"
    },
    "sat": {
      "type": "rest",
      "theme": "休息",
      "note": "不安排 CF Metcon"
    },
    "sun": {
      "type": "rest",
      "theme": "休息",
      "note": "更新三大项 1RM 后进入下一周期第 1 周"
    }
  }
}
