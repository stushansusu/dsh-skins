# L2 语义属性枚举 v1 — data-dsh-surface / data-dsh-part / data-dsh-plugin

契约归属：本表由皮肤中心单方面拥有和维护（冲突仲裁纪律：不靠加载顺序）。
版本：`semantic-attrs/v1`（2026-08-18 初版，依据 rc.7 SDK 实地扫描，
调研快照见 `docs/archive/2026-08-18-semantic-attrs-survey.md`）。

## 纪律

- 每个枚举值必须有明确 **owner、版本、含义与锚定方式**，不能只堆字符串——
  防止语义层退化成另一套隐式 DOM API。
- 两个产出通道：**compat adapter**（皮肤中心的合并 MutationObserver，为官方
  DOM 与未 opt-in 插件补打属性；非永久公共契约，官方区域在上游主题缝落地后
  进入删除评估，第三方插件区域长期保留）与**组件主动输出**（仓内插件按
  packages/AGENTS.md 约定自行输出，更准更快）。
- 不输出语义属性的插件只享受 L1 token 基础覆盖，不承诺完整换肤覆盖。
- part 用**裸值**、归属交给 `data-dsh-plugin`（如 `column` 而非
  `task-board-column`）；选择器写法 `[data-dsh-plugin="ssh"] [data-dsh-part="terminal"]`。
- **不复用官方 `data-plugin`**：官方用它标注 style 标签的插件归属
  （dsh-client-modules / dsh-client-hmr），语义不同。
- body/html 级属性（`data-ds-dark-theme`、`data-dsh-skin`、各插件
  `*-active`）不属于本枚举三组，另行管理。

## surface 组（8 个）

| data-dsh-surface | owner | 含义 / 锚定方式 |
| --- | --- | --- |
| `root` | shell | 应用根出口；`[data-slot="root"]` |
| `sidebar` | shell | 左导航列；`[data-slot="sidebar"]`（列容器本体上游缝落地前经适配器） |
| `conversation` | shell | 中栏主区；`[data-slot="conversation"]`（旧 shell）/ `[class*="centerCol"]`（dsh 0.1.7 起中栏无 data 钩子，以 CSS-module 后缀锚定） |
| `session-header` | shell | 会话头；`[data-slot="conversation.session.header"]` |
| `composer` | shell | 输入区；`[data-slot="conversation.composer"]` |
| `details` | shell | 右详情列；`[data-slot="details"]`（旧 shell）/ `[data-rightbar-col]`（dsh 0.1.7 起官方钩子，收起时 0 宽、打标不产生绘制） |
| `settings` | shell | 设置模态；`[role="dialog"]` 内含 `[data-slot="settings.section"]` 组合判定 |
| `overlay` | shell | 帧级浮层；`[data-shell-overlay]` / `[data-slot="shell.overlay"]` |

### 背景自有标记（owner: skin-center）

皮肤中心「有背景艺术可见」期间的自有标记；均为 body/html 级属性（按上文纪律
另行管理）：

| 属性 | 位置 | 含义 / 锚定方式 |
| --- | --- | --- |
| `data-dsh-skin` | html（html 级，owner: skin-center） | 当前皮肤 id：皮肤 CSS 强制作用域于此，目录内皮肤的自有让路规则另锚定 `body[data-we-wallpaper]`。它是**皮肤在画**与**皮肤要求上台**两义的公开信号——独立壁纸插件据此反向让路。用户显式发起的激活（试穿 / 应用，含对同一款的重复应用）这一次照常上妆并翻上该属性，随后停画判定在下一帧自然成立；无人应答时在一个让路窗口（`USER_INITIATED_YIELD_GRACE_MS`）后自行退回停画（#49） |
| `data-dsh-backdrop-active` | html + body（body/html 级，另行管理） | 皮肤背景媒体（`backgroundMedia`）挂载期间置 `true`（`backdrop-scene.ts`），卸载 / 禁用清净；供 composer seat 遮罩统一中和与输入区前置磨砂面板规则锚定（#777） |
| `data-dsh-conversation-content` | html + body（body/html 级，另行管理） | 当前对话存在消息行（`[data-chat-anchor-key]`）期间置 `true`；`backdrop-scene.ts` 在背景可见时随 MutationObserver 更新。输入卡磨砂仅在 backdrop-active 且本标记置位时启用，空对话不显示多余模糊（#777 follow-up） |
| `data-dsh-composer-frost` | body 级空元素（元素级，owner: skin-center） | 皮肤中心在 backdrop-active 且 conversation-content 置位期间挂载的输入卡磨砂层：body 级 fixed 兄弟元素，按输入卡 border box 跟随（rAF 合并测量），仅承载 `backdrop-filter`；标记清除即移除。磨砂**不能**挂在输入卡上——非 none 的 `backdrop-filter` 会让卡片成为其 fixed 后代的包含块，把官方 tooltip 推进会话滚动口并撑高 `scrollHeight`（#1724）。壁纸插件渲染期间本层不挂载（见下） |

### 外部壁纸标记（owner: dsh-plugin-wallpaper-engine，只读消费）

壁纸由独立插件 `dsh-plugin-wallpaper-engine` 提供，皮肤中心不再自带 WE 桥
（#39）。该插件在渲染壁纸期间给 `body` 打上自有属性，皮肤中心只读它、从不写：

| 属性 | 位置 | 含义 / 锚定方式 |
| --- | --- | --- |
| `data-we-wallpaper` | body（元素级，owner: 外部壁纸插件） | 外部插件渲染壁纸期间置位，停止时移除。皮肤中心在置位期间**整体停画皮肤**（不加载皮肤 CSS、不画 `backgroundMedia`、不跑 hooks、不挂 composer 磨砂，并把 `html[data-dsh-skin]` 属性撤下），用户选择保留，属性清除即自动恢复；用户显式发起的激活是唯一例外，它先翻 `html[data-dsh-skin]` 抢一次台以驱动对方让路，无人应答则在一个让路窗口后自行退回停画（#49）；皮肤目录内的让路规则（`body[data-we-wallpaper]::after` 等）也锚定它。等价属主与写者只有外部插件一方 |

### 委托皮肤标记（owner: 委托插件自身，只读消费）

一条皮肤可以不由本包绘制，而是由另一个插件绘制（委托皮肤，见
`src/core/delegated-skins.ts`）。该插件在页面期间给 `body` 打上自有属性，
皮肤中心只读、从不写：

| 属性 | 位置 | 含义 / 锚定方式 |
| --- | --- | --- |
| `data-dsh-claude-style` | body（元素级，owner: `dsh-claude-style`） | 插件在页面上运行、其样式表已挂载期间置位（值是它的 build id），停用或卸载时移除。皮肤中心据此判断该行是否真的在作画 |
| `data-dsh-claude-style-handoff` | body（元素级，owner: `dsh-claude-style`） | 该构建支持让路时置位，即它会在 `html[data-dsh-skin]` 或 `body[data-we-wallpaper]` 出现时收掉自己的视觉。**有无该属性是能力信号**：没有它的构建无法把页面交还给皮肤，卡片因此不向它提供试穿/应用 |

让路方向只有一条，且只经由 `html[data-dsh-skin]`：委托皮肤被选中时该属性不
置位（这正是它第一屏的文档形态，也是插件继续作画的前提）；用户改选其他皮肤
或官方默认时该属性翻上，委托插件让路；壁纸渲染期间委托插件同样让路。
皮肤中心不写委托插件的任何属性，委托插件不写 `data-dsh-skin`，双方都无法把
对方卡死。委托皮肤的选择会照常持久化、开机采纳与试穿还原；让路暂停的是
视觉，不是插件的设置页与偏好。
## part 组（98 行，含各 owner 行）

shell 区域（owner: shell）：

| data-dsh-part | 含义 / 锚定方式 |
| --- | --- |
| `message-row` | 聊天流条目；`[data-chat-flow-kind]` |
| `message-body` | 助手消息正文；`[data-streaming]` 根 |
| `scrollport` | 会话滚动口；`[data-conversation-scroll]` |
| `composer-input` | 输入框；`textarea[data-phase]`（旧 shell）/ `[data-composer-input]`（现行 Lexical contenteditable 输入框） |
| `composer-chip` | 输入引用 chip；`[data-decoration="chip"]` |
| `queue-dock` | 排队条；`[data-queue-dock]` |
| `turn-tail` | turn 尾行；`[data-turn-tail]` |
| `resize-handle` | 列宽手柄；`[data-side]` |
| `new-session` | 侧栏新会话按钮；官方稳定属性落地前由兼容适配器从 `button[class*="newSession"]` 补打，皮肤不得依赖本地化文案 |

family / 插件区域：

| data-dsh-part | owner | 含义 / 锚定方式 |
| --- | --- | --- |
| `sidebar-entry` | shell（行盒）+ 注册插件（身份） | 插件经 `sidebar.panellist` 注册的侧栏面板行（任务看板 / ssh / 技能中心；官方 Plugins / Schedule 行不属此值）。行盒归 shell，兼容适配器按 `[class*="panelRow"]:has([data-dsh-panel-entry])` 补打——CSS-module 后缀 + 插件字形身份，同 `new-session` 手法；上游诉求见下文脆弱点 2 |
| `header` | task-board | 看板头；`[data-dsh-taskboard-board] > header` |
| `column` | task-board | 状态列；`section[data-status]` |
| `card` | task-board | 任务卡；列内 `article[data-status]` 条目，`data-tone` 为最近执行结果（running / succeeded / failed / cancelled，无执行或归档时缺省），`data-compact` 标记紧凑密度 |
| `card-open` | task-board | 铺满卡片的透明打开按钮（键盘与读屏入口）；`article[data-dsh-part="card"] > button[data-dsh-part="card-open"]` |
| `card-title` / `card-kind` / `card-excerpt` / `card-time` / `card-run` | task-board | 卡片标题、标题类型徽章（`[Bug]:` 前缀）、描述摘要、按列选择的时间标签、最近执行结果与次数；均在 `[data-dsh-part="card"]` 内 |
| `card-session` | task-board | 卡片上打开最近执行会话的快捷按钮 |
| `card-group` / `card-group-toggle` | task-board | 已结算列的时间分组（`data-group` 为 today / week / earlier）与折叠开关 |
| `density-toggle` | task-board | 列头的紧凑/完整卡片切换；`aria-pressed` 表示紧凑 |
| `github-badge` | task-board-github | 卡片 meta 行内的 Issue 编号徽章；URL 为 http(s) 时是新标签打开的 `a`，否则为 `span` |
| `detail` | task-board | 任务详情面板 |
| `tag-filter` | task-board | 标签筛选条；`[data-dsh-taskboard-board] [data-dsh-part="tag-filter"]` |
| `tag-chip` | task-board | 筛选条内的标签胶囊；`[data-dsh-part="tag-chip"]`，`data-tag-tone` 为 0-5 调色板槽 |
| `tag-badge` | task-board | 卡片上的标签徽章；`[data-dsh-part="tag-badge"]`，`data-tag-tone` 同上 |
| `project-filter` | task-board | 项目分区下拉；`[data-dsh-part="project-filter"]`，筛选项为工作区 id，空值为「全部项目」 |
| `project-dialog` | task-board | 看板内新建项目表单；`[data-dsh-part="project-dialog"]`，含一个绝对路径输入与创建/取消按钮 |
| `ai-parse` | task-board | 新建任务弹窗内的「粘贴内容 → AI 解析」区块；`[data-dsh-part="ai-parse"]`，含文本框、模型下拉与解析按钮 |
| `tab-bar` / `tab` | ssh | 页签条/页签；`[role="tablist"]` / `[role="tab"]` |
| `host-table` / `host-row` | ssh | 主机表/行；`[data-dsh-ssh-view]` 内 table/tr |
| `terminal` | ssh | xterm 终端；面板内 termContainer（.xterm 辅锚） |
| `banner` | ssh | 状态横幅；`[data-kind]` 横幅 |
| `sprite` | pet | 精灵；`[data-dsh-pet-root]` 子树 float 容器 |
| `bubble` | pet | 气泡容器 |
| `announcement` | pet | 插件公告气泡（dsh-usage 联动）；`[data-dsh-pet-announcement]`，值来源插件标签 |
| `panel` | pet | 交互面板；`[data-placement]` |
| `summon-button` | pet | 召唤钮；`[data-testid="pet-summon"]` |
| `preset-panel` | preset-center | 创意工坊「预设」标签页面板根；`[data-dsh-plugin="preset-center"] [data-dsh-part="preset-panel"]` |
| `plugin-item` | web-ui-settings | 家族插件设置卡；`[data-slot="web-ui.plugin.item"]` 内 entry |
| `extensions` | web-ui-settings | 「Web 扩展」父级根；一级 `settings.section` id `web-ui-plugins` 的内容容器 |
| `tabs` / `tab` / `panel` | web-ui-settings | 「Web 扩展」二级 TAB 导航、TAB 按钮与当前页面容器；`[role="tablist"]` / `[role="tab"]` / `[role="tabpanel"]` |
| `panel` | skin-center | 皮肤设置卡根；`[data-dsh-plugin="skin-center"][data-dsh-part="panel"]` |
| `tab-bar` / `tab` | skill-explorer | 技能中心页签条/页签（中间列面板，同 ssh）；`[data-dsh-plugin="skill-explorer"] [data-dsh-part="tab-bar"]` / `[data-dsh-plugin="skill-explorer"] [data-dsh-part="tab"]` |
| `skill-row` | skill-explorer | 技能卡行；`[data-dsh-plugin="skill-explorer"] [data-dsh-part="skill-row"]` |
| `filter-bar` | skill-explorer | 技能列表筛选条（搜索框 + 工作区选择 + 刷新）；`[data-dsh-plugin="skill-explorer"] [data-dsh-part="filter-bar"]` |
| `entry` | message-edit | 回合末尾的「编辑并重发」触发按钮；`[data-dsh-plugin="message-edit"] [data-dsh-part="entry"]` |
| `editor` | message-edit | 回合末尾的内联编辑器根，包含文本框、分支副作用提示与提交操作；`[data-dsh-plugin="message-edit"] [data-dsh-part="editor"]` |
| `entry` | session-id | 侧栏 footer 触发器；`button[data-dsh-part="entry"]`（`[data-dsh-plugin="session-id"]` 容器内） |
| `panel` | session-id | 会话 ID 模态面板；`[role="dialog"]` 根（`[data-dsh-part="panel"]`） |
| `row` | session-id | 会话列表行；面板内行容器（`[data-dsh-part="row"]`） |
| `copy` | session-id | 每行复制按钮；`button[data-dsh-part="copy"]` |
| `search` | session-id | 面板搜索输入框；`input[type="search"][data-dsh-part="search"]` |
| `entry` | dsh-update | 侧栏 footer 更新触发器；`[data-dsh-plugin="update"] [data-dsh-part="entry"]` |
| `panel` | dsh-update | 更新面板模态根；`[data-dsh-plugin="update"] [data-dsh-part="panel"]` |
| `sprite` | miku-pet | 宠物帧舞台；`[data-dsh-plugin="miku-pet"] [data-dsh-part="sprite"]` |
| `menu` | miku-pet | 悬停菜单（两级）；`[data-dsh-part="menu"]` |
| `stats` | miku-pet | 左侧属性彩条；`[data-dsh-part="stats"]` |
| `shop` | miku-pet | 商店居中窗口；`[data-dsh-part="shop"]` |
| `bubble` | miku-pet | 对话气泡；`[data-dsh-part="bubble"]` |
| `float` | miku-pet | 互动飘字；`[data-dsh-part="float"]` |
| `header` | usage | 使用统计分区头部（当前提供方 + 刷新钮）；`[data-dsh-plugin="usage"] [data-dsh-part="header"]` |
| `tabs` / `tab` | usage | 用量/个人套餐/Token 银行页签；`[role="tablist"]` / `[role="tab"]` |
| `today-card` | usage | 今日用量统计卡；`[data-dsh-part="today-card"]` |
| `provider-list` / `provider-row` | usage | 今日分 provider 用量列表 / 余额行；卡片内行容器 |
| `balance-card` | usage | 各 provider 余额卡；`[data-dsh-part="balance-card"]` |
| `trend-card` / `usage-chart` | usage | 近 30 天卡 / 其中的提供方-模型条形图；`[data-dsh-part="trend-card"]` 内 `[data-dsh-part="usage-chart"]` |
| `settings-row` | usage | 插件设置行；`[data-dsh-part="settings-row"]` |
| `plan-card` / `plan-window` | usage | 套餐卡 / 套餐窗口行（个人套餐页签）；`[data-dsh-part="plan-card"]` 内窗口行 |
| `bank-card` | usage | Token 银行卡（鲸元券，无官方用量时为空状态）；`[data-dsh-part="bank-card"]` |
| `voucher-preview` | usage | 票面 canvas 容器；bank-card 内 `[data-dsh-part="voucher-preview"]` |
| `foot-card` | usage | 侧栏底部用量速览卡（Settings 行下方，栏轨态隐藏；可折叠为单行摘要条）；`[data-dsh-plugin="usage"] [data-dsh-part="foot-card"]`，挂载容器 `[data-dsh-usage-foot-card]` |
| `foot-card-main` / `foot-card-toggle` | usage | 速览卡主体按钮（整卡点击打开设置分区）/ 右上角收起-展开切换钮；foot-card 内裸值 button |
| `foot-card-strip` | usage | 折叠态单行摘要条（标签 + 头条值）；折叠时 foot-card-main 内裸值 span |
| `foot-card-usage` / `foot-card-balances` | usage | 展开态的 tokens/调用行 / 余额行；foot-card 内裸值 span |
| `lever` | liangshen | 首页输入框内的梁神模式拨杆根（模型选择器左侧）；`[data-dsh-plugin="liangshen"][data-dsh-part="lever"]`，状态由 `data-state`（`on` / `off` / `locked` / `missing`）锚定 |
| `lever-track` | liangshen | 拨杆底座槽（臂的转动轨道）；lever 内 `[data-dsh-part="lever-track"]` |
| `lever-arm` | liangshen | 拨杆臂（拉杆 + 球头，随状态转动）；lever 内 `[data-dsh-part="lever-arm"]` |
| `lever-burst` | liangshen | 拨下命中后的中奖特效浮层（闪光 / 冲击环 / 火花 / 横幅）；`[data-dsh-part="lever-burst"]`，`prefers-reduced-motion` 下退化为淡出 |
| `lever-banner` | liangshen | 特效中的梁神横幅（模式名 + 文言文/二进制/摩斯三行）；burst 内 `[data-dsh-part="lever-banner"]` |
| `panel` | browser-view | 右侧栏标签页主体根（工具栏 + 帧 + 动作行）；`[data-dsh-plugin="browser-view"][data-dsh-part="panel"]` |
| `toggle` | browser-view | 会话头「浏览器」快捷按钮（打开或聚焦该标签页）；`[data-dsh-part="toggle"]` |
| `toolbar` | browser-view | 顶部工具条（地址显示 + 连接状态 + 刷新），38px 高与官方浏览器标签页同构；panel 内 `[data-dsh-part="toolbar"]` |
| `address` | browser-view | 被控页面地址的只读显示（截断、可复制）；toolbar 内 `[data-dsh-part="address"]` |
| `status` | browser-view | 连接状态标记（连接中 / 加载中 / 实时），文案随状态变化；toolbar 内 `[data-dsh-part="status"]` |
| `tabs` | browser-view | 被控浏览器的标签页 chips（仅在多于一张时绘制）；panel 内 `[data-dsh-part="tabs"]` |
| `frame` | browser-view | 实时帧图像（`<img>`，`object-fit: contain`）；panel 内 `[data-dsh-part="frame"]` |
| `trace` | browser-view | 底部动作行（最近一次工具动作的可读摘要）；panel 内 `[data-dsh-part="trace"]` |
| `empty` | browser-view | 尚未收到画面时的空态占位；panel 内 `[data-dsh-part="empty"]` |
| `error` | browser-view | 宿主上报错误时的错误态占位；panel 内 `[data-dsh-part="error"]` |
| `tab-title` | browser-view | 右栏 chip 内本插件自有部分（图标 + 标题），chip 行盒归 shell；`[data-dsh-plugin="browser-view"] [data-dsh-part="tab-title"]` |
| `update-toolbar` | dsh-plugin-manager | 官方「插件」页「已安装插件」组标题行内的检查更新工具条（页面不声明该席位，容器插进 `[data-plugin-group="bundles"]` 的首个子元素并随页面重绘复位）；`[data-dsh-plugin-manager-toolbar]` |
| `builtin-group` | dsh-plugin-manager | 官方「插件」页列表底部追加的内置插件分组根（页面不声明该席位，作为已安装面板的后续兄弟挂载）；`data-builtin-state` 为 `loading` / `unavailable` / `failed` / `ready`，`data-builtin-bundles` 为 `confirmed` / `unconfirmed` |
| `builtin-row` | dsh-plugin-manager | 内置插件分组内的一行：标题、模块名、锁定原因与启停开关；`data-entry-id` 为 loader 行 id，`data-write` 为 `writable` / `management-required` / `unaddressable` / `unknown` |
| `builtin-notice` | dsh-plugin-manager | 内置插件分组标题下的操作反馈行；失败为 `role="alert"`，其余为 `role="status"` |
| `preset-group` | dsh-plugin-manager | 内置插件分组下方的只读 Agent 预设区块根（预设行由组合决定，不提供开关） |
| `preset` | dsh-plugin-manager | 一个 Agent 预设卡；`data-preset-id` 为预设 id，`data-default` 为 `yes` / `no` |
| `preset-row` | dsh-plugin-manager | 预设组合中的一行（模块名 + 状态）；`data-preset-state` 为 `on` / `off` / `conditional`，条件行同时给出表达式 |
| `builtin-scope` | dsh-plugin-manager | 内置插件分组标题右侧的展开/收起控件，切换「只列无所属组合包的行」与「追加全部 Loader 行」两态；`aria-expanded` 表示当前是否展开，`aria-controls` 指向它切换的列表元素，`[data-dsh-part="builtin-scope"]` |
| `builtin-owner` | dsh-plugin-manager | 展开态中已归属行内的次要文本，写明这一行同时属于哪个已安装组合包（文案形如「来自 <包名>」）；行内 `[data-dsh-part="builtin-owner"]` |

### 面板行身份锚点 `data-dsh-panel-entry`（owner: 各注册面板的插件）

`sidebar.panellist` 的行盒、标签与选中态归 shell，插件的客户端代码在这行里**只**
拥有自己的字形（`renderSlot('sidebar.panellist', …, { only: id })` 的返回值，落在
shell 的 `[class*="panelGlyph"]` 内）。shell 目前不把 entry id 透传到 DOM，因此行身份
由**字形自带**该属性，皮肤用 `:has()` 从行反查归属：

| 属性 | owner | 取值 / 锚定方式 |
| --- | --- | --- |
| `data-dsh-panel-entry` | task-board / ssh / skill-explorer | 面板行字形的 `id`（与注册进 `sidebar.panellist` 的 entry id、`main` 槽的 key 同源），即 `task-board` / `ssh` / `skill-explorer`；行级选择器形如 `[data-dsh-part="sidebar-entry"]:has([data-dsh-panel-entry="ssh"])` |

该属性独立于 surface / part / plugin 三组（与 `data-dsh-usage-foot-card` 同类，见纪律节），
不进 `data-dsh-plugin`：plugin 属性标记插件面板根，皮肤里已有
`[data-dsh-plugin="ssh"] [class*="panel"]` 一类把根当作面板子树起点的规则，把字形也算进去会误伤。

## plugin 组（16 个）

| data-dsh-plugin | owner | 锚定方式 |
| --- | --- | --- |
| `task-board` | dsh-task-board | `[data-dsh-taskboard-view]` / 面板行字形 `[data-dsh-panel-entry="task-board"]` / `sidebar.panellist` entry id |
| `ssh` | dsh-ssh | `[data-dsh-ssh-view]` / 面板行字形 `[data-dsh-panel-entry="ssh"]` |
| `pet` | dsh-pet | `[data-dsh-pet-root]`；设置页 `[data-dsh-plugin="pet"]`（Web 扩展 keyed id `pet`，独立安装时为一级 settings.section id `pet`，只列内置与已安装宠物） |
| `remote-web-ui` | dsh-remote-web-ui | slot entry id `remote-web-ui` |
| `update` | dsh-update | footer action slot entry id `update`；`[data-dsh-plugin="update"]`（面板根 + 入口触发器） |
| `web-ui-settings` | dsh-web-settings | 一级 settings.section id `web-ui-plugins`；`[data-dsh-plugin="web-ui-settings"][data-dsh-part="extensions"]` 父级根 |
| `skill-explorer` | dsh-skill-explorer | `[data-dsh-skill-explorer-view]` / 面板行字形 `[data-dsh-panel-entry="skill-explorer"]` |
| `dsh-web-ui-market` | dsh-market | 创意工坊商店页 `[data-dsh-plugin="dsh-web-ui-market"]`（Web 扩展 keyed id `dsh-workshop`，独立安装时为一级 settings.section id `dsh-workshop`），商店卡与目录条目容器 |
| `skin-center` | skins/skin-center | 设置卡 `[data-dsh-plugin="skin-center"]`（Web 扩展 keyed id `skin-center`，独立安装时为一级 settings.section id `skin-center`，列已安装皮肤，属内置源时显式标记） |
| `session-id` | dsh-session-id | footer action slot entry id `session-id`；`[data-dsh-plugin="session-id"]`（面板 overlay 根 + 入口触发器） |
| `message-edit` | dsh-message-edit | `conversation.chat.turnTail` slot entry id `message-edit`；`[data-dsh-plugin="message-edit"]`（触发按钮 + 内联编辑器根） |
| `usage` | dsh-usage | 设置页 `[data-dsh-plugin="usage"]`（Web 扩展 keyed id `dsh-usage`，独立安装时为一级 settings.section id `dsh-usage`）；侧栏底部速览卡容器 `[data-dsh-usage-foot-card]` |
| `preset-center` | dsh-preset-center | 创意工坊卡片的「预设」标签页面板（`dsh-workshop.panel` keyed 槽 key `preset`）；`[data-dsh-plugin="preset-center"]` |
| `liangshen` | dsh-liangshen | 首页输入框内的梁神模式拨杆；`[data-dsh-plugin="liangshen"][data-dsh-part="lever"]`，slot entry id `liangshen-lever` |
| `browser-view` | dsh-browser-view | 右栏标签页类型 id `@linxin666/dsh-client-ui-browser-view`（`sidebar.right.pane.tab` 与 `.title` 的 key）；`[data-dsh-plugin="browser-view"]`（面板根 + 会话头触发器）；chip 内自有部分 `[data-dsh-part="tab-title"]` |
| `plugin-manager` | dsh-plugin-manager | 官方「插件」页上本插件的两处注入：检查更新工具条根与内置插件分组根；`[data-dsh-plugin="plugin-manager"]` |

## 已知脆弱点（上游主题缝 PR 诉求）

1. AppFrame 三列容器本体只有 hash 类，列级钩子缺失 → 诉求：三列自带稳定 data 钩子。
2. 侧栏导航行已有官方 list slot（`sidebar.panellist`，2026-09 面板家族迁移后插件不再注入 DOM），但行盒本体仍只有 CSS-module 类、无稳定 data 钩子 → 诉求：`sidebar.panellist` 的行盒自带稳定属性（现由兼容适配器从 `[class*="panelRow"]:has([data-dsh-panel-entry])` 补打 `sidebar-entry`，见 part 组）。
3. 设置模态只有 `role="dialog"`（与其他对话框撞车）→ 诉求：设置 dialog 根专属标识。
4. list slot 的单 entry 无 DOM 归属标识 → 诉求：slot entry 渲染透传 entry id 到 DOM（现由各插件字形自带的 `data-dsh-panel-entry` 代偿，见 part 组末尾）。
