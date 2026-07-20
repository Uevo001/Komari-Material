# Komari Material

![Komari Material 封面](docs/preview.png)

一个为 [Komari Monitor](https://github.com/komari-monitor/komari) 打造的 Material Design 3 主题。

Komari Material 将服务器监控所需的信息密度与 Material You 的动态色彩结合起来：既能快速浏览节点状态，也能按照壁纸、品牌色和使用习惯调整界面。桌面端与移动端均可使用，构建产物可直接导入 Komari。

[![Latest Release](https://img.shields.io/github/v/release/Liebesfreud/Komari-Material?display_name=tag&style=flat-square)](https://github.com/Liebesfreud/Komari-Material/releases/latest)
[![License](https://img.shields.io/github/license/Liebesfreud/Komari-Material?style=flat-square)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Material Design 3](https://img.shields.io/badge/Material-Design%203-6750a4?style=flat-square&logo=materialdesign&logoColor=white)](https://m3.material.io/)

## 亮点

- **Material You 动态配色**：支持手动种子色、内置调色盘和壁纸取色，并为亮色与暗色模式生成完整色阶。
- **可调卡片材质**：可在 MD3 实色表面与半透明表面之间切换，并独立调整卡片不透明度。
- **三种节点布局**：提供卡片、列表和双栏紧凑列表，兼顾概览效率与信息密度。
- **完整监控信息**：展示在线状态、系统信息、负载、资源占用、流量、速率、运行时间、延迟和丢包摘要。
- **统一视觉规范**：使用完整的 MD3 字体层级、形状、动效与状态层，内置 Roboto Variable 和 Noto Sans SC Variable。
- **响应式体验**：适配桌面、平板与移动端，外观面板按主题、界面和壁纸分区组织。
- **灵活内容配置**：支持节点搜索、分组筛选、公告、备案信息以及自定义图片或视频背景。
- **多种连接方式**：可按部署环境选择 WebSocket 或 HTTP RPC。

## 安装

1. 前往 [Releases](https://github.com/Liebesfreud/Komari-Material/releases/latest) 下载最新的 `komari-theme-material-build-*.zip`。
2. 登录 Komari 管理后台，进入 `设置` → `主题管理`。
3. 上传 zip 文件，然后切换到 **Komari Material**。
4. 刷新页面即可使用。

> 请直接上传 Release 中的 zip 包，不要解压。源码压缩包不是可导入的主题包。

## 外观与配置

主题后台配置由 [`komari-theme.json`](komari-theme.json) 定义，安装后可在 Komari 中集中管理：

| 分类       | 可配置内容                                             |
| ---------- | ------------------------------------------------------ |
| 基础设置   | 数据刷新间隔、RPC 模式、默认视图、登录入口、延迟图表   |
| 节点展示   | 延迟与丢包摘要、进度条布局、状态样式、分组过滤         |
| 卡片视图   | 实色或半透明材质、不透明度、亮色对比度、标签与流量样式 |
| 页面布局   | 最大宽度、全宽模式、界面密度、字体与数字字体           |
| 动态配色   | 手动种子色、预设调色盘、壁纸取色                       |
| 自定义内容 | 公告、ICP备案、公安备案                                |
| 页面背景   | 图片或视频、亮暗色资源、模糊与遮罩                     |

页面右上角的外观入口还可让访客在本地切换主题、配色、密度、卡片材质和壁纸效果；恢复后台外观后会重新使用管理员设定。

## 从源码构建

环境要求：

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `10.x`

```bash
pnpm install
pnpm build
```

构建会执行类型检查和生产打包，并在仓库根目录生成：

```text
komari-theme-material-build-<commit>.zip
```

压缩包内包含 `dist/`、`komari-theme.json` 和发布预览图 `preview.png`，可直接导入 Komari。

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

如需将本地请求代理到已有 Komari 实例，可编辑 `.env.local`：

```env
KOMARI_PROXY_TARGET=https://your-komari.example.com
VITE_API_BASE=/api
```

常用命令：

```bash
pnpm dev       # 启动开发服务器
pnpm lint      # 检查并修复代码风格
pnpm build     # 类型检查、生产构建并生成主题包
pnpm preview   # 预览生产构建结果
```

## 项目结构

```text
src/                  Vue 应用源码
src/components/       节点卡片、列表、图表与外观面板
src/stores/           Pinia 状态管理
src/utils/            API、RPC、格式化与 Material 主题工具
public/images/        运行时旗帜和系统 Logo
docs/preview.png      README 封面与 Release 预览图
komari-theme.json     主题清单与配置定义
vite.config.ts        构建、优化与主题 zip 打包
```

## 致谢

本项目基于 Komari 主题生态进行二次开发，并保留原项目的 MIT License 版权声明。感谢以下开源项目：

- [Komari](https://github.com/komari-monitor/komari)
- [Komari Next](https://github.com/tonyliuzj/komari-next)
- [Vue](https://vuejs.org/)
- [Vite](https://vite.dev/)
- [Material Web](https://material-web.dev/)
- [UnoCSS](https://unocss.dev/)

## License

[MIT](LICENSE)
