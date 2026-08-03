module.exports = {
  "version": 1,
  "title": "力量 PR / 测力规则",
  "summary": "4 周训练块内不正式测 1RM；用工作组推 e1RM。正式测力放在减量周之后的测力周（week-05），默认每 2 个训练块测一次（约 8–12 周）。",
  "duringTrainingBlock": {
    "formal1rm": false,
    "track": "e1RM",
    "method": "同动作、同组数下的顶组重量 × 次数估算 e1RM；完成率与顶组是否上涨优先于冲极限"
  },
  "whenToTest": {
    "defaultCadenceBlocks": 2,
    "cadenceNote": "每完成 2 个「加重→加重→维持→减量」块后插入 1 次测力周；恢复差或肩/腰不适时顺延",
    "afterDeload": true,
    "neverOn": [
      "加重周",
      "维持周",
      "CF 高强度日次日"
    ]
  },
  "testWeekId": "week-05",
  "testWeekTemplate": [
    {
      "weekday": 1,
      "key": "squat_test",
      "label": "测深蹲",
      "type": "test"
    },
    {
      "weekday": 2,
      "key": "bench_test",
      "label": "测卧推",
      "type": "test"
    },
    {
      "weekday": 3,
      "key": "deadlift_test",
      "label": "测硬拉",
      "type": "test"
    },
    {
      "weekday": 4,
      "key": "rest",
      "label": "休",
      "type": "rest"
    },
    {
      "weekday": 5,
      "key": "optional_light",
      "label": "轻练/休",
      "type": "optional"
    },
    {
      "weekday": 6,
      "key": "rest",
      "label": "休",
      "type": "rest"
    },
    {
      "weekday": 7,
      "key": "rest",
      "label": "休",
      "type": "rest"
    }
  ],
  "cfDuringTestWeek": "关闭正式 CF 课；最多极轻技能或活动度，不安排 Metcon",
  "byStrengthTier": {
    "beginner": {
      "protocol": "3–5RM",
      "note": "不追求真正 1RM；用 3–5RM 估 e1RM 更新档案"
    },
    "intermediate": {
      "protocol": "heavy_single_or_3rm",
      "note": "可做扎实单次或 3RM；失败两次即停"
    },
    "advanced": {
      "protocol": "1rm_attempts",
      "note": "热身阶梯 → opener → 最多 3 次正式试举；当天只测一项主项"
    }
  },
  "afterTest": {
    "updateProfile1rm": true,
    "nextAction": "用新 1RM 开启下一轮 strength-hybrid 第 1 周"
  }
}
