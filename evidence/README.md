# black-gold 修复证据（PR #5）

本目录是 PR #5（`fix/skin-black-gold-host-adaptation`）的截图证据。全部为**真壳实拍**：
拍摄对象是本分支的 `skins/black-gold/patches.css`（下称 head）与 `upstream/main` 上的同一个
文件（下称 base），在同一台机器、同一套运行中的宿主上渲染。

## 拍摄与校验方法

- 宿主：本机运行中的 `dsh web`（`http://127.0.0.1:3080`，0.1.7-rc.2-3f4338f），视口与
  暗色方案按每张图的文件名标注。
- 换皮方式：把待测的那一份 `patches.css` 覆盖到 `$DSH_HOME/skins/black-gold/patches.css`，
  浏览器重新加载页面，由皮肤中心按该路径提供样式；拍完还原本机原有那一份。
- 每轮拍摄前，脚本再从 `/api/skin-center/v2/skins/black-gold/patches` 回读**当轮真正被浏览器
  加载的** CSS 并记录 sha256，所以每张图对应的 CSS 版本由接口回读锚定，而不是口头说明。

| 轮次 | 磁盘文件 sha256（与分支 blob 一致） | 接口回读 sha256 | 长度 | 含 `[class*='md-code-block']` |
| --- | --- | --- | --- | --- |
| base（`upstream/main`，19109 B） | `85474dcfabc1840dd69041fb95a49d0c136b99d9ca8d49a6c6129e79792854bc` | `384d76be0bfd6e4c1bfd8ac20ffd933de7131fe4682085091c05f5c9bb899740` | 18617 | 否 |
| after 拍摄轮（本分支 `b09554e`，22434 B） | `7537f984255b1ed0e0153948ea3f61cbe86dca0b5b12069ad474f06c95abd46c` | `add7cad1b5e5a3d16edf992635a1ef1d1ea4ed71cfb5cbadefd9c0dec60938bc` | 21037 | 是 |
| 当前 head（本分支 `27bb789`，22834 B） | `f9156fc456ad215dc5533d4187af162107e7153621deb2b57be98bf9c2d51138` | `cc76a3ea3f9a9fea5d4c4fb0e8ba8a7be80d6fe9950077de458af7d54cfe9466` | 21226 | 是 |

`27bb789` 相对拍摄轮只删掉了 `@supports (height: 100dvh) { [data-dsh-frame] { ... } }` 那一段
（复核意见）。这一段不影响上面任何一张 after 图的画面：宿主自己就把画框钉成 100dvh，
black-gold 也不缩短画框，删掉之后 `[data-dsh-frame]` 的实际尺寸与删除前相同——它恢复的是宿主
`[data-dsh-frame] { min-height: 0 }` 那条 shim 的语义（也就是复核意见指出的那一点）。所以 after
那一列沿用 `b09554e` 的拍摄结果，没有重新出图。

## 量到的差异（浏览器 computed style）

| 项 | base | head |
| --- | --- | --- |
| 代码块外框 `border-radius` | 16px | 2px |
| 代码块内层 `pre` `border-radius` | 0 0 16px 16px | 2px |
| 字标列 `.localBuildBrand` 高度 | 24px（内容 27px，溢出 3px） | 30px（min-height 24px，溢出 0） |
| `body::before` 角花尺寸（<=768px） | 76px | 48px |
| `body::after` filter（<=768px） | blur(1.7px) | none |

代码块那两项的像素差 <= 8/255：代码块压在立绘的暗部，圆角变化几乎不可见，所以这一组
before/after 看起来基本一样。它是一条"把选择器与取值改对"的修复，不是观感修复。字标列
与窄屏两项的差异可见。

## 文件

| 文件 | 内容 |
| --- | --- |
| `black-gold-code-block-before.jpg` / `black-gold-code-block-after.jpg` | 1440x900，会话里的代码块 |
| `black-gold-code-block-zoom-before.png` / `black-gold-code-block-zoom-after.png` | 同一代码块的 1:1 裁切 |
| `black-gold-brand-column-before.png` / `black-gold-brand-column-after.png` | 侧栏字标列（版本号药丸那一列）3x 裁切 |
| `black-gold-narrow-768-before.jpg` / `black-gold-narrow-768-after.jpg` | 768x900，正好压在 `max-width: 768px` 边界上 |
| `black-gold-narrow-390-before.jpg` / `black-gold-narrow-390-after.jpg` | 390x844 |

两点说明：

1. 窄屏（<=768px）时宿主自己切到竖屏层，会话正文与输入卡不在这张首屏里，所以窄屏两张主要
   用来对比立绘羽化与四角角花的降档；正文里的代码块证据是 1440 那两张。
2. 截图里出现的粉色小人是本机安装的 pet 插件，与皮肤无关。
