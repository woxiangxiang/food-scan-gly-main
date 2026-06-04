# 部署指南：Vercel + Render + Supabase

本项目推荐拆成三部分部署：

- 前端：Vercel
- 后端图像识别 API：Render
- 数据库、登录、Storage：Supabase

不要把 `DASHSCOPE_API_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY` 放到前端环境变量里。

## 1. 发布前准备

确认项目可以本地运行：

```bash
pnpm install
pnpm dev
pnpm dev:server
```

确认 Supabase SQL 已执行：

```text
supabase/migrations/001_create_glucose_entries.sql
supabase/migrations/002_create_food_items_and_storage.sql
supabase/migrations/003_create_recognition_history_and_suggestions.sql
```

在 Supabase SQL Editor 中执行的是文件内容，不是文件路径。

## 2. 上传食物图片到 Supabase Storage

本地 `.env` 需要包含：

```env
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase publishable/anon key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
```

运行：

```bash
pnpm upload:food-assets
```

这会把 `public/images` 上传到 Supabase Storage 的 `food-images` bucket，并把图片 URL 和食物信息写入 `food_items` 表。

`SUPABASE_SERVICE_ROLE_KEY` 只用于本地上传脚本，不要提交，不要放到 Vercel。

## 3. 部署后端到 Render

在 Render 创建一个 Web Service。

推荐配置：

```text
Runtime: Node
Build Command: npm install
Start Command: npm run start:server
```

如果页面里出现 Bun 相关选项，后端服务这里不要选 Bun，选择 Node。

不要使用 `corepack enable && pnpm install`。Render 的系统目录可能不允许 Corepack 改写 `/usr/bin/pnpm`，会导致 `EROFS: read-only file system`。

Render 后端环境变量：

```env
DASHSCOPE_API_KEY=你的 DashScope API Key
QWEN_VL_MODEL=qwen-vl-max
CORS_ORIGIN=https://你的 Vercel 前端域名
```

说明：

- `PORT` 不用手动配置，Render 会自动注入。
- `CORS_ORIGIN` 上线后必须改成 Vercel 的正式域名。
- 后端只负责 `/api/recognize` 图像识别，不托管前端页面。

部署完成后，打开：

```text
https://你的-render域名/api/health
```

应该看到：

```json
{"ok":true}
```

再打开：

```text
https://你的-render域名/api/debug/config
```

应该看到：

```json
{"ok":true,"hasDashScopeApiKey":true,"model":"qwen-vl-max"}
```

## 4. 部署前端到 Vercel

在 Vercel 导入这个仓库。

推荐配置：

```text
Framework Preset: Other
Install Command: npm install
Build Command: npm run build
Output Directory: 留空，不要填 dist
```

本项目是 TanStack Start，不是普通静态 Vite。仓库里的 `vercel.json` 会让构建生成 Vercel 需要的 `.vercel/output`，所以 Vercel 前端项目不要按 `dist` 静态目录发布。

Vercel 前端环境变量：

```env
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase publishable/anon key
VITE_API_BASE_URL=https://你的 Render 后端域名
```

不要在 Vercel 配置这些变量：

```env
DASHSCOPE_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

部署完成后，把 Vercel 域名复制出来，回到 Render 后端环境变量，把：

```env
CORS_ORIGIN=https://你的 Vercel 前端域名
```

改成真实值，然后重新部署或重启 Render 服务。

## 5. Supabase Auth 配置

在 Supabase Dashboard 中检查：

```text
Authentication -> URL Configuration
```

建议配置：

```text
Site URL: https://你的 Vercel 前端域名
```

如果你开启了邮箱确认，还需要在 Redirect URLs 中加入：

```text
https://你的 Vercel 前端域名/**
```

开发环境也可以保留：

```text
http://localhost:8081/**
http://localhost:5173/**
```

## 6. 上线后验收清单

按这个顺序测试：

1. 打开 Vercel 前端首页
2. 进入“我的”页面，注册或登录
3. 记录一条血糖数据，确认 Supabase `glucose_entries` 有新记录
4. 进入“食物”页面，确认图片来自 Supabase Storage
5. 回到“识别”页面上传食物图片
6. 确认后端识别成功
7. 如果识别结果匹配主库，确认图片自动出现在“食物”页顶部
8. 如果识别结果未匹配主库，点击“保存记录”，确认图片出现在“食物”页顶部
9. 点击“提交收录”，确认 `food_item_suggestions` 有 pending 记录

## 7. 常见问题

### 前端拍照识别报 CORS

检查 Render 的：

```env
CORS_ORIGIN
```

必须等于 Vercel 前端域名，例如：

```env
CORS_ORIGIN=https://food-scan-gly.vercel.app
```

改完后重启 Render 服务。

### 图像识别失败

检查 Render：

```text
/api/debug/config
```

`hasDashScopeApiKey` 必须是 `true`。

如果仍失败，看 Render Logs 中的：

```text
Qwen-VL recognition failed
```

### Supabase 登录失败

检查 Vercel 是否配置：

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

变量名必须以 `VITE_` 开头，前端才能读取。

### 食物页没有显示 Supabase 图片

确认已经执行：

```bash
pnpm upload:food-assets
```

并确认 Supabase 中存在：

```text
Storage bucket: food-images
Table: food_items
```

### 我的识别图片没有置顶

确认已经执行最新版本的：

```text
supabase/migrations/003_create_recognition_history_and_suggestions.sql
```

它会创建私有 bucket：

```text
user-food-images
```

并给 `food_recognitions` 增加图片字段。
