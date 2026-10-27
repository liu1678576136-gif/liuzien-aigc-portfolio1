import { jinYiWeiFilm } from "./videoWorks.js";

const base = "/assets/characters/";
const image = (number, title, kind) => ({
  id: `character-${number}`,
  src: `${base}thumbs/image-${number}.webp`,
  full: `${base}images/image-${number}.webp`,
  title, kind,
});

// Character artwork comes first; supporting designs follow from the same final collection.
export const characterImages = [
  image("01", "雪城回望", "人物画面"),
  image("03", "锦衣卫 · 人物设定", "人物设定"),
  image("04", "孤城 · 人物设定", "人物设定"),
  image("06", "无雪 · 人物设定", "人物设定"),
  image("09", "雪中竹林 · 人物动作", "人物画面"),
  image("11", "冰湖持剑", "人物画面"),
  image("13", "冰湖人物", "人物画面"),
  image("14", "雪城远行", "人物画面"),
  image("02", "锦衣卫 · 佩剑设定", "武器设定"),
  image("05", "孤城 · 武器设定", "武器设定"),
  image("07", "无雪 · 武器设定", "武器设定"),
  image("08", "雪城街巷", "场景设计"),
  image("10", "竹林古庙", "场景设计"),
  image("12", "冰湖场景", "场景设计"),
];

export const characterWebShowcase = {
  ...image("15", "霜河血令 · 网页展示", "网页设计"),
  width: 2559,
  height: 7588,
};

export const characterVideos = [{
  ...jinYiWeiFilm,
  id: "jin-yi-wei-final",
  type: "video",
  title: "锦衣卫 · 人物短片",
  alt: "锦衣卫人物短片",
}];
