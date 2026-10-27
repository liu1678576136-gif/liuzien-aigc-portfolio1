const base = "/assets/video-works/";
const poster = slug => `${base}posters/${slug}.jpg`;
const reference = slug => `${base}references/${slug}.jpg`;
const video = (slug, alt) => ({ type: "video", src: `${base}videos/${slug}.mp4`, poster: poster(slug), posterOriginal: poster(slug), alt });
const image = (slug, alt) => ({ type: "image", src: `/assets/studio/${slug}-full.webp`, original: reference(slug), alt });

export const motionCollections = [
  { id: "narrative", title: "叙事短片", en: "NARRATIVE FILMS" },
  { id: "commercial", title: "商业广告", en: "COMMERCIAL FILMS" },
  { id: "lifestyle", title: "生活与风格", en: "LIFE & ATMOSPHERE" },
  { id: "people", title: "人物与换装", en: "CHARACTER & WARDROBE" },
];

export const jinYiWeiFilm = video("jin-yi-wei", "锦衣卫 · 完整短片");
const darkCityFinal = video("dark-city-final", "暗夜都市 · 最终成片");
const wardrobeResult = video("wardrobe-result", "人物换装 · 生成结果");
const western = { ...video("western-dark", "西部暗黑 · 完整短片"), poster: reference("western-cover"), posterOriginal: reference("western-cover") };

export const importedMotionWorks = [
  {
    id: "jin-yi-wei", category: "motion", collection: "narrative", title: "锦衣卫", subtitle: "Jin Yi Wei / Character film", coverOriginal: poster("jin-yi-wei"),
    description: "以古装人物、城池与动作场面展开的动态短片，呈现人物形象、环境与镜头节奏的组合。",
    deliverables: ["叙事短片"], media: [jinYiWeiFilm],
  },
  {
    id: "dark-city", category: "motion", collection: "narrative", title: "暗夜都市", subtitle: "Dark City / Previs to film", coverOriginal: poster("dark-city-final"),
    description: "围绕室内对峙场景展开的短片，将 3D 白模预演与最终成片放在一起，展示同一项目的两个制作阶段。",
    deliverables: ["3D 白模预演", "最终成片"], media: [darkCityFinal],
    production: [
      { id: "previs", title: "3D 白模预演", description: "查看白模阶段的机位、人物位置与镜头运动。", media: [video("dark-city-previs", "暗夜都市 · 3D 白模预演")] },
      { id: "final", title: "最终成片", description: "对照完整成片，查看人物、场景和画面表现。", output: true, media: [darkCityFinal] },
    ],
  },
  {
    id: "western-dark", category: "motion", collection: "narrative", title: "西部暗黑", subtitle: "Red Dust Queen / Western film", coverOriginal: reference("western-cover"),
    description: "以西部人物、扑克牌与红黑画面构成的风格短片，将平面构图延伸为连续的动态视觉。",
    deliverables: ["风格短片"], media: [western],
  },
  {
    id: "lipstick-ad", category: "motion", collection: "commercial", title: "口红广告", subtitle: "Bloom / Beauty commercial", coverOriginal: poster("lipstick-ad"),
    description: "围绕人物、美妆产品与粉色花境展开的竖屏广告，呈现产品展示与人物镜头的组合。",
    deliverables: ["美妆广告"], media: [video("lipstick-ad", "口红广告 · 美妆动态影像")],
  },
  {
    id: "social-skincare", category: "motion", collection: "commercial", title: "小红书推广", subtitle: "Skincare / Social commercial", coverOriginal: poster("social-skincare"),
    description: "以人物口播、产品展示和使用画面组织的竖屏护肤推广视频。",
    deliverables: ["社交推广视频"], media: [video("social-skincare", "小红书推广 · 护肤产品视频")],
  },
  {
    id: "bag-showcase", category: "motion", collection: "commercial", title: "包包 · 产品短片", subtitle: "Handbag / Product showcase", coverOriginal: poster("bag-showcase"),
    description: "通过手提、肩背与产品近景，展示黑色包袋的造型、材质与搭配。",
    deliverables: ["产品展示短片"], media: [video("bag-showcase", "包包 · 产品展示视频")],
  },
  {
    id: "cafe-day", category: "motion", collection: "lifestyle", title: "日常咖啡馆", subtitle: "Cafe / Everyday moments", coverOriginal: poster("cafe-day"),
    description: "以咖啡馆中的人物、自然光与日常动作为主体，记录一段轻松的生活氛围。",
    deliverables: ["生活氛围短片"], media: [video("cafe-day", "日常咖啡馆 · 人物生活短片")],
  },
  {
    id: "cat-seasons", category: "motion", collection: "lifestyle", title: "猫咪的春夏秋冬", subtitle: "Cat Seasons / A changing world", coverOriginal: poster("cat-spring"),
    description: "围绕同一云端树屋与猫咪角色，呈现春、夏、秋、冬四组动态场景。",
    deliverables: ["四季系列影像"], media: [video("cat-spring", "猫咪的四季 · 春"), video("cat-summer", "猫咪的四季 · 夏"), video("cat-autumn", "猫咪的四季 · 秋"), video("cat-winter", "猫咪的四季 · 冬")],
  },
  {
    id: "character-looks", category: "motion", collection: "people", title: "人物与服装演绎", subtitle: "Character looks / Motion studies", coverOriginal: poster("character-look-one"),
    description: "收录三段人物与服装动态片段，呈现不同造型、环境和动作中的人物表现。",
    deliverables: ["人物动态展示", "服装动态演绎"], media: [video("character-look-one", "人物与服装演绎 · 片段一"), video("character-look-two", "人物与服装演绎 · 片段二"), video("character-portrait", "人物动态展示 · 户外片段")],
  },
  {
    id: "wardrobe-process", category: "motion", collection: "people", title: "人物换装 · 制作过程", subtitle: "Virtual wardrobe / Process study", coverOriginal: poster("wardrobe-result"),
    description: "结合服装参考、原视频、黑白深度视频与生成结果，展示人物换装从输入素材到输出画面的制作过程。",
    deliverables: ["服装参考", "原视频", "黑白深度视频", "生成结果"], media: [wardrobeResult],
    production: [
      { id: "reference", title: "服装与穿搭参考", description: "服装平铺图与穿搭参考共同说明这次换装的目标。", kind: "reference", wide: true, media: [image("wardrobe-garment", "服装平铺参考"), image("wardrobe-look", "目标穿搭参考")] },
      { id: "source", title: "原视频", description: "查看换装前的人物动作、镜头与场景。", media: [video("wardrobe-source", "人物换装 · 原视频")] },
      { id: "depth", title: "黑白深度视频", description: "查看同组动作的深度控制画面。", media: [video("wardrobe-depth", "人物换装 · 黑白深度控制")] },
      { id: "result", title: "生成结果", description: "对照原视频，查看服装与人物画面的生成结果。", output: true, media: [wardrobeResult] },
    ],
  },
];

export const videoWorkEnglish = {
  "包包 · 产品短片": "Handbag · Product Film", "产品展示短片": "Product showcase", "包包 · 产品展示视频": "Handbag · Product showcase",
  "通过手提、肩背与产品近景，展示黑色包袋的造型、材质与搭配。": "A black handbag shown through handheld styling, shoulder wear and product close-ups.",
  "制作过程": "Making the work", "查看制作过程": "View the process",
  "叙事短片": "Narrative films", "商业广告": "Commercial films", "生活与风格": "Life & atmosphere", "人物与换装": "Character & wardrobe",
  "锦衣卫": "Jin Yi Wei", "暗夜都市": "Dark City", "西部暗黑": "Red Dust Queen", "口红广告": "Lipstick Commercial", "小红书推广": "Social Skincare", "日常咖啡馆": "A Day at the Cafe", "猫咪的春夏秋冬": "Cat Seasons", "人物与服装演绎": "Character & Wardrobe Studies", "人物换装 · 制作过程": "Virtual Wardrobe · The Process",
  "以古装人物、城池与动作场面展开的动态短片，呈现人物形象、环境与镜头节奏的组合。": "A character film combining historical costume, cityscapes and action through a sequence of cinematic shots.",
  "围绕室内对峙场景展开的短片，将 3D 白模预演与最终成片放在一起，展示同一项目的两个制作阶段。": "An interior confrontation presented through two stages of the same project: a 3D previs and the finished film.",
  "以西部人物、扑克牌与红黑画面构成的风格短片，将平面构图延伸为连续的动态视觉。": "A stylized Western film that brings character art, playing cards and red-and-black compositions into motion.",
  "围绕人物、美妆产品与粉色花境展开的竖屏广告，呈现产品展示与人物镜头的组合。": "A vertical beauty commercial combining a model, product shots and a pink floral setting.",
  "以人物口播、产品展示和使用画面组织的竖屏护肤推广视频。": "A vertical skincare promotion combining a spoken presentation, product shots and demonstrations.",
  "以咖啡馆中的人物、自然光与日常动作为主体，记录一段轻松的生活氛围。": "An everyday cafe moment built around a character, natural light and simple actions.",
  "围绕同一云端树屋与猫咪角色，呈现春、夏、秋、冬四组动态场景。": "Four seasonal scenes following the same cat and a treehouse above the clouds.",
  "收录三段人物与服装动态片段，呈现不同造型、环境和动作中的人物表现。": "Three independent motion studies exploring characters, outfits, settings and movement.",
  "结合服装参考、原视频、黑白深度视频与生成结果，展示人物换装从输入素材到输出画面的制作过程。": "A wardrobe study showing the full path from garment references and source footage to depth guidance and the generated result.",
  "3D 白模预演": "3D previs", "最终成片": "Finished film", "风格短片": "Stylized film", "美妆广告": "Beauty commercial", "社交推广视频": "Social promotion", "生活氛围短片": "Lifestyle film", "四季系列影像": "Four-season series", "人物动态展示": "Character motion study", "服装动态演绎": "Wardrobe motion study",
  "服装参考": "Garment references", "原视频": "Source footage", "黑白深度视频": "Depth guidance", "生成结果": "Generated result", "完整短片": "Full film",
  "查看白模阶段的机位、人物位置与镜头运动。": "Explore camera placement, character blocking and camera movement in the previs.",
  "对照完整成片，查看人物、场景和画面表现。": "Compare the characters, setting and visual treatment in the finished film.",
  "服装与穿搭参考": "Garment & outfit references", "服装平铺参考": "Garment flatlay", "目标穿搭参考": "Target outfit",
  "服装平铺图与穿搭参考共同说明这次换装的目标。": "A garment flatlay and an outfit reference establish the target wardrobe.",
  "查看换装前的人物动作、镜头与场景。": "View the original movement, camera and setting before the wardrobe change.",
  "查看同组动作的深度控制画面。": "View the depth guidance for the same sequence of actions.",
  "对照原视频，查看服装与人物画面的生成结果。": "Compare the generated outfit and character with the source footage.",
  "锦衣卫 · 完整短片": "Jin Yi Wei · Full film", "暗夜都市 · 最终成片": "Dark City · Finished film", "暗夜都市 · 3D 白模预演": "Dark City · 3D previs", "西部暗黑 · 完整短片": "Red Dust Queen · Full film",
  "口红广告 · 美妆动态影像": "Lipstick · Beauty commercial", "小红书推广 · 护肤产品视频": "Social skincare promotion", "日常咖啡馆 · 人物生活短片": "Cafe · Lifestyle character film",
  "猫咪的四季 · 春": "Cat Seasons · Spring", "猫咪的四季 · 夏": "Cat Seasons · Summer", "猫咪的四季 · 秋": "Cat Seasons · Autumn", "猫咪的四季 · 冬": "Cat Seasons · Winter",
  "人物与服装演绎 · 片段一": "Wardrobe studies · Film one", "人物与服装演绎 · 片段二": "Wardrobe studies · Film two", "人物动态展示 · 户外片段": "Character study · Outdoor film",
  "人物换装 · 生成结果": "Virtual Wardrobe · Generated result", "人物换装 · 原视频": "Virtual Wardrobe · Source footage", "人物换装 · 黑白深度控制": "Virtual Wardrobe · Depth guidance",
};
