import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const designDir = path.join(repoRoot, "design");
const outputPath = path.join(designDir, "rpg-task-manager-5min-presentation.pptx");

const colors = {
  bg: "0E1328",
  bgAlt: "162043",
  panel: "1D2A52",
  panelAlt: "223463",
  gold: "E9C46A",
  goldSoft: "F4D58D",
  blue: "7DD3FC",
  cyan: "7CE7F2",
  red: "F28482",
  text: "F7F2E7",
  textMuted: "D9D2C5",
  line: "5B6C9D",
  success: "8BD3A8",
};

const page = { w: 13.333, h: 7.5 };
const SHAPE = new PptxGenJS()._shapeType;

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function versionOf(pkg, name) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const raw = deps[name] || "";
  return raw.replace(/^[^\d]*/, "");
}

function extractQuoteLine(text, prefix) {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}.*$`, "m");
  return text.match(pattern)?.[0] ?? prefix;
}

function hasPattern(text, pattern) {
  return pattern.test(text);
}

const readmeText = loadText(path.join(repoRoot, "README.md"));
const frontendPkg = loadJson(path.join(repoRoot, "package.json"));
const backendPkg = loadJson(path.join(repoRoot, "backend", "package.json"));
const taskInputText = loadText(path.join(repoRoot, "src", "TaskInput.jsx"));
const taskListText = loadText(path.join(repoRoot, "src", "TaskList.jsx"));
const authText = loadText(path.join(repoRoot, "src", "AuthScreen.jsx"));
const notificationsText = loadText(path.join(repoRoot, "src", "notifications.js"));
const aiServiceText = loadText(path.join(repoRoot, "src", "aiService.js"));
const mainAppText = loadText(path.join(repoRoot, "src", "MainApp.jsx"));
const backendAiText = loadText(path.join(repoRoot, "backend", "src", "ai.js"));
const backendCryptoText = loadText(path.join(repoRoot, "backend", "src", "crypto.js"));
const backendAppText = loadText(path.join(repoRoot, "backend", "src", "app.js"));
const deploymentText = loadText(path.join(repoRoot, "docs", "operations", "deployment.md"));

const techStack = {
  frontend: [
    `React ${versionOf(frontendPkg, "react")}`,
    `Vite ${versionOf(frontendPkg, "vite")}`,
    `lucide-react ${versionOf(frontendPkg, "lucide-react")}`,
  ],
  backend: [
    "Cloudflare Workers",
    "Cloudflare D1",
    `Wrangler ${versionOf(backendPkg, "wrangler")}`,
  ],
  auth: [
    hasPattern(authText, /accounts\.google\.com\/gsi\/client/) ? "Google Sign-In" : null,
    hasPattern(backendCryptoText, /PBKDF2/) ? "PBKDF2 password hashing" : null,
    hasPattern(backendAppText, /Bearer /) ? "Bearer token auth" : null,
  ].filter(Boolean),
  ai: [
    hasPattern(aiServiceText, /openrouter/i) ? "OpenRouter API" : null,
    hasPattern(backendAiText, /difficulty/i) ? "AI difficulty scoring" : null,
    hasPattern(taskListText, /generateCompanionMessage/) ? "NPC companion message generation" : null,
  ].filter(Boolean),
  browser: [
    hasPattern(taskInputText, /SpeechRecognition|webkitSpeechRecognition/) ? "SpeechRecognition" : null,
    hasPattern(notificationsText, /Notification/) ? "Notification API" : null,
    hasPattern(deploymentText, /same Cloudflare Worker/i) ? "Single-worker deploy" : null,
  ].filter(Boolean),
};

const facts = {
  summary: extractQuoteLine(readmeText, "RPG 風 UI のタスク管理アプリです。"),
  frontendStack: extractQuoteLine(readmeText, "- フロントエンド:"),
  backendStack: extractQuoteLine(readmeText, "- バックエンド:"),
  authStack: extractQuoteLine(readmeText, "- 認証:"),
  dueAlert: hasPattern(mainAppText, /期限のタスクがあります/),
  loginBonus: hasPattern(mainAppText, /daily_login/),
  keepaliveBonus: hasPattern(mainAppText, /session_keepalive/),
};

function createPpt() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "OpenAI Codex";
  pptx.company = "Mock";
  pptx.subject = "RPG-themed product presentation";
  pptx.title = "クエストマネージャー 5分発表資料";
  pptx.lang = "ja-JP";
  pptx.theme = {
    headFontFace: "Yu Gothic",
    bodyFontFace: "Yu Gothic",
    lang: "ja-JP",
  };
  return pptx;
}

function addBackdrop(slide, title, subtitle) {
  slide.background = { color: colors.bg };
  slide.addShape(SHAPE.rect, {
    x: 0, y: 0, w: page.w, h: page.h,
    fill: { color: colors.bg },
    line: { color: colors.bg },
  });
  slide.addShape(SHAPE.rect, {
    x: 0, y: 0, w: page.w, h: 0.6,
    fill: { color: colors.bgAlt, transparency: 12 },
    line: { color: colors.bgAlt },
  });
  slide.addShape(SHAPE.arc, {
    x: 9.6, y: -1.4, w: 4.4, h: 3.8,
    fill: { color: "23325F", transparency: 15 },
    line: { color: "23325F", transparency: 100 },
  });
  slide.addShape(SHAPE.chevron, {
    x: 11.8, y: 5.9, w: 0.9, h: 0.55,
    rotate: 180,
    fill: { color: colors.gold, transparency: 18 },
    line: { color: colors.gold, transparency: 100 },
  });
  slide.addText(title, {
    x: 0.65, y: 0.42, w: 7.6, h: 0.45,
    fontFace: "Yu Gothic",
    fontSize: 23,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  slide.addText(subtitle, {
    x: 0.67, y: 0.9, w: 7.4, h: 0.28,
    fontFace: "Yu Gothic",
    fontSize: 9.5,
    color: colors.textMuted,
    margin: 0,
  });
  slide.addText("5 min pitch", {
    x: 11.45, y: 0.3, w: 1.2, h: 0.25,
    align: "right",
    fontSize: 9,
    color: colors.blue,
    margin: 0,
  });
}

function addPanel(slide, opts) {
  slide.addShape(SHAPE.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    rectRadius: 0.08,
    fill: { color: opts.fill || colors.panel, transparency: opts.transparency ?? 3 },
    line: { color: opts.line || colors.line, pt: 1.2 },
  });
}

function addBulletList(slide, items, x, y, w, h, options = {}) {
  const runs = [];
  for (const item of items) {
    runs.push({
      text: item,
      options: {
        bullet: { indent: 12 },
        hanging: 2,
        breakLine: true,
      },
    });
  }
  slide.addText(runs, {
    x, y, w, h,
    fontFace: "Yu Gothic",
    fontSize: options.fontSize || 17,
    color: options.color || colors.text,
    valign: "top",
    paraSpaceAfterPt: options.spaceAfter || 10,
    margin: 0.08,
    breakLine: false,
  });
}

function addTag(slide, text, x, y, w = 1.6) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h: 0.34,
    rectRadius: 0.06,
    fill: { color: colors.gold, transparency: 8 },
    line: { color: colors.goldSoft, pt: 1 },
  });
  slide.addText(text, {
    x: x + 0.08, y: y + 0.06, w: w - 0.16, h: 0.18,
    align: "center",
    fontSize: 9.5,
    bold: true,
    color: colors.bg,
    margin: 0,
  });
}

function addTimeline(slide, steps) {
  const startX = 0.9;
  const y = 1.9;
  const cardW = 2.28;
  steps.forEach((step, index) => {
    const x = startX + index * 2.35;
    addPanel(slide, { x, y, w: cardW, h: 3.8, fill: index % 2 === 0 ? colors.panel : colors.panelAlt });
    slide.addShape(SHAPE.ellipse, {
      x: x + 0.12, y: y + 0.16, w: 0.42, h: 0.42,
      fill: { color: colors.gold },
      line: { color: colors.goldSoft, pt: 1 },
    });
    slide.addText(String(index + 1).padStart(2, "0"), {
      x: x + 0.12, y: y + 0.21, w: 0.42, h: 0.16,
      align: "center",
      fontSize: 10,
      bold: true,
      color: colors.bg,
      margin: 0,
    });
    slide.addText(step.title, {
      x: x + 0.18, y: y + 0.72, w: 1.9, h: 0.55,
      align: "center",
      fontSize: 16,
      bold: true,
      color: colors.gold,
      margin: 0,
    });
    slide.addText(step.copy, {
      x: x + 0.18, y: y + 1.38, w: 1.9, h: 1.7,
      fontSize: 11.5,
      color: colors.text,
      valign: "mid",
      align: "center",
      margin: 0.02,
    });
    slide.addText(step.caption, {
      x: x + 0.18, y: y + 3.12, w: 1.9, h: 0.38,
      fontSize: 9.5,
      color: colors.blue,
      align: "center",
      margin: 0,
    });
  });
}

function buildSlides(pptx) {
  const slide1 = pptx.addSlide();
  addBackdrop(slide1, "クエストマネージャー", "日常タスクを、冒険として続けられる体験に変える");
  slide1.addShape(SHAPE.roundRect, {
    x: 0.7, y: 1.5, w: 7.45, h: 4.65,
    rectRadius: 0.08,
    fill: { color: colors.panelAlt, transparency: 5 },
    line: { color: colors.gold, pt: 1.2 },
  });
  slide1.addText("TASKS BECOME QUESTS", {
    x: 0.95, y: 1.88, w: 3.4, h: 0.34,
    fontSize: 14,
    bold: true,
    color: colors.blue,
    margin: 0,
  });
  slide1.addText("続かないタスク管理を\n経験値・レベル・ステージ変化で\n前進が見える冒険にする", {
    x: 0.95, y: 2.35, w: 4.9, h: 1.8,
    fontSize: 25,
    bold: true,
    color: colors.text,
    breakLine: true,
    margin: 0,
    valign: "mid",
  });
  slide1.addText(facts.summary, {
    x: 0.98, y: 4.4, w: 5.9, h: 0.85,
    fontSize: 12.5,
    color: colors.textMuted,
    margin: 0,
  });
  addTag(slide1, "5分で全体像", 0.95, 5.45, 1.65);
  addTag(slide1, "RPG演出重視", 2.75, 5.45, 1.8);
  addTag(slide1, "プロダクト中心", 4.75, 5.45, 1.85);
  addPanel(slide1, { x: 8.45, y: 1.45, w: 4.2, h: 4.75, fill: "17223F" });
  slide1.addText("冒険の報酬", {
    x: 8.8, y: 1.82, w: 2.1, h: 0.28,
    fontSize: 13,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide1, [
    "タスク完了で EXP を獲得",
    "レベルアップで達成感を強化",
    "ステージ変化で成長を可視化",
    "NPC メッセージで継続を後押し",
  ], 8.75, 2.25, 3.2, 2.6, { fontSize: 15 });
  slide1.addText("Pitch flow", {
    x: 8.8, y: 5.15, w: 1.2, h: 0.2,
    fontSize: 10,
    color: colors.blue,
    margin: 0,
  });
  slide1.addText("課題 → 体験 → 強み → 技術 → まとめ", {
    x: 8.8, y: 5.42, w: 3.1, h: 0.45,
    fontSize: 12.5,
    color: colors.text,
    margin: 0,
  });

  const slide2 = pptx.addSlide();
  addBackdrop(slide2, "Quest 1. なぜ必要か", "タスクが続かない原因を、RPGの言葉で再定義する");
  addPanel(slide2, { x: 0.75, y: 1.45, w: 5.9, h: 4.95, fill: "1B2549" });
  addPanel(slide2, { x: 6.95, y: 1.45, w: 5.65, h: 4.95, fill: "14203F" });
  slide2.addText("現実のタスク管理の課題", {
    x: 1.05, y: 1.82, w: 2.9, h: 0.32,
    fontSize: 17,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide2, [
    "進捗が数字だけで、前進の実感が薄い",
    "完了しても小さな達成感しか残らない",
    "期限や難易度の判断が後回しになりやすい",
    "続ける仕組みが弱く、習慣化しづらい",
  ], 1.02, 2.32, 5.0, 3.15, { fontSize: 16 });
  slide2.addText("RPGとして置き換える", {
    x: 7.25, y: 1.82, w: 2.4, h: 0.32,
    fontSize: 17,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide2, [
    "タスク = クエスト",
    "進捗 = EXP とレベル",
    "背景 = 冒険ステージの解放",
    "完了後 = 仲間からのメッセージ",
  ], 7.22, 2.32, 4.5, 2.7, { fontSize: 16 });
  slide2.addText("結果: やるべきことを、やりたくなる見た目に変える", {
    x: 7.23, y: 5.42, w: 4.7, h: 0.46,
    fontSize: 15,
    bold: true,
    color: colors.cyan,
    margin: 0,
  });

  const slide3 = pptx.addSlide();
  addBackdrop(slide3, "Quest 2. 体験の核", "入力から達成までを、1 本の冒険導線として設計");
  addTimeline(slide3, [
    {
      title: "ログイン",
      copy: "Google / ゲスト /\nメールで参加し\nすぐ冒険開始",
      caption: "入口のハードルを下げる",
    },
    {
      title: "依頼を受注",
      copy: "日本語タスクを入力\n期限も設定\n音声入力にも対応",
      caption: "入力の摩擦を減らす",
    },
    {
      title: "難易度判定",
      copy: "AI が難易度を補助\n手動でも調整可能\n報酬感を整える",
      caption: "クエスト価値を見える化",
    },
    {
      title: "達成演出",
      copy: "完了で EXP 獲得\nレベルアップ演出\nNPC が祝福する",
      caption: "継続の報酬を明確化",
    },
    {
      title: "世界が変わる",
      copy: "レベルに応じて\n冒険ステージが進み\n成長が画面に残る",
      caption: "前進を世界観で可視化",
    },
  ]);

  const slide4 = pptx.addSlide();
  addBackdrop(slide4, "Quest 3. デモで見せる強み", "短い発表でも映える要素を、機能ではなく体験価値で並べる");
  addPanel(slide4, { x: 0.75, y: 1.45, w: 4.0, h: 4.95, fill: colors.panel });
  addPanel(slide4, { x: 4.95, y: 1.45, w: 4.0, h: 4.95, fill: colors.panelAlt });
  addPanel(slide4, { x: 9.15, y: 1.45, w: 3.45, h: 4.95, fill: colors.panel });
  slide4.addText("続けやすさ", {
    x: 1.05, y: 1.8, w: 1.8, h: 0.3,
    fontSize: 17,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide4, [
    "音声入力でクエスト追加",
    "期限アラートで取りこぼしを防ぐ",
    facts.loginBonus ? "ログインボーナスで起動の動機を作る" : "起動直後に遊び始めやすい",
    facts.keepaliveBonus ? "継続ボーナスで集中時間を維持" : "継続しやすい導線",
  ], 1.0, 2.2, 3.1, 3.15, { fontSize: 15 });
  slide4.addText("達成感", {
    x: 5.25, y: 1.8, w: 1.4, h: 0.3,
    fontSize: 17,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide4, [
    "クエスト達成ポップアップ",
    "EXP 加算とレベルアップ演出",
    "ステージ背景の変化",
    "仲間キャラの祝福メッセージ",
  ], 5.2, 2.2, 3.0, 3.15, { fontSize: 15 });
  slide4.addText("運用性", {
    x: 9.45, y: 1.8, w: 1.2, h: 0.3,
    fontSize: 17,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide4, [
    "Google ログイン",
    "ゲストログイン",
    "状態フィルタ / 並び替え",
    "難易度・期限・進行度を一元管理",
  ], 9.4, 2.2, 2.55, 3.15, { fontSize: 14.5 });

  const slide5 = pptx.addSlide();
  addBackdrop(slide5, "Quest 4. 技術スタック", "README と実装本文から抽出した、今回の構成要素");
  addPanel(slide5, { x: 0.75, y: 1.35, w: 3.0, h: 2.2, fill: colors.panelAlt });
  addPanel(slide5, { x: 3.98, y: 1.35, w: 3.0, h: 2.2, fill: colors.panel });
  addPanel(slide5, { x: 7.21, y: 1.35, w: 2.45, h: 2.2, fill: colors.panelAlt });
  addPanel(slide5, { x: 9.89, y: 1.35, w: 2.7, h: 2.2, fill: colors.panel });
  addPanel(slide5, { x: 0.75, y: 3.8, w: 11.84, h: 2.45, fill: "182447" });
  slide5.addText("Frontend", {
    x: 0.98, y: 1.64, w: 1.4, h: 0.25,
    fontSize: 16,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide5, techStack.frontend, 0.95, 2.02, 2.45, 1.1, { fontSize: 14 });
  slide5.addText("Backend", {
    x: 4.22, y: 1.64, w: 1.3, h: 0.25,
    fontSize: 16,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide5, techStack.backend, 4.19, 2.02, 2.4, 1.1, { fontSize: 14 });
  slide5.addText("Auth", {
    x: 7.45, y: 1.64, w: 0.8, h: 0.25,
    fontSize: 16,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide5, techStack.auth, 7.42, 2.02, 1.9, 1.1, { fontSize: 13 });
  slide5.addText("AI / UX", {
    x: 10.13, y: 1.64, w: 1.0, h: 0.25,
    fontSize: 16,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide5, [...techStack.ai, ...techStack.browser], 10.1, 2.02, 2.05, 1.2, { fontSize: 12.5, spaceAfter: 7 });
  slide5.addText("抽出根拠", {
    x: 0.98, y: 4.08, w: 1.2, h: 0.24,
    fontSize: 15,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide5, [
    facts.frontendStack,
    facts.backendStack,
    facts.authStack,
    "本文実装: Google Sign-In, SpeechRecognition, Notification, OpenRouter, AI 難易度判定",
  ], 0.95, 4.45, 10.8, 1.3, { fontSize: 14.5 });

  const slide6 = pptx.addSlide();
  addBackdrop(slide6, "Final Quest. まとめ", "タスク管理を、義務ではなく前進の物語として見せる");
  addPanel(slide6, { x: 0.78, y: 1.4, w: 7.35, h: 4.95, fill: "1A274C" });
  addPanel(slide6, { x: 8.4, y: 1.4, w: 4.15, h: 4.95, fill: "13203D" });
  slide6.addText("このプロダクトが目指したもの", {
    x: 1.08, y: 1.82, w: 3.3, h: 0.32,
    fontSize: 18,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  slide6.addText("やるべきことを、\nやりたくなる冒険へ。", {
    x: 1.05, y: 2.28, w: 4.8, h: 1.4,
    fontSize: 26,
    bold: true,
    color: colors.text,
    breakLine: true,
    margin: 0,
  });
  addBulletList(slide6, [
    "RPG UI によって進捗の見え方を変える",
    "AI とブラウザ機能で入力と継続の負荷を下げる",
    "Cloudflare ベースで軽量に公開しやすい構成にする",
  ], 1.04, 4.12, 5.9, 1.55, { fontSize: 16 });
  slide6.addText("5分発表の締め", {
    x: 8.72, y: 1.82, w: 1.8, h: 0.3,
    fontSize: 17,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  addBulletList(slide6, [
    "課題は単なる管理ではなく継続",
    "解決策はクエスト化と成長演出",
    "見た目だけでなく認証・AI・通知まで実装",
  ], 8.7, 2.3, 3.0, 2.2, { fontSize: 15 });
  slide6.addText("THANK YOU", {
    x: 8.72, y: 5.3, w: 2.2, h: 0.4,
    fontSize: 22,
    bold: true,
    color: colors.cyan,
    margin: 0,
  });
}

async function main() {
  fs.mkdirSync(designDir, { recursive: true });
  const pptx = createPpt();
  buildSlides(pptx);
  await pptx.writeFile({ fileName: outputPath });
  console.log(`Created ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
