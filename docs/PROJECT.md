# HaodeGo · 项目入口

> 每次开工先读这一页。这里只放**当前摘要**，细节点链接看。
> 核对时间：2026-11-01（本机 git 引用 + 仓库文档；**未** fetch 远端、未登录 App Store Connect / Vercel / Supabase 核验）。
> 仓库外的文件用绝对路径链接，因为本仓库会被检出到不同深度的目录（主目录和 `worktrees/*`）。

## 1. 产品与阶段

- **HaodeGo**（副标题 China Travel Buddy）：面向外国游客的中国自由行助手。旗舰是 Eat 页的菜单翻译 + 过敏原判定；底部 5 个 tab：Today / Eat / Explore / Stay / Talk。
- 形态：网站 https://haodego.com（Vercel 自动部署 `main`）+ iOS 原生壳（Capacitor，WebView 加载线上站点，`com.haodego.app`）。
- **当前阶段：iOS 1.0 提交审核前的收尾**；变现（1.1）代码已在 main，但开关关闭。

状态用词：**已实现**＝代码在 main ｜ **已验证**＝有测试或实测记录 ｜ **已部署**＝线上可用 ｜ **已开放**＝开关打开、用户可用 ｜ **已上架**＝App Store 可下载。

| 事项 | 状态 | 证据 |
|---|---|---|
| 网站 | 已部署（推定） | Vercel 部署 main；本次未打开线上核验 |
| iOS 1.0 (1) | 已上传，**未提交审核**，未上架 | [LAUNCH-TODO](</Users/veer/Claude/Projects/China Travel/LAUNCH-TODO.md>) 2026-11-01 记录；本次未核验 ASC |
| 严重过敏不显示绿色（R1+R5）、判定数据层（R2–R4、R6） | 已实现；离线回归在 CI 里跑 | 983a13b、61b0af2；`npm run verify` |
| 菜品 prompt v2（P1–P5） | **未测试，不在 main** | 分支 `prompt-v2` 的 122ebe4，提交信息写明 do not deploy |
| 免费额度 + 行程通行证 + 打赏 | 已实现，**未开放**（`QUOTA` 未设为 on；内购商品未建） | ee14103、f2b7e51；[MONETIZATION.md](MONETIZATION.md) |
| 限流、去掉“离线可用/verified”文案、品牌统一 | 已实现 | ef39e94、fdb7406、e1199e4 |
| 质量门：PR CI、push 前 hook、测试/发布 agent | 已实现 | PR #1、#2 已合入 main（a20a087、a6b203e） |

## 2. 代码在哪、从哪里发

| 位置 | 分支 | 用途 | 说明 |
|---|---|---|---|
| `origin/main` | main | **唯一事实来源**，线上部署 | 本机引用 a6b203e |
| `worktrees/p0-quality-gates` | docs-project-entry（基于 a6b203e） | 本页所在的文档分支，待 PR 合入 main | 原分支 bots-deploy-key 已合并 |
| `worktrees/appstore-blockers` | appstore-blockers（跟踪 origin/main） | **iOS 打包检出** | 落后 main 6 个提交（CI、cron、`lib/llm.ts`，无 iOS 改动）；打包前先 `git pull --ff-only origin main` |
| `worktrees/supabase-cache` | supabase-cache | 已合入 main 的旧分支 | 无未提交改动 |
| `china-travel-app`（主目录） | **prompt-v2** | 未测试的 prompt v2 + **他人未提交的酒店改动** | **不要在这里打包或直接开新工作**；见 §5 |
| `worktrees/dd-appstore` | — | Xcode DerivedData / xcarchive | 构建产物，不是代码 |

新工作：从最新 `origin/main` 开分支（建议新 worktree），走 PR → CI 绿 → 测试工程师 → 发布官 → Veer 合并（见 [CLAUDE.md](../CLAUDE.md) “Shipping”）。

## 3. 本轮目标与暂缓

- **目标**：iOS 1.0 提交审核并上架；把成本护栏设好；准备 1.1 内购。
- **暂缓**：UI 打磨、新功能、[ROADMAP-2027](</Users/veer/Claude/Projects/China Travel/china-travel-app/docs/ROADMAP-2027.md>) 里的季度计划（见 §6，不是现行计划）。

## 4. 正在推进（任务清单只在一处维护）

**现行待办 = [LAUNCH-TODO.md](</Users/veer/Claude/Projects/China Travel/LAUNCH-TODO.md>)**（✋ 你动手 / 🔴 你决定 / ⚠️ 需批准 / 🤖 Claude）。要点：

1. ✋ 提交 1.0 前：测试邮件、审核联系人、App Privacy Publish、DSA 声明、TestFlight 真机走查、提交审核。
2. ✋ 成本护栏：百炼预算告警、Vercel Spend 上限、高德日配额。
3. 1.1 变现：✋ 付费协议/税务/小企业计划/7 个内购商品 → 🤖 修“已付款但显示购买失败” → 🤖 沙盒测试 → ⚠️ 上架后设 `QUOTA=on`。

旧审查待办 [reviews/2026-10-25/todo.md](</Users/veer/Claude/Projects/China Travel/reviews/2026-10-25/todo.md>) 是历史记录，顶部已加逐项现状；仍未关闭的已并入下面 §5。

## 5. 已确认的决定 / 阻塞 / 待决

**已确认（Veer）**

| 决定 | 日期 | 详见 |
|---|---|---|
| 判定措辞 B 分层，严重过敏永远不显示绿色 | 2026-10-25 | decision-memo D1 |
| 品牌统一为 HaodeGo | 2026-10-25 提议，10-31 已执行 | decision-memo D5、e1199e4 |
| 变现：免费额度 + 1/3/7/14 天通行证 + 打赏；**安全功能永远免费**；价格是起始价，上线 2–4 周后按数据调 | 2026-11-01 | [MONETIZATION.md](MONETIZATION.md) |
| main 只经 PR 合并，agent 不推 main | 2026-11-01 | [CLAUDE.md](../CLAUDE.md) |
| 中国大陆区暂不上架 | 2026-10 | [SPEC §13](SPEC.md) |

**需要 Veer 决定 / 待核实**

1. 🔴 `prompt-v2` 分支（未测试的 prompt v2）和主目录里未提交的酒店改动（`lib/hotels.ts`、`lib/hotel-tiers.ts`、`hotel-seeds.json`、`import-hotel-seeds.mjs`）怎么处理：继续、另开分支、还是放弃。之前一直是 reviews todo #11。
2. ⏰ **免签名单核对**：`lib/visa.ts` 的 `VERIFIED_ON` 仍是 2026-10-23，没有逐国核对官方名单；单方面免签政策截止 2026-12-31，**12 月中旬必须再核一次**。
3. 待核实：D3 被审查流量污染的菜品缓存是否已清理；Web 分析 / Search Console 是否接入；Stay 空结果问题是否修复；餐厅匹配数据是否已写入线上表。
4. 🔴 `docs/ROADMAP-2027.md` 只存在于主目录、未提交，内容早于上架工作（见 §6）：归档、改写还是删除。
5. 待核实：模型方案。代码默认阿里云百炼 Qwen，Anthropic 只是回退；SPEC §10 原先的“Claude 还是国产”问题是否算正式定案，没有书面记录。

## 6. 文档导航（每类信息只在一处维护）

| 要查 | 去哪里 | 状态 |
|---|---|---|
| 现状、分支、下一步 | 本页 | 现行 |
| 上架与运营待办 | [LAUNCH-TODO.md](</Users/veer/Claude/Projects/China Travel/LAUNCH-TODO.md>)（仓库外） | 现行 |
| 产品规格（每个页面实际做什么） | [SPEC.md](SPEC.md) | 现行，§9–§11 有 2026-11-01 状态注 |
| 变现 | [MONETIZATION.md](MONETIZATION.md) | 现行 |
| App Store 填写内容 / iOS 打包 | [native/app-store.md](../native/app-store.md)、[native/README.md](../native/README.md)、LAUNCH-TODO §四 | 现行 |
| 开发约定、发布流程 | [CLAUDE.md](../CLAUDE.md)、`.claude/agents/haode-test-engineer.md`、`haode-release-manager.md` | 现行 |
| 设计 / 品牌 | [design/COLOR_RESEARCH.md](design/COLOR_RESEARCH.md)；品牌素材在工作区 `haodego-brand-kit-v3/`（v1/v2 为旧版） | 品牌素材未入库 |
| 审查团队规则与报告 | 工作区 [CHARTER.md](</Users/veer/Claude/Projects/China Travel/CHARTER.md>)（**只约束审查 agent**）、[reviews/2026-10-25/](</Users/veer/Claude/Projects/China Travel/reviews/2026-10-25/decision-memo.md>) | 规则现行；报告是历史 |
| 历史 / 过时 | 工作区 `SPEC.md`（v0.3，被 docs/SPEC.md 取代）、[BRAINSTORM.md](../BRAINSTORM.md)、[redesign-v0.6](redesign-v0.6/README.md)、ROADMAP-2027（未提交草稿，仍写“未上线、无数据库、iOS 放到 2027 Q4”，与现状冲突） | 只作背景 |

## 7. 接续规则（AGENTS.md / CLAUDE.md 都指向这里）

- **开始**：读本页 → `git status`、`git branch --show-current`、`git log origin/main -5`，确认自己在哪个检出、有没有别人的未提交改动（不覆盖、不清理）→ 读任务相关文档和代码。
- **执行前**：写清问题、范围、依赖、验收条件；涉及过敏判定或 prompt 的，按 CLAUDE.md 加跑过敏检查。
- **执行中**：新想法记进 LAUNCH-TODO 的“之后再说”或本页 §5 待决，**不要直接写成规则或规格**；Veer 确认的决定写进 §5，重要的附理由和“什么情况下重新评估”。
- **结束前**：更新 LAUNCH-TODO 勾选状态；行为变了就改 SPEC 对应小节；更新本页 §1 状态表、§2 分支表和核对时间（只改变化的行）。
- **交接**：说明改了什么、验证了什么（命令和结果）、**没验证什么**、卡在哪里、需要谁决定。没实测的写“未验证”，线上 / App Store 信息注明来源。
- 小修不必新增文档；不复制文档到各个 worktree；工作区根目录的 `README.md` / `CHARTER.md` 是审查团队文档，其中“只读”规则不适用于开发会话。
