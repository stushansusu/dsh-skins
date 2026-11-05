/**
 * Skin-center locale dictionaries. The plugin-card name, its description,
 * and every control of the in-GUI skin center is localized through the
 * standard `t` seat.
 */

/** Copy keys owned by this plugin. */
export type SkinCenterKey =
  | 'title'
  | 'cardDescription'
  | 'pluginLooksTitle'
  | 'externalWallpaperName'
  | 'externalWallpaperReadyTitle'
  | 'externalWallpaperReadyBody'
  | 'externalWallpaperMissingTitle'
  | 'externalWallpaperMissingBody'
  | 'externalWallpaperLink'
  | 'externalWallpaperRecommended'
  | 'externalWallpaperInstall'
  | 'externalWallpaperInstalling'
  | 'externalWallpaperCopyCommand'
  | 'externalWallpaperCopied'
  | 'externalWallpaperInstallFailed'
  | 'delegatedSkinBadge'
  | 'delegatedSkinDescriptionClaudeStyle'
  | 'delegatedSkinNotRunning'
  | 'delegatedSkinManage'
  | 'delegatedSkinNoHandoff'
  | 'delegatedSkinInstall'
  | 'delegatedSkinInstalling'
  | 'delegatedSkinInstallFailed'
  | 'delegatedSkinDescriptorMismatch'
  | 'delegatedSkinLink'
  | 'stoodDownTitle'
  | 'stoodDownBody'
  | 'enabled'
  | 'enabledHint'
  | 'offNote'
  | 'official'
  | 'officialTagline'
  | 'active'
  | 'tryingOn'
  | 'tryOn'
  | 'loading'
  | 'exitTryOn'
  | 'apply'
  | 'applying'
  | 'restore'
  | 'applyFailed'
  | 'appliedUnconfirmed'
  | 'appliedNeedRestart'
  | 'theme'
  | 'themeLight'
  | 'themeDark'
  | 'tryOnError'
  | 'backgroundOpacity'
  | 'backgroundBlurEmpty'
  | 'backgroundBlurContent'
  | 'inputCardBlur'
  | 'inputCardBlurHint'
  | 'bubbleOpacity'
  | 'bubbleOpacityHint'
  | 'bubbleBlur'
  | 'bubbleBlurHint'
  | 'backgroundBlurHint'
  | 'backgroundBlurInert'
  | 'backgroundHint'
  | 'backgroundHintInert'
  | 'wallpaperTitle'
  | 'wallpaperEnable'
  | 'wallpaperHint'
  | 'wallpaperLoadError'
  | 'wallpaperLibraryFound'
  | 'wallpaperLibraryManual'
  | 'wallpaperRefresh'
  | 'wallpaperMode'
  | 'wallpaperModeLive'
  | 'wallpaperModeFrame'
  | 'wallpaperFit'
  | 'wallpaperFitCover'
  | 'wallpaperFitContain'
  | 'wallpaperFitFill'
  | 'wallpaperClear'
  | 'wallpaperDim'
  | 'wallpaperOpacity'
  | 'wallpaperBlur'
  | 'wallpaperPauseHidden'
  | 'wallpaperSound'
  | 'wallpaperSoundHint'
  | 'wallpaperVolume'
  | 'wallpaperImport'
  | 'wallpaperImportHint'
  | 'wallpaperReimport'
  | 'wallpaperRemove'
  | 'wallpaperUpdateAvailable'
  | 'wallpaperEmpty'
  | 'wallpaperTypeVideo'
  | 'wallpaperTypeWeb'
  | 'wallpaperTypeScene'
  | 'wallpaperTypeApp'
  | 'wallpaperLoadMore'
  | 'wallpaperDirs'
  | 'wallpaperDirsEmpty'
  | 'wallpaperDirsHint'
  | 'wallpaperDirPlaceholder'
  | 'wallpaperDirAdd'
  | 'wallpaperDirBrowse'
  | 'wallpaperDirBrowseHint'
  | 'wallpaperDirBrowseFailed'
  | 'wallpaperDirBrowseTitle'
  | 'wallpaperDirBrowseChoose'
  | 'wallpaperDirBrowseEmpty'
  | 'wallpaperDirBrowseHidden'
  | 'wallpaperDirBrowseTruncated'
  | 'wallpaperSaveFailed'
  | 'wallpaperRatingAll'
  | 'wallpaperRatingG'
  | 'wallpaperRatingPg13'
  | 'wallpaperRatingR18'
  | 'wallpaperPagePrev'
  | 'wallpaperPageNext'
  | 'wallpaperPageJump'
  | 'wallpaperPageTotal'
  | 'customThemeTitle'
  | 'customThemeTagline'
  | 'customThemeEdit'
  | 'customThemeCloseEdit'
  | 'customThemeMode'
  | 'customThemeLight'
  | 'customThemeDark'
  | 'customThemeAccent'
  | 'customThemeBackground'
  | 'customThemeForeground'
  | 'customThemeContrast'
  | 'customThemeReset'
  | 'customThemeResetHint'
  | 'customThemeSaveFailed'
  | 'uninstall'
  | 'uninstalling'
  | 'uninstallConfirm'
  | 'uninstallFailed'
  | 'verifyIntegrity'
  | 'verifyingIntegrity'
  | 'verifyAllPassed'
  | 'verifyFoundIssues'
  | 'integrityValid'
  | 'integrityTampered'
  | 'integrityMissing'
  | 'integrityHooksRefused'
  | 'cancel'
  | 'confirm'
  | 'verifyRepaired'
  | 'verifyRepairFailed'
  | 'repair'
  | 'repairing'
  | 'repaired'
  | 'updateAll'
  | 'updateAllChecking'
  | 'updateAllRunning'
  | 'updateAllNone'
  | 'updateAllDone'
  | 'updateAllFailed'
  | 'uninstallAll'
  | 'uninstallAllConfirm'
  | 'uninstallAllRunning'
  | 'uninstallAllDone'
  | 'uninstallAllFailed'
  | 'marketUnreachable'
  | 'bulkNoUserSkins'

export const en: Record<SkinCenterKey, string> = {
  title: 'Skin Center',
  cardDescription: 'Try on any skin and exit to restore; applying reloads the page.',
  externalWallpaperReadyTitle: 'Wallpapers come from their own plugin',
  externalWallpaperReadyBody: 'The library, rendering and settings live in {package}. While it plays a wallpaper, the skin sits on top.',
  externalWallpaperMissingTitle: 'Wallpaper Engine is its own plugin now',
  externalWallpaperMissingBody: 'Install {package} and restart dsh to use Wallpaper Engine wallpapers.',
  externalWallpaperLink: 'Open the wallpaper plugin docs',
  pluginLooksTitle: 'Looks from other plugins',
  externalWallpaperName: 'Wallpaper Engine',
  externalWallpaperRecommended: 'Recommended',
  externalWallpaperInstall: 'Install',
  externalWallpaperInstalling: 'Installing...',
  externalWallpaperCopyCommand: 'Copy command',
  externalWallpaperCopied: 'Copied',
  externalWallpaperInstallFailed: 'Install failed: {reason}',
  delegatedSkinBadge: 'Plugin theme',
  delegatedSkinDescriptionClaudeStyle: 'The whole interface as Claude Code Desktop, with its own settings page.',
  delegatedSkinNotRunning: 'Installed but not running. Enable it in Plugins, then reopen this page.',
  delegatedSkinNoHandoff: 'This build cannot hand the page to another skin. Update dsh-claude-style.',
  delegatedSkinInstall: 'Install now',
  delegatedSkinManage: 'Manage in Plugins',
  delegatedSkinInstalling: 'Installing...',
  delegatedSkinInstallFailed: 'Install failed: {reason}',
  delegatedSkinDescriptorMismatch: 'The plugin declares a different skin than this page knows. Update the plugin.',
  delegatedSkinLink: 'Open the plugin docs',
  stoodDownTitle: 'Skin paused while a wallpaper plays',
  stoodDownBody: 'The skin stays selected and comes back when the wallpaper stops.',
  enabled: 'Skin center',
  enabledHint: 'When off, try-on, apply and background controls stop.',
  offNote: 'The skin center is off.',
  official: 'Official default',
  officialTagline: 'The default DSH look.',
  active: 'Active',
  tryingOn: 'Trying on',
  tryOn: 'Try on',
  loading: 'Loading…',
  exitTryOn: 'Exit try-on',
  apply: 'Apply',
  applying: 'Applying…',
  restore: 'Restore',
  applyFailed: 'Apply failed',
  appliedUnconfirmed: 'Written but not confirmed yet: refresh in dev mode, or restart DSH Desktop.',
  appliedNeedRestart: 'Written and confirmed, but the host did not hot-reload; restart dsh.',
  theme: 'Theme preview',
  themeLight: 'Light',
  themeDark: 'Dark',
  tryOnError: 'Try-on failed; see the console.',
  backgroundOpacity: 'Background occlusion',
  backgroundBlurEmpty: 'Blur when empty',
  backgroundBlurContent: 'Blur with content',
  inputCardBlur: 'Input card blur',
  inputCardBlurHint: 'Blurs only the area behind the input card.',
  bubbleOpacity: 'Bubble opacity',
  bubbleOpacityHint: 'For skins with translucent bubbles, such as Whale Mom.',
  bubbleBlur: 'Bubble blur',
  bubbleBlurHint: 'Blurs the area behind message bubbles; 0 turns it off.',
  backgroundBlurHint: 'One blur for an empty chat and one for a busy chat; 0 turns it off.',
  backgroundBlurInert: 'Only for skins with backdrop art.',
  backgroundHint: 'Veils the backdrop; higher values fade the art.',
  backgroundHintInert: 'Only for skins with backdrop art, such as Blue Fantasy or Whale Song.',
  wallpaperTitle: 'Wallpaper Engine',
  wallpaperEnable: 'Enable wallpapers',
  wallpaperHint: 'Use your local Wallpaper Engine library as the GUI backdrop: video, web, and scene wallpapers render live (scene wallpapers need WebGL). On macOS there is no Wallpaper Engine library, so the feature starts off — turn it on, then add a folder of videos.',
  wallpaperLoadError: 'Wallpaper library failed to load',
  wallpaperLibraryFound: 'Wallpaper Engine library detected',
  wallpaperLibraryManual: 'Folders you added',
  wallpaperRefresh: 'Refresh',
  wallpaperMode: 'Render mode',
  wallpaperModeLive: 'Live',
  wallpaperModeFrame: 'Static frame',
  wallpaperFit: 'Sizing mode',
  wallpaperFitCover: 'Cover (fill)',
  wallpaperFitContain: 'Fit (entire image)',
  wallpaperFitFill: 'Stretch',
  wallpaperClear: 'Turn off wallpaper',
  wallpaperDim: 'Wallpaper dimming',
  wallpaperOpacity: 'Wallpaper opacity',
  wallpaperBlur: 'Wallpaper blur',
  wallpaperPauseHidden: 'Pause when window hidden',
  wallpaperSound: 'Wallpaper sound',
  wallpaperSoundHint: 'Play video wallpaper audio. The browser may keep it silent until you click or press a key once.',
  wallpaperVolume: 'Wallpaper volume',
  wallpaperImport: 'Import',
  wallpaperImportHint: 'Copy this wallpaper into local storage, so it keeps working even if the Steam library moves or changes',
  wallpaperReimport: 'Update',
  wallpaperRemove: 'Remove',
  wallpaperUpdateAvailable: 'The workshop original changed since import — update the local copy',
  wallpaperEmpty: 'No wallpapers found. Add a folder of videos below, or subscribe in the Wallpaper Engine workshop on Windows.',
  wallpaperTypeVideo: 'Video',
  wallpaperTypeWeb: 'Web',
  wallpaperTypeScene: 'Scene (static)',
  wallpaperTypeApp: 'Unsupported',
  wallpaperLoadMore: 'Load more',
  wallpaperDirs: 'Manual folders',
  wallpaperDirsEmpty: 'No folders yet — add one to load its videos.',
  wallpaperDirsHint: 'On macOS: pick a folder of .mp4/.webm videos (or a wallpaper project folder). On Windows, folders extend the auto-detected Wallpaper Engine library.',
  wallpaperDirPlaceholder: '/path/to/wallpapers or ~/Movies/wallpapers',
  wallpaperDirAdd: 'Add',
  wallpaperDirBrowse: 'Browse…',
  wallpaperDirBrowseHint: 'Pick a folder with the system file manager (Finder / Explorer)',
  wallpaperDirBrowseFailed: 'Could not open the system folder picker — type the path manually instead',
  wallpaperDirBrowseTitle: 'Select a folder',
  wallpaperDirBrowseChoose: 'Use this folder',
  wallpaperDirBrowseEmpty: 'No subfolders',
  wallpaperDirBrowseHidden: 'Show hidden folders',
  wallpaperDirBrowseTruncated: 'Too many folders to list; only the beginning is shown.',
  wallpaperSaveFailed: 'Could not save wallpaper settings.',
  wallpaperRatingAll: 'All',
  wallpaperRatingG: 'G',
  wallpaperRatingPg13: 'PG-13',
  wallpaperRatingR18: 'R18',
  wallpaperPagePrev: 'Previous',
  wallpaperPageNext: 'Next',
  wallpaperPageJump: 'Go',
  wallpaperPageTotal: 'Page {page} / {total}',
  customThemeTitle: 'Custom theme',
  customThemeTagline: 'A palette derived from the default theme and saved on its own.',
  customThemeEdit: 'Edit',
  customThemeCloseEdit: 'Collapse',
  customThemeMode: 'Editing mode',
  customThemeLight: 'Light',
  customThemeDark: 'Dark',
  customThemeAccent: 'Accent',
  customThemeBackground: 'Background',
  customThemeForeground: 'Foreground',
  customThemeContrast: 'Contrast',
  customThemeReset: 'Restore current mode default',
  customThemeResetHint: 'Resets only the light or dark profile in view.',
  customThemeSaveFailed: 'Could not save custom theme changes.',
  uninstall: 'Uninstall',
  uninstalling: 'Uninstalling…',
  uninstallConfirm: 'Are you sure you want to uninstall "{name}"? Local files will be deleted.',
  uninstallFailed: 'Uninstall failed',
  verifyIntegrity: 'Verify integrity',
  verifyingIntegrity: 'Verifying…',
  verifyAllPassed: 'All {count} installed skin(s) passed integrity verification',
  verifyFoundIssues: 'Found {count} skin(s) with integrity issues',
  integrityValid: 'Verified',
  integrityTampered: 'Modified',
  integrityMissing: 'Missing files',
  integrityHooksRefused: 'Hooks refused',
  cancel: 'Cancel',
  confirm: 'Confirm',
  verifyRepaired: 'Successfully repaired {count} skin(s) with integrity issues',
  verifyRepairFailed: 'Failed to repair {count} skin(s)',
  updateAll: 'Update all',
  updateAllChecking: 'Checking versions…',
  updateAllRunning: 'Updating {done}/{total}…',
  updateAllNone: 'All installed skins are up to date',
  updateAllDone: 'Updated {count} skin(s)',
  updateAllFailed: '{count} skin(s) failed to update',
  uninstallAll: 'Uninstall all',
  uninstallAllConfirm: 'Uninstall all {count} market-installed skin(s)? Their local files are deleted permanently and the GUI returns to the default look.',
  uninstallAllRunning: 'Uninstalling {done}/{total}…',
  uninstallAllDone: 'Uninstalled {count} skin(s)',
  uninstallAllFailed: '{count} skin(s) failed to uninstall',
  marketUnreachable: 'Could not reach the skin market to read versions',
  bulkNoUserSkins: 'No market-installed skins to act on',
  repair: 'Repair',
  repairing: 'Repairing…',
  repaired: 'Repaired',
}

export const zh: Record<SkinCenterKey, string> = {
  title: '皮肤',
  cardDescription: '试穿任意皮肤，退出即还原；应用后页面自动刷新。',
  externalWallpaperReadyTitle: '壁纸由独立插件提供',
  externalWallpaperReadyBody: '壁纸库、渲染与设置都在 {package} 里。它播放壁纸时，皮肤叠在壁纸之上。',
  externalWallpaperMissingTitle: 'Wallpaper Engine 已独立成插件',
  externalWallpaperMissingBody: '安装 {package} 后重启 dsh，就能用 Wallpaper Engine 壁纸。',
  externalWallpaperLink: '打开壁纸插件文档',
  pluginLooksTitle: '插件提供的外观',
  externalWallpaperName: 'Wallpaper Engine',
  externalWallpaperRecommended: '推荐',
  externalWallpaperInstall: '一键安装',
  externalWallpaperInstalling: '安装中…',
  externalWallpaperCopyCommand: '复制命令',
  externalWallpaperCopied: '已复制',
  externalWallpaperInstallFailed: '安装失败：{reason}',
  delegatedSkinBadge: '插件皮肤',
  delegatedSkinDescriptionClaudeStyle: '整个界面换成 Claude Code Desktop 的样子，自带设置页。',
  delegatedSkinNotRunning: '插件已安装但没有运行。在「插件」里启用后刷新本页。',
  delegatedSkinNoHandoff: '当前版本不能和别的皮肤交接页面，请更新 dsh-claude-style。',
  delegatedSkinInstall: '一键安装',
  delegatedSkinManage: '在插件页管理',
  delegatedSkinInstalling: '安装中…',
  delegatedSkinInstallFailed: '安装失败：{reason}',
  delegatedSkinDescriptorMismatch: '插件声明的皮肤与这里记录的不一致，请更新插件。',
  delegatedSkinLink: '打开插件文档',
  stoodDownTitle: '壁纸播放时皮肤暂停',
  stoodDownBody: '皮肤仍然选着，壁纸停下后自动恢复。',
  enabled: '皮肤中心',
  enabledHint: '关闭后停用试穿、应用与背景调节。',
  offNote: '皮肤中心已关闭。',
  official: '官方默认',
  officialTagline: 'DSH 的默认外观。',
  active: '当前激活',
  tryingOn: '试穿中',
  tryOn: '试穿',
  loading: '加载中…',
  exitTryOn: '退出试穿',
  apply: '应用',
  applying: '应用中…',
  restore: '恢复默认',
  applyFailed: '应用失败',
  appliedUnconfirmed: '已写入配置，尚未确认生效：开发模式请刷新页面，DSH Desktop 请重启应用。',
  appliedNeedRestart: '已写入并确认，但宿主没有热重载，请重启 dsh。',
  theme: '主题预览',
  themeLight: '亮色',
  themeDark: '暗色',
  tryOnError: '试穿失败，详情见控制台。',
  backgroundOpacity: '背景遮挡',
  backgroundBlurEmpty: '空对话背景模糊',
  backgroundBlurContent: '有对话背景模糊',
  inputCardBlur: '输入卡模糊',
  inputCardBlurHint: '只模糊输入卡背后的区域。',
  bubbleOpacity: '气泡不透明度',
  bubbleOpacityHint: '适用于支持气泡透明度的皮肤，例如鲸鱼妈妈。',
  bubbleBlur: '气泡模糊程度',
  bubbleBlurHint: '模糊消息气泡背后的区域，0 为关闭。',
  backgroundBlurHint: '空对话与有内容时各用一档模糊，0 为关闭。',
  backgroundBlurInert: '只对带背景图的皮肤有效。',
  backgroundHint: '给背景加一层遮罩，数值越高插画越淡。',
  backgroundHintInert: '只对带背景图的皮肤有效，例如蓝色幻想、鲸吟。',
  wallpaperTitle: 'Wallpaper Engine',
  wallpaperEnable: '启用动态壁纸',
  wallpaperHint: '把本机 Wallpaper Engine 壁纸库用作 GUI 背景：视频、网页与场景壁纸均动态渲染（场景壁纸需要 WebGL）。macOS 没有 Wallpaper Engine 壁纸库，该功能默认关闭；开启后添加一个存放视频的目录即可。',
  wallpaperLoadError: '壁纸库加载失败',
  wallpaperLibraryFound: '已检测到 Wallpaper Engine 壁纸库',
  wallpaperLibraryManual: '来自你添加的目录',
  wallpaperRefresh: '刷新',
  wallpaperMode: '渲染模式',
  wallpaperModeLive: '动态',
  wallpaperModeFrame: '静态帧',
  wallpaperFit: '适应方式',
  wallpaperFitCover: '铺满裁剪',
  wallpaperFitContain: '完整缩放',
  wallpaperFitFill: '拉伸铺满',
  wallpaperClear: '关闭壁纸',
  wallpaperDim: '壁纸暗化',
  wallpaperOpacity: '壁纸不透明度',
  wallpaperBlur: '壁纸模糊',
  wallpaperPauseHidden: '窗口隐藏时暂停',
  wallpaperSound: '壁纸声音',
  wallpaperSoundHint: '播放视频壁纸的声音。浏览器可能在首次点击或按键前保持静音。',
  wallpaperVolume: '壁纸音量',
  wallpaperImport: '导入',
  wallpaperImportHint: '把该壁纸复制到本地存储，Steam 库迁移或变动后仍可继续使用',
  wallpaperReimport: '更新',
  wallpaperRemove: '移除',
  wallpaperUpdateAvailable: '工坊原件在导入后有更新——同步更新本地副本',
  wallpaperEmpty: '未发现壁纸。请在下方添加一个存放视频的目录；Windows 上也可先在 Wallpaper Engine 创意工坊订阅。',
  wallpaperTypeVideo: '视频',
  wallpaperTypeWeb: '网页',
  wallpaperTypeScene: '场景(静态)',
  wallpaperTypeApp: '不支持',
  wallpaperLoadMore: '加载更多',
  wallpaperDirs: '手动目录',
  wallpaperDirsEmpty: '还没有目录——添加一个以加载其中的视频。',
  wallpaperDirsHint: 'macOS：选择一个存放 .mp4/.webm 视频的目录（或单个壁纸项目文件夹）。Windows：这里添加的目录会扩展自动检测到的 Wallpaper Engine 壁纸库。',
  wallpaperDirPlaceholder: '/path/to/wallpapers 或 ~/Movies/wallpapers',
  wallpaperDirAdd: '添加',
  wallpaperDirBrowse: '浏览…',
  wallpaperDirBrowseHint: '通过系统文件管理器（访达 / 资源管理器）选择文件夹',
  wallpaperDirBrowseFailed: '无法打开系统目录选择框——请手动输入路径',
  wallpaperDirBrowseTitle: '选择文件夹',
  wallpaperDirBrowseChoose: '使用此目录',
  wallpaperDirBrowseEmpty: '没有子目录',
  wallpaperDirBrowseHidden: '显示隐藏目录',
  wallpaperDirBrowseTruncated: '目录过多，仅显示开头部分。',
  wallpaperSaveFailed: '壁纸设置保存失败。',
  wallpaperRatingAll: '全部',
  wallpaperRatingG: 'G',
  wallpaperRatingPg13: 'PG-13',
  wallpaperRatingR18: 'R18',
  wallpaperPagePrev: '上一页',
  wallpaperPageNext: '下一页',
  wallpaperPageJump: '跳转',
  wallpaperPageTotal: '第 {page} / {total} 页',
  customThemeTitle: '自定义主题',
  customThemeTagline: '从默认主题派生、单独保存的配色。',
  customThemeEdit: '编辑',
  customThemeCloseEdit: '收起',
  customThemeMode: '编辑模式',
  customThemeLight: '浅色',
  customThemeDark: '深色',
  customThemeAccent: '强调色',
  customThemeBackground: '背景色',
  customThemeForeground: '前景色',
  customThemeContrast: '对比度',
  customThemeReset: '恢复当前模式默认',
  customThemeResetHint: '只重置当前的浅色或深色配置。',
  customThemeSaveFailed: '自定义主题修改保存失败。',
  uninstall: '卸载',
  uninstalling: '卸载中…',
  uninstallConfirm: '确定要卸载皮肤「{name}」吗？本地文件将被永久删除。',
  uninstallFailed: '卸载失败',
  verifyIntegrity: '验证完整性',
  verifyingIntegrity: '正在验证…',
  verifyAllPassed: '所有 {count} 款已安装皮肤完整性正常',
  verifyFoundIssues: '发现 {count} 款皮肤存在完整性异常',
  verifyRepaired: '已自动修复 {count} 款皮肤的完整性异常',
  verifyRepairFailed: '{count} 款皮肤自动修复失败',
  updateAll: '全部更新',
  updateAllChecking: '正在检查版本…',
  updateAllRunning: '正在更新 {done}/{total}…',
  updateAllNone: '所有已安装皮肤均为最新版本',
  updateAllDone: '已更新 {count} 款皮肤',
  updateAllFailed: '{count} 款皮肤更新失败',
  uninstallAll: '全部卸载',
  uninstallAllConfirm: '确定要卸载全部 {count} 款市场安装的皮肤吗？本地文件将被永久删除，界面回到默认外观。',
  uninstallAllRunning: '正在卸载 {done}/{total}…',
  uninstallAllDone: '已卸载 {count} 款皮肤',
  uninstallAllFailed: '{count} 款皮肤卸载失败',
  marketUnreachable: '无法连接皮肤市场以读取版本',
  bulkNoUserSkins: '没有可操作的市场安装皮肤',
  repair: '修复',
  repairing: '修复中…',
  repaired: '已修复',
  integrityValid: '完整',
  integrityTampered: '文件已修改',
  integrityMissing: '缺少文件',
  integrityHooksRefused: 'Hooks 已拒绝',
  cancel: '取消',
  confirm: '确定',
}
