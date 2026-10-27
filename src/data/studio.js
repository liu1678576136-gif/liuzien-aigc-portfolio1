import { importedMotionWorks } from "./videoWorks.js";

const asset = (file) => `/assets/${file}`;
export const derived = (source, kind = "cover") => `/assets/studio/${source.split("/").pop().replace(/\.[^.]+$/, "")}-${kind}.webp`;
const image = (file, alt) => ({ type: "image", original: asset(file), src: derived(asset(file), "full"), alt });
const film = (file, poster, alt) => ({ type: "video", src: asset(`marquee/${file}.mp4`), preview: asset(`marquee/previews/${file}.mp4`), poster: derived(asset(`marquee/${poster}`)), posterOriginal: asset(`marquee/${poster}`), alt });

export const creator = {
  name: "刘梓恩", latinName: "Liu Zien", title: "AIGC Visual Designer", email: "1678576136@qq.com",
  portraitOriginal: asset("professional-portrait-cleaned.png"),
  portrait: derived(asset("professional-portrait-cleaned.png"), "full"),
  introduction: "将 AI 生成、视觉设计与动态叙事结合，把想象推进成可以展示、提案和交付的视觉作品。",
};

export const categories = [
  { id: "all", label: "全部作品", en: "All work" },
  { id: "motion", label: "AI 影像", en: "AI Motion" },
  { id: "brand", label: "品牌视觉", en: "Brand Identity" },
  { id: "poster", label: "商业海报", en: "Campaign" },
  { id: "ip", label: "IP 角色", en: "Character" },
  { id: "other", label: "其他作品", en: "Other Works" },
];

const legacyMotionCollections = { orbital: "narrative", botanical: "commercial", "tech-motion": "commercial", "spring-motion": "lifestyle", "x3-motion": "commercial" };

export const works = [
  ...importedMotionWorks,
  {
    id: "orbital", category: "motion", title: "失重之间", subtitle: "Orbital / Cinematic study", coverOriginal: asset("marquee/posters/ding4-marquee-motion.jpg"),
    description: "一段以宇航员、破碎舷窗与地球为画面主体的 AI 动态影像。通过空间层次与冷暖光线构建科幻氛围。",
    deliverables: ["AI 动态影像"], media: [film("ding4-marquee-motion", "posters/ding4-marquee-motion.jpg", "宇航员与地球的科幻动态影像")],
  },
  {
    id: "botanical", category: "motion", title: "植感新生", subtitle: "Botanical / Product visual", coverOriginal: asset("marquee/posters/skincare-ad-motion.jpg"),
    description: "以绿色护肤罐与漂浮叶片构成的产品动态视觉，探索自然材质、光线和产品展示之间的关系。",
    deliverables: ["产品动态视觉"], media: [film("skincare-ad-motion", "posters/skincare-ad-motion.jpg", "绿色护肤产品动态视觉")],
  },
  {
    id: "tech-motion", category: "motion", title: "电商 · 动态实验", subtitle: "Commerce / Product motion", coverOriginal: asset("marquee/posters/tech-ecommerce-ad-motion.jpg"),
    description: "以现有电商动态作品，呈现产品影像方向的视觉探索。", deliverables: ["产品动态视觉"],
    media: [film("tech-ecommerce-ad-motion", "posters/tech-ecommerce-ad-motion.jpg", "电商产品动态视觉作品")],
  },
  {
    id: "spring-motion", category: "motion", title: "春日来信", subtitle: "Spring / Motion study", coverOriginal: asset("marquee/posters/spring-commercial-motion.jpg"),
    description: "春日主题的动态视觉作品，以完整视频呈现画面、色彩与运动的组合。", deliverables: ["动态影像"],
    media: [film("spring-commercial-motion", "posters/spring-commercial-motion.jpg", "春日主题动态影像")],
  },
  {
    id: "x3-motion", category: "motion", title: "动态海报实验", subtitle: "X3 / Moving poster", coverOriginal: asset("marquee/posters/x3-poster-motion.jpg"),
    description: "从静态构图延伸到时间维度，以现有动态海报探索画面节奏。", deliverables: ["动态海报"],
    media: [film("x3-poster-motion", "posters/x3-poster-motion.jpg", "X3 动态海报作品")],
  },
  {
    id: "moxo", category: "brand", title: "MOXO 品牌视觉", subtitle: "MOXO / Visual identity", coverOriginal: asset("project-vi-moxo-board.png"),
    description: "品牌标识、色彩、版式与应用物料的整体展示。从视觉识别到应用延展，呈现品牌系统的一致性。",
    deliverables: ["品牌识别展示", "视觉应用长图"], media: [image("project-vi-moxo-board.png", "MOXO 品牌视觉展示"), image("project-vi-moxo-upgrade.jpg", "MOXO 品牌视觉完整长图")],
  },
  {
    id: "youxin", category: "brand", title: "友信 · 品牌识别", subtitle: "YOUXIN / Identity system", coverOriginal: asset("project-vi-youxin-identity-cover.jpg"),
    description: "以品牌识别与规范应用为核心，呈现标识、视觉系统及品牌手册。", deliverables: ["品牌视觉展示", "品牌手册"],
    media: [image("project-vi-youxin-identity-cover.jpg", "友信品牌识别封面"), image("project-vi-youxin-upgrade.jpg", "友信品牌视觉完整展示")],
    document: { href: asset("project-vi-youxin-brand-book.pdf"), label: "查看品牌手册 PDF" },
  },
  {
    id: "take-your-time", category: "brand", title: "TAKE YOUR TIME", subtitle: "Take your time / Brand study", coverOriginal: asset("project-vi-take-your-time-hero.png"),
    description: "围绕 TAKE YOUR TIME 展开的品牌视觉与应用设计，呈现从主视觉到系列延展的统一表达。",
    deliverables: ["品牌主视觉", "视觉应用长图"], media: [image("project-vi-take-your-time-hero.png", "TAKE YOUR TIME 品牌主视觉"), image("project-vi-take-your-time-upgrade.jpg", "TAKE YOUR TIME 品牌完整长图")],
  },
  {
    id: "xtep", category: "poster", title: "特步 · 商业视觉", subtitle: "XTEP / Retail campaign", coverOriginal: asset("project-poster-xtep-wall-display.jpg"),
    description: "运动品牌的门店推广、活动主视觉与终端物料展示，关注商业信息层级与线下应用的一致性。",
    deliverables: ["门店推广视觉", "终端物料展示"], media: [image("project-poster-xtep-wall-display.jpg", "特步门店推广主视觉"), image("project-poster-xtep-pop-set.jpg", "特步终端 POP 物料系列")],
  },
  {
    id: "pet-campaign", category: "poster", title: "宠物品牌 · 视觉推广", subtitle: "Pet campaign / Illustration", coverOriginal: asset("project-poster-pet-promo.jpg"),
    description: "以角色插画、产品与促销信息组织商业画面，延展至包装及系列推广物料。",
    deliverables: ["促销海报", "插画与包装展示"], media: [image("project-poster-pet-promo.jpg", "宠物品牌促销海报"), image("project-poster-illustration-packaging-set.jpg", "插画与包装物料系列")],
  },
  {
    id: "tianwang", category: "poster", title: "天王 · 电商视觉", subtitle: "TIANWANG / E-commerce", coverOriginal: asset("project-poster-xtep-opening.jpg"),
    description: "腕表产品与节日活动的电商视觉展示，包含活动主视觉及系列营销画面。",
    deliverables: ["活动主视觉", "电商营销系列"], media: [image("project-poster-xtep-opening.jpg", "天王腕表节日活动主视觉"), image("project-poster-tianwang-ecommerce-set.jpg", "天王电商视觉系列")],
  },
  {
    id: "momo", category: "ip", title: "MOMO 的小小世界", subtitle: "MOMO / Character & world", coverOriginal: asset("project-ip-momo-bedtime.png"),
    description: "以 MOMO 角色为中心，将造型语言延展到睡前、庆祝等生活场景，探索统一角色在不同情境中的视觉表达。",
    deliverables: ["角色动态展示", "角色场景图", "IP 系列展示"],
    media: [
      { type: "video", src: asset("studio/momo-cow-actions.mp4"), poster: derived(asset("studio/momo-cow-actions.jpg")), posterOriginal: asset("studio/momo-cow-actions.jpg"), alt: "MOMO-COW 八动作动态展示板" },
      image("project-ip-momo-upgrade.jpg", "MOMO IP 完整系列长图"),
    ],
  },
  {
    id: "lze-workbench", category: "other", title: "LZE工作台", subtitle: "LZE / Creative workspace", coverOriginal: asset("workbench/lze-workbench-poster.webp"),
    description: "围绕图片、视频与提示词管理，展示 LZE 工作台的界面与使用流程。",
    deliverables: ["工作台演示视频", "工作台界面展示"],
    media: [
      { type: "video", src: asset("workbench/lze-workbench-demo.mp4"), poster: derived(asset("workbench/lze-workbench-poster.webp")), posterOriginal: asset("workbench/lze-workbench-poster.webp"), alt: "LZE工作台 · 操作演示" },
      image("workbench/screenshots/lze-workspace.png", "LZE工作台 · 作品管理"),
      image("workbench/screenshots/lze-material-library.png", "LZE工作台 · 素材库"),
      image("workbench/screenshots/lze-multi-image-editor.png", "LZE工作台 · 多图编辑"),
      image("workbench/screenshots/lze-video-generation.png", "LZE工作台 · 视频生成"),
      image("workbench/screenshots/lze-motion-transfer.png", "LZE工作台 · 动作迁移与变装"),
    ],
  },
].map((work, index) => ({ ...work, collection: work.collection || legacyMotionCollections[work.id], cover: derived(work.coverOriginal), number: String(index + 1).padStart(2, "0"), categoryLabel: categories.find((c) => c.id === work.category).label }));

export const workById = Object.fromEntries(works.map((work) => [work.id, work]));
export const chapters = [
  { id: "opening", label: "序章", en: "Prologue", position: 0 },
  { id: "motion", label: "影像", en: "Motion", position: 2.55 },
  { id: "brand", label: "商业", en: "Visual", position: 4.15 },
  { id: "ip", label: "角色", en: "Character", position: 5.8 },
];

export const career = [
  { period: "2024.08 — 2026.04", company: "天王电子（深圳）有限公司", role: "AIGC 设计师", description: "负责抖音店铺视觉、节日活动主视觉与商品设计；协同运营制作推广及直播间物料，将 AI 文生图应用于电商视觉生产。" },
  { period: "2022.05 — 2024.04", company: "中国特步 · 深圳加速度体育用品有限公司", role: "企划设计师", description: "承接季度推广物料与门店布置，围绕销售节点设计促销海报，跟进节日布展及物料执行。" },
  { period: "2018.08 — 2022.02", company: "宠控创新科技有限公司", role: "视觉设计师", description: "负责运营视觉与品牌调性，设计线下推广、展会物料、H5、电商主图与活动主视觉。" },
];
