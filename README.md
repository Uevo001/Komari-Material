# Komari Material

基于 Vue 3、Vite 和 Material Design 3 二次开发的 Komari Monitor 主题。它面向服务器监控面板场景，重点优化节点列表的信息密度、动态配色、移动端适配和主题配置能力。

![Komari Material 预览图](docs/preview.png)

## 特性

- Material Design 3 风格界面，支持亮色、暗色和跟随系统
- 支持手动种子色、内置调色盘、壁纸取色三种 Monet 动态配色模式
- 提供卡片视图、列表视图、双栏紧凑列表视图
- 支持节点搜索、分组筛选、全部节点隐藏指定分组
- 支持 WebSocket / HTTP RPC 连接模式切换
- 支持最近 1 小时延迟与丢包摘要、节点延迟图表和负载图表
- 支持公告、备案信息、自定义图片或视频背景
- 构建时自动生成 Komari 可导入的主题 zip 包

## 安装使用

1. 从 [Releases](https://github.com/Liebesfreud/Komari-Material/releases) 下载最新的 `komari-theme-material-build-*.zip`
2. 登录 Komari Monitor 管理后台
3. 进入 `设置` -> `主题管理`
4. 上传下载好的 zip 文件
5. 刷新页面并切换到 `Komari Material`

也可以从源码构建：

```bash
pnpm install
pnpm build
```

构建完成后，仓库根目录会生成 `komari-theme-material-build-<commit>.zip`。

## 开发

环境要求：

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `10.x`

本地开发：

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

如果需要把本地开发请求代理到已有 Komari 实例，请在 `.env.local` 中设置：

```env
KOMARI_PROXY_TARGET=https://your-komari.example.com
VITE_API_BASE=/api
```

常用命令：

```bash
pnpm dev       # 启动 Vite 开发服务器
pnpm lint      # 运行 oxlint 和 eslint，并自动修复
pnpm build     # 类型检查、生产构建、打包主题 zip
pnpm preview   # 预览生产构建结果
```

## 主题配置

主题配置由 `komari-theme.json` 提供，并由 Komari 以 managed configuration 的方式注入。当前主要配置包括：

- 基础设置：数据刷新间隔、RPC 连接模式、默认视图、登录按钮、延迟图表按钮
- 节点展示：延迟与丢包摘要、卡片进度条布局、列表状态样式、全部节点隐藏分组
- 页面外观：最大页面宽度、界面密度、字体、数字字体、Material You 配色模式
- 内容增强：公告、ICP备案、公安备案
- 背景设置：图片/视频背景、亮暗色背景地址、模糊和遮罩

修改配置字段后请运行 `pnpm build`，确保主题 manifest 与生产包一致。

## 项目结构

```text
src/                  应用源码
src/components/       节点卡片、列表、图表、外观面板等组件
src/stores/           Pinia 状态管理
src/utils/            API、RPC、格式化、地区和系统图标辅助逻辑
public/images/        运行时图片资源，包含旗帜和系统 Logo
docs/preview.png      发布预览图，会被打包为 preview.png
komari-theme.json     Komari 主题 manifest 和配置 schema
vite.config.ts        Vite 配置和主题 zip 打包逻辑
```

## 开源说明

本项目基于上游 Komari 主题生态进行二次开发，并保留原项目 MIT License 版权声明。二次开发部分同样以 MIT License 开源。

相关项目：

- [Komari](https://github.com/komari-monitor/komari)
- [Komari Next](https://github.com/tonyliuzj/komari-next)
- [Vue](https://vuejs.org/)
- [Vite](https://vite.dev/)
- [Material Web](https://material-web.dev/)
- [UnoCSS](https://unocss.dev/)

## License

[MIT](LICENSE)
