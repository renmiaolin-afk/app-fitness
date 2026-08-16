# 辅助组合 → 周历调度

力量举为主线；建档所选辅助（最多 2 项：`crossfit` / `hyrox` / `running`）决定调节日槽位。

## 匹配流程

```text
建档
├── strengthTier + 1RM          → 力量课 JSON（原 cycles/.../strength/）
├── auxiliaries: string[] ≤2    → 组合 key
└── planId                      → 三套推荐计划之一

今日计划 =
  week-slots[planId][combinationKey][weekday]
  + 若 type=strength → cycles/.../strength/{tier}.json 对应日
  + 若 type=aux_*    → sessions/aux/{...}.json
```

## 组合 key

1. 取用户 `auxiliaries`（合法 id 见 `profiles/auxiliaries.json`）
2. 去重、按字母序排序
3. 用 `+` 拼接；空数组 → `none`

| 选择 | key |
|---|---|
| 无 | `none` |
| CrossFit | `crossfit` |
| 跑步 | `running` |
| CrossFit + 跑步 | `crossfit+running` |
| Hyrox + 跑步 | `hyrox+running` |
| CrossFit + Hyrox | `crossfit+hyrox`（只保留 1 个高强度槽） |

## 推荐计划 id

| planId | 名称（真源 week-slots） | 策略 |
|---|---|---|
| `strength-frequent` | 高频力训计划 | 4 力量 + 辅调节（4×4/2×2/1×8） |
| `strength-basic` | 线性 5×5 计划 | 力量优先，硬辅暂缓或压到 1 次 |
| `strength-lean` | 5/3/1 力量计划 | 3 力量 + 短辅槽 |

## 伪代码

```js
function combinationKey(auxiliaries) {
  const ids = [...new Set(auxiliaries)]
    .filter((id) => ["crossfit", "hyrox", "running"].includes(id))
    .sort();
  return ids.length ? ids.join("+") : "none";
}

function resolveWeek({ planId, auxiliaries, weekSlots }) {
  const key = combinationKey(auxiliaries);
  const plan = weekSlots.plans[planId];
  const week = plan.combinations[key] ?? plan.combinations.none;
  return { key, week };
}

// 原型默认：CrossFit + 跑步 + 力量主线混合周
// → 深蹲 / 卧推 / 硬拉 / 跑 / 上推 / CF / 休
```

## 相关文件

| 路径 | 说明 |
|---|---|
| `../profiles/auxiliaries.json` | 三项辅助定义与冲突规则 |
| `dose-rules.json` | 剂量与并发训练上限 |
| `week-slots.json` | 计划 × 组合 → 七天槽位 |
| `../sessions/aux/` | 调节日课内容模板 |
