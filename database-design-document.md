# 旅行线路行程规划系统 - 数据结构设计文档

## 一、数据库设计概述

### 1.1 设计理念

本数据库设计采用**规范化设计**原则,将旅行线路数据分为以下几个核心部分:

- **主表设计**: routes表存储线路基本信息
- **天数表设计**: route_days表存储每天的行程概览
- **节点表设计**: route_nodes表作为核心,统一管理所有节点
- **详情表设计**: 根据节点类型(交通/景点/餐厅)分别存储详细信息

### 1.2 设计优势

✅ **扩展性强**: 新增节点类型只需添加对应的详情表
✅ **查询高效**: 通过外键关联,支持灵活的多表联查
✅ **数据规范**: 避免冗余,保证数据一致性
✅ **维护简单**: 各类型数据独立存储,便于管理和更新

---

## 二、完整数据表结构

### 2.1 routes (线路主表)

**用途**: 存储旅行线路的基本信息和整体描述

```sql
CREATE TABLE routes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '线路ID',
    route_name VARCHAR(200) NOT NULL COMMENT '线路名称',
    route_alias VARCHAR(200) COMMENT '线路别名/副标题',
    price DECIMAL(10,2) COMMENT '价格',
    price_unit VARCHAR(20) DEFAULT '元/人起' COMMENT '价格单位',
    recommendation TEXT COMMENT '推荐理由',
    introduction TEXT COMMENT '行程简介',
    highlights JSON COMMENT '核心亮点(数组)',
    cover_images JSON COMMENT '行程封面图片(数组)',
    route_overview TEXT COMMENT '行程路线概览',
    service_content TEXT COMMENT '服务内容说明',
    total_days INT NOT NULL DEFAULT 1 COMMENT '总天数',
    status TINYINT DEFAULT 1 COMMENT '状态:1-上架,0-下架',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_total_days (total_days)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='旅行线路主表';
```

**字段说明**:
- `highlights`: JSON格式,存储字符串数组,如: `["亮点1", "亮点2", "亮点3"]`
- `cover_images`: JSON格式,存储图片URL数组

---

### 2.2 route_days (行程天数表)

**用途**: 存储每天的行程概览信息

```sql
CREATE TABLE route_days (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '行程天ID',
    route_id INT NOT NULL COMMENT '关联的线路ID',
    day_number INT NOT NULL COMMENT '第几天',
    day_title VARCHAR(200) COMMENT '当天标题(如:海派起源·外滩夜色)',
    day_subtitle VARCHAR(500) COMMENT '当天副标题(如:豫园->外滩->黄浦江游船)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_route_day (route_id, day_number),
    INDEX idx_route_id (route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程天数表';
```

**关键约束**:
- `UNIQUE KEY (route_id, day_number)`: 确保同一线路不会有重复的天数

---

### 2.3 route_nodes (行程节点表) ⭐核心表

**用途**: 统一管理所有类型的行程节点

```sql
CREATE TABLE route_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '节点ID',
    day_id INT NOT NULL COMMENT '关联的行程天ID',
    node_order INT NOT NULL COMMENT '节点顺序(同一天内的排序)',
    node_type ENUM('transport', 'attraction', 'restaurant') NOT NULL COMMENT '节点类型',
    start_time TIME COMMENT '开始时间',
    duration_minutes INT COMMENT '耗时(分钟)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (day_id) REFERENCES route_days(id) ON DELETE CASCADE,
    INDEX idx_day_id (day_id),
    INDEX idx_node_type (node_type),
    INDEX idx_node_order (day_id, node_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程节点表';
```

**设计要点**:
- `node_type`: 使用ENUM类型,限定只能是三种类型之一
- `node_order`: 用于同一天内的节点排序
- `start_time` + `duration_minutes`: 精确控制时间安排

---

### 2.4 transport_nodes (交通节点详情表)

**用途**: 存储交通节点的详细信息

```sql
CREATE TABLE transport_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '交通节点ID',
    node_id INT NOT NULL COMMENT '关联的节点ID',
    from_location VARCHAR(200) NOT NULL COMMENT '出发地点',
    to_location VARCHAR(200) NOT NULL COMMENT '目的地点',
    transport_method VARCHAR(50) NOT NULL COMMENT '交通方式(如:包车/地铁/步行/公交)',
    route_detail TEXT COMMENT '路线详情(具体的路线说明)',
    cost DECIMAL(10,2) DEFAULT 0 COMMENT '费用(元)',
    notes TEXT COMMENT '注意事项或补充说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (node_id) REFERENCES route_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_id (node_id),
    INDEX idx_transport_method (transport_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交通节点详情表';
```

**字段示例**:
```
from_location: "铂金万澳酒店"
to_location: "豫园"
transport_method: "地铁"
route_detail: "地铁2号线(往浦东国际机场方向)→1站→南京东路站\n站内换乘地铁10号线(往虹桥火车站方向)→1站→豫园站"
cost: 3.00
```

---

### 2.5 attraction_nodes (景点节点详情表)

**用途**: 存储景点节点的详细信息

```sql
CREATE TABLE attraction_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '景点节点ID',
    node_id INT NOT NULL COMMENT '关联的节点ID',
    name VARCHAR(200) NOT NULL COMMENT '景点名称',
    address VARCHAR(500) COMMENT '详细地址',
    opening_hours VARCHAR(200) COMMENT '开放时间',
    ticket_price VARCHAR(200) COMMENT '门票价格',
    suggested_duration VARCHAR(100) COMMENT '建议游览时间',
    description TEXT COMMENT '景点介绍',
    highlights JSON COMMENT '游览要点(数组,每个要点包含title和content)',
    images JSON COMMENT '景点图片(URL数组)',
    best_season VARCHAR(100) COMMENT '最佳游览季节',
    latitude DECIMAL(10,8) COMMENT '纬度',
    longitude DECIMAL(11,8) COMMENT '经度',
    notes TEXT COMMENT '其他注意事项',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (node_id) REFERENCES route_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_id (node_id),
    INDEX idx_name (name),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点节点详情表';
```

**JSON字段格式**:

```json
// highlights字段示例
[
  {
    "title": "🏔️ 大假山",
    "content": "位于园内北部,是江南地区现存最古老、最精美、最大的黄石假山..."
  },
  {
    "title": "🏛️ 万花楼",
    "content": "豫园的主体建筑之一,是观赏园林全景的最佳位置..."
  }
]

// images字段示例
[
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg",
  "https://example.com/image3.jpg"
]
```

---

### 2.6 restaurant_nodes (餐厅节点详情表)

**用途**: 存储餐厅节点的详细信息

```sql
CREATE TABLE restaurant_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '餐厅节点ID',
    node_id INT NOT NULL COMMENT '关联的节点ID',
    name VARCHAR(200) NOT NULL COMMENT '餐厅名称',
    address VARCHAR(500) COMMENT '详细地址',
    avg_cost DECIMAL(10,2) COMMENT '人均消费(元)',
    must_eat_rating INT DEFAULT 3 COMMENT '必吃指数(1-5星)',
    queue_status VARCHAR(200) COMMENT '排队情况描述',
    phone VARCHAR(50) COMMENT '联系电话',
    business_hours VARCHAR(200) COMMENT '营业时间',
    background TEXT COMMENT '餐厅背景介绍',
    recommended_dishes JSON COMMENT '推荐菜品(数组,每个菜品包含name/description/image)',
    images JSON COMMENT '餐厅图片(URL数组)',
    latitude DECIMAL(10,8) COMMENT '纬度',
    longitude DECIMAL(11,8) COMMENT '经度',
    notes TEXT COMMENT '其他注意事项',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (node_id) REFERENCES route_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_id (node_id),
    INDEX idx_name (name),
    INDEX idx_avg_cost (avg_cost),
    INDEX idx_rating (must_eat_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='餐厅节点详情表';
```

**JSON字段格式**:

```json
// recommended_dishes字段示例
[
  {
    "name": "🦀 蟹粉小笼包",
    "description": "这是南翔馒头店的招牌中的招牌,只在蟹季(每年9月至次年1月)供应...",
    "image": "https://example.com/dish1.jpg",
    "price": "58元/笼"
  },
  {
    "name": "🥟 鲜肉小笼包",
    "description": "这是南翔小笼的经典款,也是最能体现师傅功力的基础款...",
    "image": "https://example.com/dish2.jpg",
    "price": "28元/笼"
  }
]
```

---

## 三、示例数据插入

### 3.1 插入线路主表数据

```sql
INSERT INTO routes (
    route_name, 
    route_alias, 
    price, 
    price_unit,
    recommendation,
    introduction,
    highlights,
    total_days
) VALUES (
    '上海都市观光美食之旅',
    '5天上海一地豫园-外滩-朱家角-石库门-陆家嘴-东方明珠',
    999.00,
    '美金/人起',
    '这个行程适合初次到访上海的国际友人,既能了解上海的摩登,又能深入上海本地生活进行深度体验。整体行程步行量比较大,适合成人。',
    '本项目旨在为入住"上海南京东路铂金万澳酒店"的游客提供一份极致精准、百科式的 5 天 4 晚数字导览手册...',
    JSON_ARRAY(
        '物理闭环:所有动线均以铂金万澳酒店为始发点和终到点',
        '时段全覆盖:行程从早 10:00 延伸至晚 21:00 左右',
        '高精度导览:精确到具体地铁站口、步行距离、上车点与下车点',
        '百科式体验:提供景点历史、餐厅背景及招牌菜品的感官描述',
        '夜景保障:每日安排夜景观赏时段,充分体验上海璀璨夜色'
    ),
    5
);
```

### 3.2 插入行程天数数据

```sql
-- 假设routes表中刚插入的记录ID为1
INSERT INTO route_days (route_id, day_number, day_title, day_subtitle)
VALUES (1, 1, '海派起源·外滩夜色', '豫园->外滩->黄浦江游船');
```

### 3.3 插入节点和详情数据

```sql
-- 1. 插入交通节点
INSERT INTO route_nodes (day_id, node_order, node_type, start_time, duration_minutes)
VALUES (1, 1, 'transport', '10:00:00', 15);

INSERT INTO transport_nodes (node_id, from_location, to_location, transport_method, route_detail, cost)
VALUES (
    LAST_INSERT_ID(),
    '铂金万澳酒店',
    '豫园',
    '地铁',
    '地铁2号线(往浦东国际机场方向)→1站→南京东路站\n站内换乘地铁10号线(往虹桥火车站方向)→1站→豫园站',
    3.00
);

-- 2. 插入景点节点
INSERT INTO route_nodes (day_id, node_order, node_type, start_time, duration_minutes)
VALUES (1, 2, 'attraction', '10:15:00', 165);

INSERT INTO attraction_nodes (
    node_id, 
    name, 
    address, 
    opening_hours, 
    ticket_price,
    suggested_duration,
    description,
    highlights,
    images,
    latitude,
    longitude
) VALUES (
    LAST_INSERT_ID(),
    '豫园老城厢',
    '上海市黄浦区安仁街132号',
    '09:00-17:30(17:00停止入园)',
    '旺季40元/人,淡季30元/人',
    '2-3小时',
    '豫园位于上海老城厢东北部,是江南古典园林的杰出代表,始建于明代嘉靖、万历年间(1559年)...',
    JSON_ARRAY(
        JSON_OBJECT('title', '🏔️ 大假山', 'content', '位于园内北部,是江南地区现存最古老、最精美、最大的黄石假山...'),
        JSON_OBJECT('title', '🏛️ 万花楼', 'content', '豫园的主体建筑之一,是观赏园林全景的最佳位置...'),
        JSON_OBJECT('title', '💎 玉玲珑', 'content', '被誉为"江南三大名石"之一,是豫园的镇园之宝...')
    ),
    JSON_ARRAY(
        'https://example.com/yuyuan1.jpg',
        'https://example.com/yuyuan2.jpg'
    ),
    31.2276,
    121.4922
);

-- 3. 插入餐厅节点
INSERT INTO route_nodes (day_id, node_order, node_type, start_time, duration_minutes)
VALUES (1, 3, 'restaurant', '13:00:00', 60);

INSERT INTO restaurant_nodes (
    node_id,
    name,
    address,
    avg_cost,
    must_eat_rating,
    queue_status,
    phone,
    business_hours,
    background,
    recommended_dishes,
    images,
    latitude,
    longitude
) VALUES (
    LAST_INSERT_ID(),
    '南翔馒头店',
    '上海市黄浦区豫园路87号(豫园商城内)',
    88.00,
    5,
    '高峰期等待1小时+',
    '021-23029826',
    '全天营业',
    '南翔馒头店创始于1900年,由上海嘉定南翔镇的点心师傅吴翔升创立,至今已有120多年历史...',
    JSON_ARRAY(
        JSON_OBJECT(
            'name', '🦀 蟹粉小笼包',
            'description', '这是南翔馒头店的招牌中的招牌,只在蟹季供应...',
            'image', 'https://example.com/crab-xiaolongbao.jpg',
            'price', '58元/笼'
        ),
        JSON_OBJECT(
            'name', '🥟 鲜肉小笼包',
            'description', '这是南翔小笼的经典款...',
            'image', 'https://example.com/pork-xiaolongbao.jpg',
            'price', '28元/笼'
        )
    ),
    JSON_ARRAY('https://example.com/nanxiang1.jpg'),
    31.2280,
    121.4925
);
```

---

## 四、常用查询SQL示例

### 4.1 查询完整的线路信息

```sql
SELECT 
    r.*,
    COUNT(DISTINCT rd.id) as total_days_count,
    COUNT(rn.id) as total_nodes_count
FROM routes r
LEFT JOIN route_days rd ON r.id = rd.route_id
LEFT JOIN route_nodes rn ON rd.id = rn.day_id
WHERE r.id = 1
GROUP BY r.id;
```

### 4.2 查询某一天的完整行程

```sql
SELECT 
    rd.day_number,
    rd.day_title,
    rd.day_subtitle,
    rn.id as node_id,
    rn.node_order,
    rn.node_type,
    rn.start_time,
    rn.duration_minutes,
    CASE 
        WHEN rn.node_type = 'transport' THEN tn.from_location
        WHEN rn.node_type = 'attraction' THEN an.name
        WHEN rn.node_type = 'restaurant' THEN rtn.name
    END as node_name
FROM route_days rd
INNER JOIN route_nodes rn ON rd.id = rn.day_id
LEFT JOIN transport_nodes tn ON rn.id = tn.node_id
LEFT JOIN attraction_nodes an ON rn.id = an.node_id
LEFT JOIN restaurant_nodes rtn ON rn.id = rtn.node_id
WHERE rd.route_id = 1 AND rd.day_number = 1
ORDER BY rn.node_order;
```

### 4.3 查询景点节点的完整信息

```sql
SELECT 
    rn.*,
    an.*
FROM route_nodes rn
INNER JOIN attraction_nodes an ON rn.id = an.node_id
WHERE rn.id = 2;
```

### 4.4 查询餐厅节点的完整信息

```sql
SELECT 
    rn.*,
    rtn.*
FROM route_nodes rn
INNER JOIN restaurant_nodes rtn ON rn.id = rtn.node_id
WHERE rn.id = 3;
```

### 4.5 查询某个线路的所有餐厅

```sql
SELECT 
    rd.day_number,
    rn.start_time,
    rtn.name,
    rtn.avg_cost,
    rtn.must_eat_rating,
    rtn.phone
FROM routes r
INNER JOIN route_days rd ON r.id = rd.route_id
INNER JOIN route_nodes rn ON rd.id = rn.day_id
INNER JOIN restaurant_nodes rtn ON rn.id = rtn.node_id
WHERE r.id = 1 AND rn.node_type = 'restaurant'
ORDER BY rd.day_number, rn.node_order;
```

---

## 五、数据结构优化建议

### 5.1 索引优化

已在表结构中添加的关键索引:
- `routes`: status, total_days
- `route_days`: route_id, (route_id, day_number)联合唯一索引
- `route_nodes`: day_id, node_type, (day_id, node_order)联合索引
- `attraction_nodes`: name, (latitude, longitude)空间索引
- `restaurant_nodes`: name, avg_cost, must_eat_rating

### 5.2 缓存策略

建议对以下数据进行缓存:
- 热门线路的完整信息(Redis Hash)
- 每天的行程节点列表(Redis List)
- 景点和餐厅的详细信息(Redis String/Hash)

### 5.3 扩展建议

**可扩展的功能**:
1. 添加用户评价表: `route_reviews`
2. 添加订单表: `route_orders`
3. 添加收藏表: `route_favorites`
4. 添加节点图片表: 独立存储,支持多图管理
5. 添加价格日历表: 支持动态定价

**新增节点类型**:
如需添加新的节点类型(如酒店、购物等),只需:
1. 在`route_nodes.node_type`的ENUM中添加新类型
2. 创建对应的详情表(如`hotel_nodes`)
3. 遵循相同的外键关联结构

---

## 六、API接口设计建议

### 6.1 获取线路列表

```
GET /api/routes?page=1&limit=10&status=1
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "list": [
      {
        "id": 1,
        "route_name": "上海都市观光美食之旅",
        "route_alias": "5天上海一地...",
        "price": 999.00,
        "price_unit": "美金/人起",
        "cover_images": ["url1", "url2"],
        "total_days": 5
      }
    ]
  }
}
```

### 6.2 获取线路详情

```
GET /api/routes/{id}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "route_name": "上海都市观光美食之旅",
    "route_alias": "5天上海一地...",
    "price": 999.00,
    "recommendation": "...",
    "highlights": ["亮点1", "亮点2"],
    "total_days": 5,
    "days": [
      {
        "day_number": 1,
        "day_title": "海派起源·外滩夜色",
        "day_subtitle": "豫园->外滩->黄浦江游船",
        "nodes": [...]
      }
    ]
  }
}
```

### 6.3 获取某天的行程

```
GET /api/routes/{id}/days/{day_number}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "day_number": 1,
    "day_title": "海派起源·外滩夜色",
    "nodes": [
      {
        "node_id": 1,
        "node_type": "transport",
        "start_time": "10:00",
        "duration_minutes": 15,
        "details": {
          "from_location": "铂金万澳酒店",
          "to_location": "豫园",
          "transport_method": "地铁",
          "route_detail": "...",
          "cost": 3.00
        }
      },
      {
        "node_id": 2,
        "node_type": "attraction",
        "start_time": "10:15",
        "duration_minutes": 165,
        "details": {
          "name": "豫园老城厢",
          "address": "...",
          "highlights": [...],
          "images": [...]
        }
      }
    ]
  }
}
```

---

## 七、总结

### 7.1 数据结构特点

✅ **模块化设计**: 每种节点类型独立存储,便于管理
✅ **高度灵活**: 支持任意数量的天数和节点
✅ **易于扩展**: 新增节点类型只需添加详情表
✅ **查询高效**: 合理的索引和外键设计
✅ **数据完整**: 涵盖了旅行规划的所有必要信息

### 7.2 适用场景

- 旅行社线路管理系统
- 旅游平台行程规划功能
- 导游APP行程安排
- 定制旅游服务系统

### 7.3 技术栈建议

**后端**: 
- Node.js + Express + Sequelize ORM
- Java + Spring Boot + MyBatis
- Python + Django + Django ORM

**前端**:
- React + Tailwind CSS (已提供示例组件)
- Vue.js + Element UI
- 微信小程序

**数据库**: MySQL 5.7+ 或 MariaDB 10.3+

---

**文档版本**: v1.0
**最后更新**: 2025-02-10
**作者**: Claude AI Assistant