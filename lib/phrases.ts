// Phrasebook: Chinese text only; the meaning comes from the UI language (t.phrases).
export const PHRASES: { group: "basics" | "eating" | "around" | "hotel" | "emergency"; items: string[] }[] = [
  { group: "basics", items: ["你好", "谢谢", "不好意思", "我不会说中文", "多少钱？", "太贵了，能便宜一点吗？"] },
  { group: "eating", items: ["请给我菜单", "请不要辣", "微辣", "不要放味精", "买单", "可以刷外国信用卡吗？", "打包，谢谢"] },
  { group: "around", items: ["地铁站在哪里？", "洗手间在哪里？", "请打表", "请在这里停车", "从哪个出口出去？"] },
  { group: "hotel", items: ["我有预订", "可以晚一点退房吗？", "请问Wi-Fi密码是多少？", "请帮我写一下酒店的地址"] },
  { group: "emergency", items: ["救命！", "请帮我报警", "我需要看医生", "我的护照丢了", "我过敏", "请带我去医院"] },
];
