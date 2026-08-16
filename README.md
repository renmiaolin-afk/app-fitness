# app-fitness

力量训练产品：设计稿 + 计划数据 + **原生微信小程序**。

## 仓库结构

| 路径 | 说明 |
|---|---|
| `miniprogram/` | 原生微信小程序（可运行 MVP） |
| `cloudfunctions/` | 微信云开发云函数 |
| `docs/design/fitness new.pen` | Pencil 设计稿 |
| `docs/design/interaction.md` | 产品说明（PRD，与实现同步） |
| `docs/legal/` | 法律免责声明原文 |
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

- 法律免责声明（须勾选）→ 建档（能力 / 习惯含训练节奏 / 四套计划）
- 辅助单选：CrossFit / Hyrox / AthX（可不选）
- 今日周历、身体状态、开始训练 / 请假并排、训练卡片
- 力量 / 辅助训练：暂停 · 完成（最短时长锁定）· 关闭与退出 Sheet、草稿恢复
- 完成度评分（100 / 50 / 0）与课次总结；「我的」档案 / 声明 / 清数据

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

周结构以 `miniprogram/data/plan/scheduling/week-slots.js` 为准：力量日（含每周**肩背**）+ 可选单辅助日（CF / Hyrox / AthX）+ 休息。计划名：高频力训 / 基础力训 / 精简力训 / 分化力训。

当前周期 `strength-hybrid-v1`：**4 周训练**（加重 → 加重 → 维持 → 减量）+ 可选 **第 5 周测力**；力量三档 × CF 三档可独立组合。

正式 PR 不在训练周内冲：默认每 2 个训练块、减量后插入测力周（一深蹲 / 二卧推 / 三硬拉，CF 关闭）。详见 [`plans/cycles/strength-hybrid-v1/testing.json`](./plans/cycles/strength-hybrid-v1/testing.json) 与 [`plans/README.md`](./plans/README.md)。

## 设计稿页面

| 画板 | 说明 |
|---|---|
| 00 建档 | 免责声明 → 能力档案（辅助单选）→ 习惯（节奏）→ 推荐计划 |
| 01 今日 | 七天周历、身体状态、训练卡片、开练/请假 |
| 02 训练 | 力量 / 辅助计时、退出确认、总结 |
| 03 我的 | 档案、计划入口、习惯、声明、清数据 |

### 训练流程

`建档 → 今日计划 → 身体状态 → 训练 → 今日完成（不可再练；不补练）`

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
