# 部署说明（Ubuntu + Docker）

本目录提供一套最小可落地的部署方式：
- Nginx：同域名托管前端静态资源，并将 `/api/*` 反向代理到 Fastify
- Fastify：只读查询 API（`/api/v1/...`）
- PostgreSQL：存储目的地/景点/餐厅/美食/酒店数据
- TLS：Let’s Encrypt（使用 `certbot` 容器 + webroot 方式签发/续期）

## 目录结构

- `deploy/docker-compose.yml`：编排 nginx/api/db/certbot
- `deploy/nginx/conf.d/site.conf`：站点配置（静态托管 + `/api` 反代 + SPA 回退）
- `deploy/db/schema.sql`：初始化建表（首次创建 volume 时执行）
- `deploy/scripts/*.sh`：部署脚本（初始化 TLS、启动、续期）

## 首次部署（推荐流程）

1) 服务器准备
- 安装 Docker + Docker Compose plugin（`docker compose`）
- 打开防火墙端口：80/443

2) 上传/拉取代码到服务器，例如：
- `git clone ... /opt/lyriktrip`

3) 配置环境变量
- 复制 `deploy/.env.example` 为 `deploy/.env`
- 修改 `DOMAIN/LETSENCRYPT_EMAIL/POSTGRES_PASSWORD` 等

4) 生成前端构建产物
在仓库根目录执行：
- `npm ci`
- `npm run build`

5) 启动 HTTP（80）以便签发证书
在 `deploy/` 目录执行：
- `docker compose --env-file .env up -d --build db api nginx`

6) 签发 Let’s Encrypt 证书
在 `deploy/` 目录执行：
- `./scripts/init_tls.sh`

7) 证书签发成功后脚本会自动重启 Nginx，使 HTTPS 生效

8) 初始化数据（可选，等你准备好 data JSON 后）
- `docker compose --env-file .env run --rm api node scripts/seed.js`

## CSV 导入说明（你当前的表头为中文）

`api/scripts/seed.js` 支持优先读取 `data/*.csv`（不存在则回退 `data/*.json`）。

你目前只有：
- `data/attractions.csv`（景点表，含 省/市/区）
- `data/restaurants.csv`（餐厅表）
- `data/foods.csv`（美食表）

导入时会从景点表的「省/市」自动生成 `destinations`；餐厅/美食会优先通过「附近景点」匹配到对应目的地。

## 注意：schema 变更与 pgdata volume

`deploy/db/schema.sql` 只在首次初始化 Postgres volume 时生效。
如果你已经在服务器上创建过 `pgdata` 并且更新了 schema（例如新增经纬度/必吃指数字段），需要执行迁移或删除 volume 重新初始化：

- 删除并重建（会丢数据）：`docker volume rm <项目名>_pgdata`


## 日常更新

- 更新代码后重新构建前端：`npm ci && npm run build`
- 更新后端：`docker compose --env-file .env up -d --build api nginx`

## 续期证书

Let’s Encrypt 证书通常 90 天有效。建议使用 cron 每天跑一次：
- `cd /opt/lyriktrip/deploy && ./scripts/renew_tls.sh`
