export const navItems = [
  { label: "关于", href: "#about" },
  { label: "流程", href: "#process" },
  { label: "作品", href: "#projects" },
  { label: "联系", href: "#contact" },
];

export const profile = {
  name: "Liu Zien",
  title: "AIGC Visual Designer",
  email: "1678576136@qq.com",
  heroIntro: "AI visual systems / brand campaigns / cinematic motion assets",
  heroIntroZh: "用 AI 生成、视觉设计与动态叙事，把概念变成可交付的商业画面。",
  about:
    "Liu Zien is an AIGC visual designer building campaign-ready images, motion frames, and brand systems. The work combines prompt direction, controlled generation, retouching, layout, and web motion so each project can move from idea to portfolio-ready delivery.",
  aboutZh:
    "我将提示词、可控生成、后期修图、版式设计和动态网页表达结合起来，为品牌、电商、活动 KV 与 AI 视频方向制作可以展示、提案和交付的视觉方案。",
};

export const scrollSequence = {
  basePath: "/assets/scroll-sequence/ding",
  frameCount: 180,
  poster: "/assets/scroll-sequence/ding/poster.webp",
  framePattern: "frame_",
  extension: "webp",
  eyebrow: "Liu Zien / AIGC visual designer",
  kicker: "Same machine. Different rules.",
  storyScenes: [
    {
      number: "",
      align: "left-bottom",
      kicker: "intro",
      title: ["By day, I build AI systems.", "By night, I make AI art.", "Same machine. Different rules."],
      zh: "白天拆解流程与工具，夜晚把想象力推进成画面。",
    },
    {
      number: "",
      align: "left-top",
      kicker: "identity",
      title: ["A designer who lets AI dream.", "A maker who gives the dream rules."],
      zh: "生成不是随机出图，而是用审美、结构和商业目标设定边界。",
    },
    {
      number: "",
      align: "split",
      kicker: "method",
      title: ["Prompt", "Control", "Retouch", "Motion"],
      zh: "从提示词到后期，从静帧到滚动叙事。",
    },
    {
      number: "01",
      align: "left-bottom",
      kicker: "city",
      title: ["SHENZHEN"],
      zh: "A city that builds itself overnight. 一座不断刷新视觉速度的城市。",
    },
    {
      number: "02",
      align: "right-center",
      kicker: "Career",
      title: ["2018", "2026", "Calling"],
      zh: "2018-2026 工作经历：从商业视觉设计到 AIGC 视觉系统，持续把创意转化为可交付的项目成果。",
    },
    {
      number: "03",
      align: "center",
      kicker: "tool",
      title: ["AGENT"],
      zh: "构建会倾听的智能体，也构建能回应需求的视觉。",
    },
    {
      number: "04",
      align: "right-bottom",
      kicker: "delivery",
      title: ["TRANSLATE"],
      zh: "将提示词、参考资料与商业目标，转译为可落地的视觉方案。",
    },
  ],
};

export const seasonCarousel = {
  eyebrow: "Liu Zien / Seasonal AI motion poster",
  slides: [
    {
      index: "01",
      season: "SPRING",
      zh: "春",
      kicker: "Awakening",
      title: ["Spring", "生长"],
      subtitle: "以新生、轻盈和自然生命力，展开 AIGC 海报动态视觉的第一幕。",
      src: "/assets/season-carousel/jin-yi-wei-node-1.mp4",
      accent: "#7ee7b5",
    },
    {
      index: "02",
      season: "SUMMER",
      zh: "夏",
      kicker: "Heat",
      title: ["Summer", "盛放"],
      subtitle: "更强的光照、更高的饱和度，让画面进入热烈、鲜明的商业视觉节奏。",
      src: "/assets/season-carousel/jin-yi-wei-node-1.mp4",
      accent: "#36c7ff",
    },
    {
      index: "03",
      season: "AUTUMN",
      zh: "秋",
      kicker: "Harvest",
      title: ["Autumn", "沉淀"],
      subtitle: "用稳定的构图与成熟色彩，把氛围、叙事和产品感收束成可交付画面。",
      src: "/assets/season-carousel/jin-yi-wei-node-1.mp4",
      accent: "#ffb85c",
    },
    {
      index: "04",
      season: "WINTER",
      zh: "冬",
      kicker: "Silence",
      title: ["Winter", "冷境"],
      subtitle: "以克制、冷感和空间留白，完成四季动态海报的最后一段呼吸。",
      src: "/assets/season-carousel/jin-yi-wei-node-1.mp4",
      accent: "#8edcff",
    },
  ],
};

const sequenceFrame = (index) => `${scrollSequence.basePath}/frame_${String(index).padStart(4, "0")}.${scrollSequence.extension}`;

export const circularGalleryItems = [
  { image: sequenceFrame(8), text: "SPRING / 生长" },
  { image: sequenceFrame(24), text: "SUMMER / 盛放" },
  { image: sequenceFrame(42), text: "AUTUMN / 沉淀" },
  { image: sequenceFrame(66), text: "WINTER / 冷境" },
  { image: sequenceFrame(88), text: "PROMPT" },
  { image: sequenceFrame(112), text: "CONTROL" },
  { image: sequenceFrame(136), text: "RETOUCH" },
  { image: sequenceFrame(160), text: "MOTION" },
];

export const decorativeImages = [
  {
    src: sequenceFrame(8),
    alt: "Cinematic AI frame with red light",
    className: "about-deco about-deco-moon",
  },
  {
    src: sequenceFrame(36),
    alt: "Mechanical AI visual detail",
    className: "about-deco about-deco-object",
  },
  {
    src: sequenceFrame(64),
    alt: "Blue light AI video frame",
    className: "about-deco about-deco-lego",
  },
  {
    src: sequenceFrame(88),
    alt: "Dark cinematic generated frame",
    className: "about-deco about-deco-group",
  },
];

export const projects = [
  {
    number: "01",
    title: "Brand Identity System",
    category: "VI Design",
    href: "#contact",
    summary: "将 AI 生成视频、主视觉氛围与网页动效整合成可投放、可展示、可复用的动态视觉系统。",
    displaySummary: "从品牌识别、视觉规范到海报、电商、空间物料延展，构建统一且具备商业传播力的视觉系统。",
    images: ["/assets/project-vi-moxo-board.png", "/assets/project-vi-youxin-identity-cover.jpg", "/assets/project-vi-take-your-time-hero.png"],
    previewImages: [
      "/assets/project-vi-moxo-upgrade.jpg",
      "/assets/project-vi-youxin-upgrade.jpg",
      "/assets/project-vi-take-your-time-upgrade.jpg",
    ],
  },
  {
    number: "02",
    title: "Brand Poster System",
    category: "Client",
    href: "#contact",
    summary: "覆盖节日活动、电商主图、品牌推广与线下物料延展，强调商业信息的清晰层级和视觉记忆点。",
    images: [
      "/assets/project-poster-xtep-wall-display.jpg",
      "/assets/project-poster-pet-promo.jpg",
      "/assets/project-poster-xtep-opening.jpg",
    ],
    previewImages: [
      "/assets/project-poster-xtep-pop-set.jpg",
      "/assets/project-poster-illustration-packaging-set.jpg",
      "/assets/project-poster-tianwang-ecommerce-set.jpg",
    ],
  },
  {
    number: "03",
    title: "IP Character Design",
    category: "IP Design",
    href: "#contact",
    summary: "从提示词、参考图、二次精修到滚动叙事，把 AIGC 产出整理成能够讲清楚方法论的作品集案例。",
    displaySummary: "从角色定位、造型语言到表情、动作与场景延展，构建兼具识别度、亲和力与传播力的品牌 IP 形象系统。",
    images: ["/assets/project-ip-momo-bedtime.png", "/assets/project-ip-momo-celebration.png", "/assets/project-ip-momo-cow.png"],
    previewImages: [
      "/assets/project-ip-momo-bedtime.png",
      "/assets/project-ip-momo-celebration.png",
      "/assets/project-ip-momo-upgrade.jpg",
    ],
  },
];

export const marqueeImages = [6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94].map(sequenceFrame);

export const services = [
  {
    number: "01",
    title: "Brief / 需求拆解",
    description:
      "将商业目标转化为视觉方向、参考资料、情绪关键词和可控的生成路径。",
  },
  {
    number: "02",
    title: "Prompt / 生成控制",
    description:
      "建立提示词组、构图规则、光影说明和迭代记录，确保 AI 视觉输出保持一致。",
  },
  {
    number: "03",
    title: "Retouch / 后期完成",
    description:
      "对 AI 生成结果进行后期精修，完成版式、字体、色彩和交付级细节处理。",
  },
  {
    number: "04",
    title: "Motion / 动态叙事",
    description:
      "将静态素材和视频帧转化为滚动网页动效、活动循环动画和适合社媒传播的动态短片。",
  },
];

const legacyProjects = [
  {
    number: "01",
    title: "Cinematic AI Campaign",
    category: "AI Video / KV",
    href: "#contact",
    summary: "科幻叙事视觉、红蓝光源、动态帧拆解，用于活动主视觉和短视频开场。",
    images: [sequenceFrame(12), sequenceFrame(26), sequenceFrame(42)],
  },
  {
    number: "02",
    title: "Product Launch Visuals",
    category: "E-commerce",
    href: "#contact",
    summary: "以商业卖点为中心生成产品氛围图，再完成版式、色彩与宣传物料延展。",
    images: [sequenceFrame(50), sequenceFrame(58), sequenceFrame(66)],
  },
  {
    number: "03",
    title: "Brand World System",
    category: "Branding",
    href: "#contact",
    summary: "从关键词到视觉世界观，建立可重复使用的品牌图像语言和动态资产规范。",
    images: [sequenceFrame(70), sequenceFrame(78), sequenceFrame(86)],
  },
  {
    number: "04",
    title: "Workflow Documentation",
    category: "Process",
    href: "#contact",
    summary: "记录 brief、prompt、控制方法、迭代过程和最终交付物，让作品集可被判断。",
    images: [sequenceFrame(20), sequenceFrame(74), sequenceFrame(94)],
  },
];
