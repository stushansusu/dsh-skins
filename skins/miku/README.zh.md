# 初音未来 · 电子歌姬 (Hatsune Miku · Electronic Diva)

[English](README.md) | 中文

适用于 dsh-web 的初音未来主题，建在两张插画与两套独立配色上：浅色是青白冷调的
**青空舞台**，深色是霓虹感的**夜海**。两个档位不是同一张图加滤镜，而是各自一套
色板，所以面板在两种底色上都能保持可读。

## 构成

- `skin.json` —— v2 清单。
- `skin.css` —— 完整重映射 `--dsw-alias-*` 令牌集，明暗各一段。
- `patches.css` —— L3 自由选择器，补令牌集覆盖不到的面。
- `assets/miku-art-light.jpg` / `assets/miku-art.webp` —— 浅色档与深色档插画。
- `hooks.mjs` —— 可选。`skin.json` 里 `SkinHooks` 声明为 `optional: true`，
  所以 hooks 面被拒时，声明部分（样式表、补丁、插画）照常加载。

会话栏刻意完全透明，让插画直通；面板走机甲斜切角、拉丝金属与青蓝／品红渐变描边，
输入区做成座舱凹槽并配主题色光标。

## 宿主兼容

按 DSH 0.1.7 编写：

- 阴影同时绑在 `--dsw-alias-shadow-lv*` 与外壳实际读取的**无前缀**
  `--dsw-shadow-lv*` 两套名字上。
- 皮肤刻意**不**给 `[data-dsh-frame]` 设 `height` / `min-height`：宿主已经自己把
  画框设成 `100dvh`，硬撑回满高会踩坏「故意缩短画框、给上下 HUD 让位」的皮肤。
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
