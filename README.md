<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LyrikTrip 官网（Vite + React）+ Cloudflare Worker

本仓库是一个 Vite + React 的静态网站，通过 **Cloudflare Workers（Deploy from Git）** 部署：
- Vite 将静态资源构建到 `dist/`
- Worker 提供静态资源并暴露 `/api/feishu`，用于转发表单提交到飞书，避免在浏览器中暴露 webhook URL

## 项目结构

- `App.tsx`：应用主入口，基于本地状态切换页面（非 URL 路由）。
- `index.tsx` / `index.html`：应用挂载入口。
- `components/`：页面与模块组件。
  - 页面级组件：`DestinationsPage.tsx`、`DestinationDetail.tsx`、`TourDetail.tsx`、`WishlistPage.tsx`、`ContactPage.tsx`
  - 首页模块：`Hero.tsx`、`WhyTrust.tsx`、`SurvivalKits.tsx`、`FeaturedTours.tsx`、`Testimonials.tsx`
  - 通用模块：`Header.tsx`、`Footer.tsx`、`FloatingContact.tsx`、`SmartFormModal.tsx`
- `constants.tsx`：目的地/路线/口碑/生存指南等静态数据。
- `translations.ts`：多语言文案（EN/DE/RU）。
- `types.ts`：类型定义与页面枚举。
- `functions/api/feishu.ts`：飞书 Webhook 转发的 Worker 入口（函数式目录）。
- `src/worker.ts`：Worker 逻辑（处理静态资源与 `/api/feishu`）。
- `wrangler.jsonc` / `vite.config.ts` / `tsconfig.json`：构建与部署配置。

## 网站页面说明

> 页面切换由 `App.tsx` 的 `Page` 状态控制，当前为单页应用（非 URL 路由）。

- 首页（Home）：品牌主视觉 + 信任理由 + 生存指南下载 + 精选路线 + 用户口碑。
- 目的地列表（Destinations）：展示全部目的地卡片，进入目的地详情。
- 目的地详情（Destination Detail）：城市介绍、必去景点、当地美食与侧边咨询入口。
- 路线列表（Tours）：全量路线集合与“定制路线”CTA。
- 路线详情（Tour Detail）：路线概览、行程日历、包含/不包含项与预约咨询。
- 心愿单（Wishlist）：收藏的路线/景点/美食汇总与一键咨询。
- 联系我们（Contact）：客服入口、管家团队与常见问题。

## 本地运行

**前置条件：** Node.js

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`

## 部署到 Cloudflare Workers（Deploy from Git）

在 Cloudflare Dashboard 中（“Create a Worker” -> “Connect to Git” 流程）：

- Build command：`npm run build`
- Deploy command：`npx wrangler deploy`

部署由 `wrangler.jsonc` 与 `src/worker.ts` 配置。

### 环境变量（Cloudflare -> Worker -> Settings -> Variables）

这些变量用于安全转发飞书表单提交，避免在浏览器中暴露 webhook URL：

- `FEISHU_WEBHOOK_URL`：飞书触发器 webhook URL
- `ALLOWED_ORIGINS`：允许的 Origin 列表（精确匹配，逗号分隔），例如：
  - `https://yourdomain.com,https://your-project.pages.dev,http://localhost:3000`

设置完成后需重新部署以生效。
