
import { Tour, SurvivalKit, ServiceTier, Testimonial, Destination } from './types';

const getUnsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=1200`;

export const DESTINATIONS: Destination[] = [
  {
    id: 'bj',
    name: 'Beijing',
    description: 'The political and cultural heart of China, home to the Forbidden City and Great Wall.',
    longDescription: 'Beijing, China’s sprawling capital, has history stretching back 3 millennia. Yet it’s known as much for modern architecture as its ancient sites such as the grand Forbidden City complex, the imperial palace during the Ming and Qing dynasties.',
    attractions: [
      { id: 'attr-bj-1', name: '故宫博物院', tags: ['世界文化遗产', '皇家宫殿'], rating: 4.9, reason: '中国明清两代的皇家宫殿，世界五大宫之首。', image: getUnsplash('1540914124281-342587941389') },
      { id: 'attr-bj-2', name: '八达岭长城', tags: ['世界七大奇迹', '历史地标'], rating: 4.8, reason: '长城最具代表性的地段，气势磅礴。', image: getUnsplash('1508804185872-d7badad00f7d') },
      { id: 'attr-bj-3', name: '天坛公园', tags: ['祭天建筑', '历史遗迹'], rating: 4.7, reason: '明清两代皇帝祭天、祈谷的场所，建筑结构独特。', image: getUnsplash('1529921879218-f99546d03a9d') },
      { id: 'attr-bj-4', name: '颐和园', tags: ['皇家园林', '建筑艺术'], rating: 4.8, reason: '保存最完整的皇家行宫御苑，被誉为“皇家园林博物馆”。', image: getUnsplash('1599571028712-4299b8602994') },
      { id: 'attr-bj-5', name: '恭王府', tags: ['清代王府', '历史见证'], rating: 4.6, reason: '“一座恭王府，半部清代史”，园林设计精巧。', image: getUnsplash('1576483582455-f2d110191834') },
      { id: 'attr-bj-6', name: '圆明园', tags: ['万园之园', '历史沧桑'], rating: 4.5, reason: '虽为遗址，但仍能感受到昔日皇家园林的辉煌。', image: getUnsplash('1627931641609-b6b8014f3586') },
      { id: 'attr-bj-7', name: '雍和宫', tags: ['藏传佛教', '皇家寺庙'], rating: 4.7, reason: '北京规格最高的佛教寺院，香火极旺。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'attr-bj-8', name: '中国国家博物馆', tags: ['文化艺术', '历史宝库'], rating: 4.8, reason: '藏品极其丰富，展现中华文明五千年历史。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'attr-bj-9', name: '景山公园', tags: ['俯瞰故宫', '皇家园林'], rating: 4.6, reason: '位于北京城中轴线，是俯瞰故宫全景的最佳地点。', image: getUnsplash('1520236060906-9c5ed525b025') },
      { id: 'attr-bj-10', name: '什刹海', tags: ['老北京风情', '胡同文化'], rating: 4.5, reason: '感受老北京胡同文化和夜生活的绝佳去处。', image: getUnsplash('1533038590840-1cde6e668a91') }
    ],
    famousFoods: [
      { id: 'food-bj-1', name: '北京烤鸭', tags: ['宫廷菜', '驰名中外'], priceRange: '￥200', reviews: 4500, reason: '鸭皮酥脆，肉质鲜嫩，是北京最著名的美食名片。', image: getUnsplash('1581339399838-2a120c18bba3') },
      { id: 'food-bj-2', name: '老北京炸酱面', tags: ['地道小吃', '筋道爽口'], priceRange: '￥40', reviews: 2100, reason: '酱香浓郁，配菜丰富，是老北京人的心头好。', image: getUnsplash('1612929633738-8fe44f7ec841') },
      { id: 'food-bj-3', name: '铜锅涮肉', tags: ['传统火锅', '羊肉鲜美'], priceRange: '￥120', reviews: 1800, reason: '炭火铜锅，清汤涮肉，蘸上麻酱，地道北京味。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'food-bj-4', name: '驴打滚', tags: ['传统甜点', '糯米豆沙'], priceRange: '￥20', reviews: 1200, reason: '豆香浓郁，口感软糯，是北京传统的特色小吃。', image: getUnsplash('1520236060906-9c5ed525b025') },
      { id: 'food-bj-5', name: '爆肚', tags: ['脆嫩爽口', '蘸酱绝配'], priceRange: '￥50', reviews: 900, reason: '鲜牛肚快速汆烫，口感脆嫩，搭配特制麻酱。', image: getUnsplash('1557804506-669a67965ba0') },
      { id: 'food-bj-6', name: '炒肝儿', tags: ['浓郁咸鲜', '传统早餐'], priceRange: '￥15', reviews: 1500, reason: '以猪肝和肥肠为主料，汤汁浓稠，蒜香扑鼻。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'food-bj-7', name: '豆汁儿焦圈', tags: ['独特风味', '挑战味蕾'], priceRange: '￥10', reviews: 600, reason: '老北京人的最爱，味道酸甜独特，搭配焦圈极佳。', image: getUnsplash('1523315254130-1869e54911d3') },
      { id: 'food-bj-8', name: '豌豆黄', tags: ['宫廷小吃', '清甜细腻'], priceRange: '￥25', reviews: 1100, reason: '色泽浅黄，味道清甜，入口即化，曾是慈禧最爱。', image: getUnsplash('1508804185872-d7badad00f7d') },
      { id: 'food-bj-9', name: '炙子烤肉', tags: ['炭火香气', '豪迈吃法'], priceRange: '￥100', reviews: 1300, reason: '铁板炙烤，肉香四溢，感受老北京的豪爽。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'food-bj-10', name: '小吊梨汤', tags: ['清润甘甜', '养生饮品'], priceRange: '￥30', reviews: 2000, reason: '梨香浓郁，汤汁浓稠，是北京秋冬季节的润肺佳品。', image: getUnsplash('1599571028712-4299b8602994') }
    ],
    image: getUnsplash('1508804185872-d7badad00f7d'),
    tourCount: 12
  },
  {
    id: 'sh',
    name: 'Shanghai',
    description: 'A global financial hub where futuristic skyscrapers meet colonial-era architecture.',
    longDescription: 'Shanghai, on China’s central coast, is the country\'s biggest city and a global financial hub. Its heart is the Bund, a famed waterfront promenade lined with colonial-era buildings.',
    attractions: [
      { id: 'attr-sh-1', name: '外滩', tags: ['万国建筑', '夜景必打卡'], rating: 4.8, reason: '感受上海摩登与历史交织的最佳地点。', image: getUnsplash('1474181487882-5abf3f0ba6c2') },
      { id: 'attr-sh-2', name: '东方明珠', tags: ['城市地标', '俯瞰上海'], rating: 4.6, reason: '上海的标志性建筑，可全方位俯瞰浦江两岸美景。', image: getUnsplash('1506158669146-619067262a00') },
      { id: 'attr-sh-3', name: '豫园', tags: ['江南园林', '古镇风情'], rating: 4.5, reason: '典型的江南古典园林，紧邻城隍庙。', image: getUnsplash('1546872006-42d76634f183') },
      { id: 'attr-sh-4', name: '上海迪士尼乐园', tags: ['主题乐园', '亲子游'], rating: 4.7, reason: '中国内地首座迪士尼乐园，充满魔幻与欢乐。', image: getUnsplash('1533230393619-bcad81548223') },
      { id: 'attr-sh-5', name: '陆家嘴三件套', tags: ['摩天大楼', '现代建筑'], rating: 4.8, reason: '上海中心、环球金融中心、金茂大厦，感受云端震撼。', image: getUnsplash('1548560786-bc0f68202493') },
      { id: 'attr-sh-6', name: '武康路', tags: ['网红打卡', '老洋房'], rating: 4.6, reason: '浓缩了上海近代百年历史，法租界风情浓郁。', image: getUnsplash('1629813291583-e18776ca1c42') },
      { id: 'attr-sh-7', name: '田子坊', tags: ['艺术街区', '石库门'], rating: 4.4, reason: '由上海特有的石库门建筑群改建，充满文艺气息。', image: getUnsplash('1526053881640-756195537637') },
      { id: 'attr-sh-8', name: '上海博物馆', tags: ['古代艺术', '历史文化'], rating: 4.7, reason: '藏品丰富，尤其是青铜器和陶瓷器享誉外。', image: getUnsplash('1596464716127-f2a82984de30') },
      { id: 'attr-sh-9', name: '南京路步行街', tags: ['购物天堂', '繁华商业'], rating: 4.5, reason: '中华商业第一街，感受上海的繁华与活力。', image: getUnsplash('1538330621152-4f18ac1fd07d') },
      { id: 'attr-sh-10', name: '上海中心大厦', tags: ['世界第二高楼', '云端体验'], rating: 4.8, reason: '拥有世界最高的观光厅，体验“上海之巅”。', image: getUnsplash('1523450001312-faa4e2e31f0f') }
    ],
    famousFoods: [
      { id: 'food-sh-1', name: '南翔小笼包', tags: ['非遗美食', '皮薄汁多'], priceRange: '￥50', reviews: 3200, reason: '皮薄、馅丰、汁多，是上海点心的代表。', image: getUnsplash('1625220194771-7ebdea0b70b9') },
      { id: 'food-sh-2', name: '生煎馒头', tags: ['底部酥脆', '肉香浓郁'], priceRange: '￥20', reviews: 2500, reason: '底部金黄酥脆，肉馅鲜嫩多汁，上海人的早餐首选。', image: getUnsplash('1623341214825-9f4f963727da') },
      { id: 'food-sh-3', name: '排骨年糕', tags: ['甜咸适口', '软糯酥脆'], priceRange: '￥25', reviews: 1800, reason: '排骨色泽金黄，年糕软糯，搭配特制酱汁。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'food-sh-4', name: '葱油拌面', tags: ['葱香四溢', '简单美味'], priceRange: '￥15', reviews: 2200, reason: '葱油熬制得恰到好处，面条筋道，上海家常味。', image: getUnsplash('1520236060906-9c5ed525b025') },
      { id: 'food-sh-5', name: '大闸蟹', tags: ['时令美食', '鲜美无比'], priceRange: '￥150', reviews: 1400, reason: '阳澄湖大闸蟹最为出名，膏满黄肥，秋季必吃。', image: getUnsplash('1523450001312-faa4e2e31f0f') },
      { id: 'food-sh-6', name: '红烧肉', tags: ['浓油赤酱', '肥而不腻'], priceRange: '￥80', reviews: 1900, reason: '上海本帮菜的代表，色泽红亮，味道甜咸适中。', image: getUnsplash('1597843477146-72479768bada') },
      { id: 'food-sh-7', name: '腌笃鲜', tags: ['汤鲜味美', '春季时令'], priceRange: '￥60', reviews: 1100, reason: '咸肉、鲜肉和春笋慢火炖制，汤汁浓白鲜美。', image: getUnsplash('1523315254130-1869e54911d3') },
      { id: 'food-sh-8', name: '上海熏鱼', tags: ['酥脆香甜', '本帮冷菜'], priceRange: '￥40', reviews: 900, reason: '鱼肉炸至酥脆，浸入甜咸酱汁，口感丰富。', image: getUnsplash('1508804185872-d7badad00f7d') },
      { id: 'food-sh-9', name: '白斩鸡', tags: ['皮爽肉滑', '原汁原味'], priceRange: '￥50', reviews: 1300, reason: '选用三黄鸡，皮黄肉白，蘸上特制姜蓉酱油。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'food-sh-10', name: '桂花酒酿圆子', tags: ['甜香软糯', '传统甜品'], priceRange: '￥15', reviews: 1600, reason: '桂花清香，酒酿微甜，圆子软糯，餐后佳品。', image: getUnsplash('1599571028712-4299b8602994') }
    ],
    image: getUnsplash('1474181487882-5abf3f0ba6c2'),
    tourCount: 8
  },
  {
    id: 'xa',
    name: 'Xi\'an',
    description: 'Ancient capital of 13 dynasties and the starting point of the Silk Road.',
    longDescription: 'Xi’an is the capital of Shaanxi Province, central China. Once known as Chang’an (Eternal Peace), it marks the Silk Road’s eastern end.',
    attractions: [
      { id: 'attr-xa-1', name: '秦始皇兵马俑', tags: ['世界奇迹', '历史震撼'], rating: 4.9, reason: '规模宏大，气势磅礴，中国古代军事的缩影。', image: getUnsplash('1582234033100-843477146522') },
      { id: 'attr-xa-2', name: '西安古城墙', tags: ['完整防御', '骑行体验'], rating: 4.7, reason: '中国现存规模最大、保存最完整的古代城垣。', image: getUnsplash('1599577310318-668589d70a92') },
      { id: 'attr-xa-3', name: '大雁塔', tags: ['唐代建筑', '玄奘译经'], rating: 4.6, reason: '西安的标志性建筑，唐代佛教文化的见证。', image: getUnsplash('1563245332-692739e746e7') },
      { id: 'attr-xa-4', name: '大唐不夜城', tags: ['盛唐风采', '璀璨夜景'], rating: 4.8, reason: '沉浸式体验盛唐文化，夜景灯火辉煌。', image: getUnsplash('1523315254130-1869e54911d3') },
      { id: 'attr-xa-5', name: '陕西历史博物馆', tags: ['华夏宝库', '文物精粹'], rating: 4.8, reason: '被誉为“古都明珠，华夏宝库”，文物极具价值。', image: getUnsplash('1590494056291-7f8974a96078') },
      { id: 'attr-xa-6', name: '华清宫', tags: ['皇家园林', '爱情故事'], rating: 4.6, reason: '唐玄宗与杨贵妃的避暑胜地，长恨歌表演震撼。', image: getUnsplash('1597843477146-72479768bada') },
      { id: 'attr-xa-7', name: '西安钟鼓楼', tags: ['城市中心', '古代计时'], rating: 4.7, reason: '位于西安市中心，是古城的标志性建筑。', image: getUnsplash('1629813291583-e18776ca1c42') },
      { id: 'attr-xa-8', name: '回民街', tags: ['美食天堂', '民族风情'], rating: 4.5, reason: '西安著名的美食文化街区，感受浓郁的市井气息。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'attr-xa-9', name: '西安碑林博物馆', tags: ['书法艺术', '历史文献'], rating: 4.6, reason: '收藏中国古代碑石时间最早、名碑最多的艺术宝库。', image: getUnsplash('1557804506-669a67965ba0') },
      { id: 'attr-xa-10', name: '华山', tags: ['奇险天下', '五岳之一'], rating: 4.8, reason: '以“奇、险、峻、秀”闻名，挑战长空栈道。', image: getUnsplash('1599571028712-4299b8602994') }
    ],
    famousFoods: [
      { id: 'food-xa-1', name: '肉夹馍', tags: ['中式汉堡', '腊汁肉'], priceRange: '￥20', reviews: 2400, reason: '馍酥肉香，肥而不腻，是西安最负盛名的小吃。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'food-xa-2', name: '羊肉泡馍', tags: ['汤鲜味浓', '仪式感'], priceRange: '￥40', reviews: 1650, reason: '汤头浓郁，馍块吸饱了汤汁，暖胃又暖心。', image: getUnsplash('1552611052-33e04de081de') },
      { id: 'food-xa-3', name: '凉皮', tags: ['酸辣爽口', '夏日必备'], priceRange: '￥15', reviews: 1900, reason: '调料丰富，口感筋道，是西安人的夏日最爱。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'food-xa-4', name: 'Biang Biang 面', tags: ['宽面筋道', '陕西特色'], priceRange: '￥25', reviews: 2100, reason: '面条宽如裤带，口感筋道，油泼辣子香气扑鼻。', image: getUnsplash('1520236060906-9c5ed525b025') },
      { id: 'food-xa-5', name: '胡辣汤', tags: ['浓郁咸鲜', '传统早餐'], priceRange: '￥10', reviews: 1400, reason: '汤汁浓稠，配料丰富，是西安人早餐的灵魂。', image: getUnsplash('1523450001312-faa4e2e31f0f') },
      { id: 'food-xa-6', name: '甑糕', tags: ['甜香软糯', '传统甜点'], priceRange: '￥15', reviews: 900, reason: '糯米、红枣、芸豆蒸制，口感软糯，甜而不腻。', image: getUnsplash('1597843477146-72479768bada') },
      { id: 'food-xa-7', name: '水盆羊肉', tags: ['汤清肉嫩', '鲜美无比'], priceRange: '￥35', reviews: 1100, reason: '汤清见底，肉质酥烂，搭配月牙饼食用最佳。', image: getUnsplash('1523315254130-1869e54911d3') },
      { id: 'food-xa-8', name: '葫芦鸡', tags: ['外酥里嫩', '传统名菜'], priceRange: '￥80', reviews: 1000, reason: '经过清煮、蒸制、油炸，皮酥肉嫩，骨肉分离。', image: getUnsplash('1508804185872-d7badad00f7d') },
      { id: 'food-xa-9', name: '烤羊肉串', tags: ['炭火现烤', '宵夜必点'], priceRange: '￥50', reviews: 2500, reason: '炭火现烤，撒上孜然辣椒，肉香四溢。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'food-xa-10', name: '冰峰汽水', tags: ['西安限定', '怀旧味道'], priceRange: '￥5', reviews: 3000, reason: '西安人的“快乐水”，搭配凉皮肉夹馍是标配。', image: getUnsplash('1599571028712-4299b8602994') }
    ],
    image: getUnsplash('1582234033100-843477146522'),
    tourCount: 6
  },
  {
    id: 'gl',
    name: 'Guilin',
    description: 'Famous for its dramatic karst landscape and the winding Li River.',
    longDescription: 'Guilin is a city in southern China known for its landscape of limestone karst hills and the magical Li River.',
    attractions: [
      { id: 'attr-gl-1', name: '漓江', tags: ['山水画卷', '20元背景'], rating: 4.9, reason: '世界上规模最大、风景最美的岩溶山水游览区。', image: getUnsplash('1523731407965-2430cd12f5e4') },
      { id: 'attr-gl-2', name: '象鼻山', tags: ['桂林城徽', '地标建筑'], rating: 4.6, reason: '酷似巨象饮水，是桂林的象征。', image: getUnsplash('1529921879218-f99546d03a9d') },
      { id: 'attr-gl-3', name: '阳朔西街', tags: ['异国风情', '繁华夜市'], rating: 4.5, reason: '拥有1400多年历史，充满中西合璧的独特魅力。', image: getUnsplash('1533038590840-1cde6e668a91') },
      { id: 'attr-gl-4', name: '遇龙河', tags: ['竹筏漂流', '田园风光'], rating: 4.8, reason: '漓江在阳朔境内最长的一条支流，人称“小漓江”。', image: getUnsplash('1563245332-692739e746e7') },
      { id: 'attr-gl-5', name: '银子岩', tags: ['溶洞奇观', '钟乳石'], rating: 4.7, reason: '贯穿十二座山峰，被誉为“世界溶洞宝库”。', image: getUnsplash('1596464716127-f2a82984de30') },
      { id: 'attr-gl-6', name: '龙脊梯田', tags: ['农耕文明', '壮丽景观'], rating: 4.8, reason: '规模宏大，线条行云流水，四季景色各异。', image: getUnsplash('1590494056291-7f8974a96078') },
      { id: 'attr-gl-7', name: '两江四湖', tags: ['城市水系', '夜游桂林'], rating: 4.6, reason: '环城水系，夜景灯光璀璨，媲美威尼斯。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'attr-gl-8', name: '十里画廊', tags: ['骑行圣地', '山水风光'], rating: 4.7, reason: '沿途风景如画，是骑行和漫步的最佳路线。', image: getUnsplash('1599571028712-4299b8602994') },
      { id: 'attr-gl-9', name: '独秀峰·王城', tags: ['历史文化', '岭南第一名胜'], rating: 4.5, reason: '“桂林山水甲天下”名句的出处。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'attr-gl-10', name: '芦笛岩', tags: ['艺术之宫', '溶洞景观'], rating: 4.6, reason: '洞内钟乳石奇态万千，灯光效果如梦似幻。', image: getUnsplash('1520236060906-9c5ed525b025') }
    ],
    famousFoods: [
      { id: 'food-gl-1', name: '桂林米粉', tags: ['卤水灵魂', '经济实惠'], priceRange: '￥15', reviews: 3100, reason: '卤水醇厚，米粉Q弹，是桂林人的生活底色。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'food-gl-2', name: '阳朔啤酒鱼', tags: ['鲜香入味', '地方特色'], priceRange: '￥80', reviews: 1450, reason: '选用漓江鲜鱼，配以啤酒焖制，风味独特。', image: getUnsplash('1599571028712-4299b8602994') },
      { id: 'food-gl-3', name: '荔浦芋扣肉', tags: ['软糯香浓', '传统名菜'], priceRange: '￥60', reviews: 900, reason: '芋头软糯，扣肉肥而不腻，两者完美融合。', image: getUnsplash('1524396309943-e03f5ee7fc27') },
      { id: 'food-gl-4', name: '恭城油茶', tags: ['独特风味', '养生饮品'], priceRange: '￥20', reviews: 1100, reason: '味道微苦回甘，搭配炒米、花生，别有风味。', image: getUnsplash('1520236060906-9c5ed525b025') },
      { id: 'food-gl-5', name: '桂林田螺', tags: ['鲜辣爽口', '宵夜必点'], priceRange: '￥30', reviews: 1300, reason: '加入酸笋、紫苏炒制，味道鲜辣，令人欲罢不能。', image: getUnsplash('1523450001312-faa4e2e31f0f') },
      { id: 'food-gl-6', name: '竹筒饭', tags: ['清香软糯', '民族特色'], priceRange: '￥25', reviews: 800, reason: '糯米放入竹筒中火烤，带有淡淡的竹子清香。', image: getUnsplash('1597843477146-72479768bada') },
      { id: 'food-gl-7', name: '桂林松糕', tags: ['甜香软糯', '传统点心'], priceRange: '￥10', reviews: 750, reason: '以糯米粉和红糖制成，口感松软，甜而不腻。', image: getUnsplash('1523315254130-1869e54911d3') },
      { id: 'food-gl-8', name: '荷叶粉蒸肉', tags: ['荷香浓郁', '肥而不腻'], priceRange: '￥40', reviews: 1000, reason: '荷叶包裹蒸制，肉质酥烂，带有淡淡荷香。', image: getUnsplash('1508804185872-d7badad00f7d') },
      { id: 'food-gl-9', name: '桂林酸嘢', tags: ['酸甜爽脆', '开胃小吃'], priceRange: '￥15', reviews: 1200, reason: '各种时令蔬果腌制，酸甜适口，非常开胃。', image: getUnsplash('1548013146-72479768bada') },
      { id: 'food-gl-10', name: '马蹄糕', tags: ['清甜爽口', '传统甜点'], priceRange: '￥10', reviews: 950, reason: '以马蹄粉制成，色泽透明，口感Q弹清甜。', image: getUnsplash('1599571028712-4299b8602994') }
    ],
    image: getUnsplash('1523731407965-2430cd12f5e4'),
    tourCount: 10
  }
];

export const TOURS: Tour[] = [
  {
    id: '1',
    title: 'Beijing-Xi\'an-Shanghai 8 Days',
    tagline: 'The classic golden triangle of Chinese history and modernity.',
    description: 'The Golden Triangle tour is our most popular route for first-time visitors. It balances the imperial grandeur of Beijing, the ancient secrets of Xi\'an, and the high-tech pulse of Shanghai.',
    highlights: ['Forbidden City Private Access', 'Sunrise at the Great Wall', 'Terracotta Warriors Expert Tour', 'Shanghai Night Bund Cruise'],
    itinerary: [
      { day: 1, title: 'Arrival in Beijing', description: 'Meet your private butler at the airport and transfer to your boutique hotel. Briefing on Alipay/WeChat Pay setup.' },
      { day: 2, title: 'The Imperial Legacy', description: 'Explore the Forbidden City and Temple of Heaven with a PhD historian guide.' },
      { day: 3, title: 'The Great Wall', description: 'A private trek on the Mutianyu section of the Great Wall, followed by a picnic lunch.' },
      { day: 4, title: 'High-speed Train to Xi\'an', description: 'Experience the world\'s fastest rail network. Visit the Muslim Quarter for a foodie tour at night.' },
      { day: 5, title: 'Ancient Xi\'an', description: 'Terracotta Warriors Museum and cycling on the 600-year-old City Wall.' }
    ],
    included: ['4/5 Star Boutique Hotels', 'Private Chauffeur', 'Expert Bilingual Guides', 'Daily Breakfast', 'Train Tickets'],
    excluded: ['International Flights', 'Travel Insurance', 'Personal Expenses'],
    audience: 'First-time visitors, history buffs',
    price: 1299,
    rating: 4.9,
    reviews: 127,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=1200',
    destinationId: 'bj'
  },
  {
    id: '4',
    title: 'Beijing In-Depth 5 Days',
    tagline: 'Immerse yourself in the heart of the imperial capital.',
    description: 'Perfect for travelers who want to see more than just the surface. This 5-day intensive dive covers hidden temples, authentic local life, and the best culinary spots in Beijing.',
    highlights: ['Hutong Rickshaw Tour', 'Peking Opera Workshop', 'Lama Temple', 'Secret Great Wall Sections'],
    itinerary: [
      { day: 1, title: 'Hutong Life', description: 'Walk through the narrow alleys of old Beijing. Meet a local family for tea.' },
      { day: 2, title: 'Art & Tradition', description: 'Visit the 798 Art District and the Confucius Temple.' },
      { day: 3, title: 'The Wild Wall', description: 'Hike the unrestored Jiankou section of the Wall for breathtaking photos.' }
    ],
    included: ['All Entrance Fees', 'Expert Guide', 'All Ground Transport'],
    audience: 'Time-limited travelers wanting depth',
    price: 799,
    rating: 4.9,
    reviews: 150,
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800',
    destinationId: 'bj'
  }
];

export const SURVIVAL_KITS: SurvivalKit[] = [
  { id: '1', title: 'Payment Guide', description: 'Master Alipay and WeChat Pay in minutes.', icon: '💳', pdfUrl: '#' },
  { id: '2', title: 'Network Solution', description: 'Complete guide to VPNs and local SIM cards.', icon: '📶', pdfUrl: '#' },
  { id: '3', title: 'Language Helper', description: 'Essential survival phrases and bilingual cards.', icon: '🗣️', pdfUrl: '#' },
  { id: '4', title: 'Emergency Kit', description: 'Health and safety guide for travelers.', icon: '🚑', pdfUrl: '#' }
];

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'diy',
    name: 'DIY Survival Kit',
    price: '$9.90',
    features: ['Instant Digital Download', 'Step-by-step setup guides', 'Essential checklist', 'Basic itinerary template'],
    cta: 'Get Survival Kit'
  },
  {
    id: 'planning',
    name: 'Custom Planning',
    price: '$159',
    oldPrice: '$199',
    features: ['Expert Butler consultation', 'Day-by-day custom roadbook', 'Booking assistance', 'Cultural etiquette guide'],
    cta: 'Consult Planning',
    popular: true
  },
  {
    id: 'butler',
    name: 'On-Trip Butler',
    price: '$29/Day',
    features: ['24/7 WhatsApp support', 'Real-time translation', 'Emergency response', 'Instant reservation changes'],
    cta: 'Learn More'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    user: 'Emily',
    country: 'USA',
    story: 'Our flight to Beijing was canceled at midnight. Sarah (LyrikTrip Butler) contacted us immediately, rebooked everything, and saved our trip!',
    category: 'Flight Emergency',
    avatar: 'https://i.pravatar.cc/150?u=emily',
    tourName: 'Beijing-Xi\'an 8 Days'
  },
  {
    id: '2',
    user: 'John',
    country: 'UK',
    story: 'In a local Chengdu restaurant with no English menu, I video-called my butler. She translated everything and even talked to the chef about my allergies.',
    category: 'Language Assistance',
    avatar: 'https://i.pravatar.cc/150?u=john',
    tourName: 'Southwest Explorer'
  }
];

export const WHY_TRUST_DATA = [
  { pain: 'How do I pay without a local card?', sol: 'We setup your Alipay/WeChat Pay before you arrive.', icon: '💳' },
  { pain: 'Will my VPN work for Google/Social?', sol: 'We provide verified, high-speed network solutions.', icon: '📶' },
  { pain: 'What if I have a medical emergency?', sol: '24/7 Butler support connects you to international clinics.', icon: '🚑' },
  { pain: 'How do I book high-speed trains?', sol: 'Our team handles all bookings and ticket delivery.', icon: '🚄' },
];
