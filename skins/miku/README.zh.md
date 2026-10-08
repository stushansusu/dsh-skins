# 初音未来 · 电子歌姬 (Hatsune Miku · Electronic Diva)

[English](README.md) | 中文

适用于 dsh-web 的初音未来主题，建在两张插画与两套独立配色上：浅色是近白的
**晴空台**，深色是夜蓝石板的**夜航台**。两个档位不是同一张图加滤镜，而是各自一套
色板，所以面板在两种底色上都能保持可读。

## 构成

- `skin.json` —— v2 清单。
- `skin.css` —— 完整重映射 `--dsw-alias-*` 令牌集，明暗各一段。
- `patches.css` —— L3 自由选择器，补令牌集覆盖不到的面。
- `assets/miku-art-light.jpg` / `assets/miku-art.webp` —— 浅色档与深色档插画。
- `hooks.mjs` —— 可选。`skin.json` 里 `SkinHooks` 声明为 `optional: true`，
  所以 hooks 面被拒时，声明部分（样式表、补丁、插画）照常加载。

会话栏刻意完全透明，让插画直通。面板一律是**平涂**：1px 发丝线、8–18px 圆角、
三档柔影；玻璃只留给浮层（菜单、下拉、两条注入横条）。配色收成**一支青绿**
（初音的 `#39C5BB` 家族）并分成两种用途：浅色 `#0b7a72` / 深色 `#39c5bb` 用来承字与图标，
而亮青绿 `#2bc4b8` **只当填充** —— 它当字压在白色面板上只有 2.1:1。洋红（`#c02a72` /
`#ff63ae`）只给用户自己的轮次。字体是 **Inter**（拉丁与数字）+ Noto Sans SC（中文）。

母题是**声波**：空会话首屏一排细声波柱、输入卡底缘一道聚焦时亮起的 2px 信号线、
品牌行一枚 `MIKU` 徽标。更早那套机甲语汇（12px 斜切角、角部铆钉、拉丝金属、
`4px 4px 0` 硬投影、彩虹渐变横幅、6px 网点铺面）整套撤掉：现在样式表里
**一处 `clip-path` 都没有**，所以焦点环回到普通 `outline`，不必再为切角写内嵌环；
凡是可能挂 fixed 后代的地方也**没有 `filter`**。

上一版声明的 **140 个自定义属性一个不少**（同集，不多不漏），明暗各 20 组关键配对
重新量过：正文 16.1:1 / 15.6:1、次级 6.9:1 / 8.9:1、三级 5.2:1 / 6.0:1、
主按钮标签 5.2:1 / 7.3:1、发送箭头 7.8:1 / 8.0:1。

有两处外壳自己画的面临时被皮肤接管了 —— 因为它们不读令牌集：一是**浮动状态气泡**
（外壳把它的字与 1px 边都写死成 `#f4f7ff`，**明暗两档一模一样**，压在浅色插画上等于
看不见），二是 `usage` 插件在侧栏底部画的那张**用量卡**（只给了 12px 圆角、没有面）。
两处都走外壳自己的钩子（`[class*="bubble"]` 排除它的布局包装层，以及
`data-dsh-part="foot-card*"`）。

## 宿主兼容

按 DSH 0.1.7 编写：

- 阴影同时绑在 `--dsw-alias-shadow-lv*` 与外壳实际读取的**无前缀**
  `--dsw-shadow-lv*` 两套名字上。
- 皮肤刻意**不**给 `[data-dsh-frame]` 设 `height` / `min-height`：宿主已经自己把
  画框设成 `100dvh`，硬撑回满高会踩坏「故意缩短画框、给上下 HUD 让位」的皮肤。
- Windows 桌面端外壳会给整块窗口画框刷一层不透明底，而画框是会话列的祖先，
  会把插画压死，所以本皮把它置透明（`[data-dsh-frame] { background: none }`）。
  外壳那条标题栏横带保留自己的底 —— 它是窗口拖拽区，也垫着原生菜单栏。
- 768px 以下只补两件事：两条注入横条的 `env(safe-area-inset-*)` 安全区，
  以及粗指针设备上的 `cursor: auto`（触摸端不需要那套自定义 PNG 光标）。

## 预览

`preview/light.jpg` / `preview/dark.jpg` —— 运行中的皮肤，1440×900 实拍。

## 版权与许可

| 部分 | 作者 / 权利人 |
| --- | --- |
| 立绘素材 —— `assets/miku-art-light.jpg`、`assets/miku-art.webp` | 涂山苏苏，为本皮肤原创绘制 |
| 皮肤代码 —— `skin.json`、`skin.css`、`patches.css`、`hooks.mjs` | zhu1090093659 |
| 角色 —— 「初音未来 / Hatsune Miku」 | © Crypton Future Media, INC. |

角色依[ピアプロ・キャラクター・ライセンス（Piapro Character
License）](https://piapro.jp/license/pcl/summary)使用。本皮肤是**非官方、非商业的
同人作品**：与 Crypton Future Media, INC. 无隶属、赞助或背书关系，除该许可允许的
范围外不授予任何角色相关权利。角色及其设计的全部权利归 Crypton Future Media, INC.
及相关权利人所有。
