# 数据文件说明（用于导入 PostgreSQL）

本项目采用“只读展示”为主，不做管理后台；因此推荐用 CSV/JSON 文件做离线导入。

## 文件清单（支持 CSV 或 JSON）

优先读取同名的 `.csv`，不存在时回退到 `.json`。

- `data/destinations.csv` / `data/destinations.json`：目的地列表
- `data/attractions.csv` / `data/attractions.json`：景点列表（每条包含 destinationId）
- `data/foods.csv` / `data/foods.json`：美食列表（每条包含 destinationId）
- `data/restaurants.csv` / `data/restaurants.json`：餐厅列表（每条包含 destinationId）
- `data/hotels.csv` / `data/hotels.json`：酒店列表（每条包含 destinationId）

## CSV 约定（默认规则）

- 编码：UTF-8（可带 BOM）
- 第一行：表头（header），字段名区分大小写
- 分隔符：逗号（`,`），支持双引号转义
- 数组字段：用 `|` 连接，例如 `tags`：`宫廷菜|驰名中外`
- 空字符串表示 NULL
- `amenities`（酒店）如需使用，建议单元格内放 JSON 字符串

## 你当前已有的 3 张 CSV 表

如果你当前只有这三张表，也可以先导入并运行站点：
- `data/attractions.csv`（景点表）
- `data/restaurants.csv`（餐厅表）
- `data/foods.csv`（美食表）

`destinations` 会在导入时从景点表的「市」自动生成；餐厅/美食会优先通过「附近景点」匹配到对应目的地。

## 导入方式

在 `deploy/` 目录执行（容器内运行导入脚本）：

`docker compose --env-file .env run --rm api node scripts/seed.js`

注意：`deploy/db/schema.sql` 只会在 **首次创建 pgdata volume** 时执行。如果你改了 schema，需要自行迁移或删除 volume 重新初始化（会丢数据）。
