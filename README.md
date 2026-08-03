# app-fitness

力量训练产品：设计稿 + 计划数据 + **原生微信小程序**。

## 仓库结构

| 路径 | 说明 |
|---|---|
| `miniprogram/` | 原生微信小程序（可运行 MVP） |
| `cloudfunctions/` | 微信云开发云函数 |
| `docs/design/fitness new.pen` | Pencil 设计稿 |
| `docs/design/interaction.md` | 交互说明 |
| `plans/` | 训练计划数据（真源） |
| `scripts/sync-plans-to-mp.sh` | 同步 `plans/` → 小程序包内 |
| `scripts/sync-design.sh` | 设计稿同步脚本 |

### 云开发（个性化推荐）

环境 ID：`cloud1-d5g1vbk2ibf89c107`（见 `miniprogram/config/cloud.js`）

1. 开发者工具打开**仓库根目录**（需识别 `cloudfunctionRoot`）
2. 开通云开发并选中上述环境
3. 在 `cloudfunctions/recommendPlans` 上右键 → **上传并部署：云端安装依赖**
4. 重新编译小程序；建档到「推荐计划」时应出现「正在匹配…」，再显示云端排序结果
5. 若云函数未部署，会自动走本地同规则兜底，并 toast「已用离线推荐」

## 微信小程序（原生）

### 打开方式

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. **二选一导入**（推荐 A）：
   - **A.** 导入仓库根目录 `app-fitness`（根目录有 `project.config.json`，`miniprogramRoot` 指向 `miniprogram/`）
   - **B.** 直接导入 `app-fitness/miniprogram` 目录
3. AppID：`wx202c613a65bd136a`
4. 若模拟器空白：点菜单 **清缓存 → 全部清除**，再点 **编译**
5. 正常流程：**建档 → 推荐计划 → 今日 → 开练 → 力量/辅助训练 → 总结**

### 已打通

- 建档（能力 / 习惯 / 选计划），本地 `Storage` 持久化
- 今日周历（读 `week-slots` + week-01 力量档 + 辅助 session）
- 开练确认（含疲劳自动建议）
- 力量训练：待开始 / 计时 / 暂停 / 组间 / 退出保存 / 恢复
- 跑步·CF 辅助日：分段计时
- 课次总结 → 回到今日；「我的」查看档案

### 同步计划数据

改完根目录 `plans/` 后执行：

```bash
./scripts/sync-plans-to-mp.sh
```

微信小程序不能直接 `require('.json')`，脚本会把数据转成 `miniprogram/data/plan/**/*.js`（`module.exports = …`）再给业务引用。

## 训练计划（按能力档案）

建档后根据能力档拉取对应计划：

```text
strengthTier + cfLevel + 当前周次
  → plans/cycles/strength-hybrid-v1/weeks/week-XX/strength/{tier}.json
  → plans/cycles/strength-hybrid-v1/weeks/week-XX/cf/{level}.json
```

| 力量档 | 文件 | 说明 |
|---|---|---|
| 新手 | `beginner.json` | 低强度、偏体积 |
| 进阶 | `intermediate.json` | 中等强度推进 |
| 较强 | `advanced.json` | 高强度精简组（原型默认） |

| CF 档 | 文件 | 说明 |
|---|---|---|
| 初级 | `beginner.json` | 波比/划船/空蹲等 |
| 中级 | `intermediate.json` | 高翻/抓举/双力臂（馆课三段式） |
| 高级 | `advanced.json` | 蝴蝶引体/吊环等 |

周结构：深蹲 / 卧推 / 硬拉 / **CF** / 上推 / **CF** / 休  

当前周期 `strength-hybrid-v1`：**4 周训练**（加重 → 加重 → 维持 → 减量）+ 可选 **第 5 周测力**；力量三档 × CF 三档可独立组合。

正式 PR 不在训练周内冲：默认每 2 个训练块、减量后插入测力周（一深蹲 / 二卧推 / 三硬拉，CF 关闭）。详见 [`plans/cycles/strength-hybrid-v1/testing.json`](./plans/cycles/strength-hybrid-v1/testing.json) 与 [`plans/README.md`](./plans/README.md)。

## 设计稿页面

| 画板 | 说明 |
|---|---|
| 00 建档 | 能力档案（力量档 + CF 档）+ 训练习惯 |
| 01 今日 | 七天周历、计划卡、开始训练 |
| 01 今日 · CF 日 | 馆课三段式（技能/力量/Metcon） |
| 01 今日 · 开练确认 | 临时状态，可跳过 |
| 02 训练 | 待开始 / 本组计时 / 组间休息 |
| 03 我的 | 三大项进度、CF/习惯可编辑 |

### 训练流程

`建档 → 今日计划 → [开练确认可跳过] → 训练 → 今日完成`

## 打开设计稿

在 [Pencil](https://docs.pencil.dev/) 中打开 `docs/design/strength-training.pen`，或使用 Cursor Pencil 扩展直接编辑。

Pencil 默认不会自动进 Git，改完后先 **Cmd+S 保存**，再用同步脚本。

## 同步到 GitHub

```bash
# 仅复制设计稿（不提交）
./scripts/sync-design.sh

# 复制 + 提交 + 推送
./scripts/sync-design.sh -m "design: 更新训练页" -p

# 使用默认提交说明并推送
./scripts/sync-design.sh --push
```

Pencil 源文件默认路径：

`~/.pencil/documents/37054c31-2220-4b11-b030-9e05fddfab65/pencil-new.pen`

> **注意**：只有执行了带 `-p` / `--push` 的命令，改动才会出现在 GitHub 上。
