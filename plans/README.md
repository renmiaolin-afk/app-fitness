# 训练计划数据

按「训练周期 × 能力档案」组织力量与 CF 计划。产品建档后，用档案字段匹配对应 JSON，生成当周今日计划。

## 匹配规则

```text
建档
├── strengthTier: beginner | intermediate | advanced   （新手 / 进阶 / 较强）
├── cfLevel:      beginner | intermediate | advanced   （初级 / 中级 / 高级）
└── 1RM（深蹲 / 卧推 / 硬拉）→ 用于把 percent_1rm 换成今日公斤数

今日计划 =
  cycles/{cycleId}/weeks/week-XX/strength/{strengthTier}.json
  + cycles/{cycleId}/weeks/week-XX/cf/{cfLevel}.json
```

重量优先用用户真实 1RM × `load.percentOf1rm`；若无 1RM，回退到档案默认示例重量 `exampleKg`。

## 目录

| 路径 | 说明 |
|---|---|
| `profiles/` | 能力档定义与默认 1RM 示例 |
| `cycles/strength-hybrid-v1/` | 力量优先混合周期（当前产品默认） |
| `cycles/.../weeks/week-01/` | 第 1 周完整计划（已写） |
| `cycles/.../weeks/week-02~04/` | 后续周进度规则（先写 phase，细节可迭代） |

## 周结构（七天）

| 一 | 二 | 三 | 四 | 五 | 六 | 日 |
|---|---|---|---|---|---|---|
| 深蹲 | 卧推 | 硬拉 | CF | 上推 | CF | 休 |

CF 一周两次，采用馆课三段式：技能 → 力量 → Metcon。
