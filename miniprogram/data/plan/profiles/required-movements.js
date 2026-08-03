module.exports = {
  "version": 1,
  "description": "力量体系每周必须覆盖的关键动作（三大项之外）。",
  "mustHaveWeekly": [
    {
      "id": "strict_press",
      "name": "实力推",
      "region": "shoulder",
      "role": "垂直推主项，肩部力量与稳定",
      "defaultDay": "fri",
      "slot": "main"
    },
    {
      "id": "pullup",
      "name": "引体向上",
      "region": "back",
      "role": "垂直拉，背阔与上背",
      "defaultDay": "wed",
      "slot": "secondary",
      "scaling": {
        "beginner": "弹力带辅助引体或反向划船",
        "intermediate": "自重严格引体",
        "advanced": "自重或负重引体"
      }
    },
    {
      "id": "pendlay_row",
      "name": "潘德勒划船",
      "region": "back",
      "role": "水平拉，厚度与锁背，支撑卧推",
      "defaultDay": "tue",
      "slot": "secondary"
    }
  ],
  "supportingShoulder": [
    "侧平举",
    "面拉"
  ],
  "note": "上推日主项统一命名为「实力推」（严格站姿推举，不借腿）"
}
