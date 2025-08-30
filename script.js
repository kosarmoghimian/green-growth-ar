@font-face {
  font-family: "Attiq";
  src: url("./assets/font/Attiq.ttf") format("truetype");
  font-display: swap;
}

:root{
  --stroke:#803214;               /* رنگ استروک خانه‌های دوز */
  --ink:#6f1b30;                  /* زرشکی مات برای متن */
  --ink-muted:#8c3a52;
  --bg-glass: rgba(255,255,255,0.06);
  --blur: 8px;
  --radius: 16px;
  --shadow: 0 10px 30px rgba(0,0,0,0.2);
}

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; height: 100%;
  font-family: "Attiq", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
  color: var(--ink);
  background: #000; /* پشت صحنه AR شفاف میشه، ولی تا قبلش مشکی */
}

/* عنوان بالای صفحه */
#app-header {
  position: fixed;
  top: env(safe-area-inset-top, 0); left: 0; right: 0;
  z-index: 20;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
#app-header h1{
  margin: 8px 12px;
  padding: 6px 12px;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 999px;
  font-size: 18px;
  line-height: 1;
  color: var(--ink);
  box-shadow: var(--shadow);
}

/* روت UI بازی که روی دوربین می‌شینه */
#ui-root{
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 15; /* بالاتر از صحنه AR */
  padding: 90px 16px 24px; /* جا برای هدر */
  pointer-events: none; /* فقط کامپوننت‌های داخلی کلیک‌پذیرن */
}
.hidden { display: none !important; }

#game-card{
  width: min(90vw, 520px);
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 14px;
  align-items: center;
  justify-items: center;
  background: transparent; /* بدون بک‌گراند */
  pointer-events: auto;
}

/* بخش گل و مرحله */
#plant-wrap{
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 12px;
}
#plant{
  width: 74px;
  height: auto;
  image-rendering: auto;
}
#stage-label{
  font-size: 14px;
  color: var(--ink-muted);
}

/* صفحه دوز */
#board{
  width: min(78vw, 400px);
  aspect-ratio: 1 / 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 0;
  touch-action: manipulation;
  user-select: none;
}

/* خانه‌ها: فقط استروک */
.cell{
  position: relative;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
}

/* Grid stroke با pseudo-border: خطوط بین خانه‌ها */
.cell::before,
.cell::after{
  content: "";
  position: absolute;
  background: var(--stroke);
  opacity: 1;
}

/* خطوط عمودی و افقی برای ایجاد استروک‌ها */
.cell[data-i="0"], .cell[data-i="1"], .cell[data-i="2"],
.cell[data-i="3"], .cell[data-i="4"], .cell[data-i="5"]{
  /* خط افقی پایین (به جز ردیف آخر) */
}
.cell[data-i="0"]::after, .cell[data-i="1"]::after, .cell[data-i="2"]::after,
.cell[data-i="3"]::after, .cell[data-i="4"]::after, .cell[data-i="5"]::after{
  height: 2px; width: 100%;
  left: 0; bottom: 0;
}
.cell[data-i="0"]::after, .cell[data-i="1"]::after, .cell[data-i="2"]::after,
.cell[data-i="3"]::after, .cell[data-i="4"]::after, .cell[data-i="5"]::after{
  background: var(--stroke);
}

/* خط عمودی راست (به جز ستون آخر) */
.cell[data-i="0"]::before, .cell[data-i="3"]::before, .cell[data-i="6"]::before,
.cell[data-i="1"]::before, .cell[data-i="4"]::before, .cell[data-i="7"]::before{
  width: 2px; height: 100%;
  right: 0; top: 0;
  background: var(--stroke);
}

/* SVG علامت‌ها X/O: بدون fill، فقط stroke */
.mark{
  position: absolute; inset: 8%;
  width: 84%; height: 84%;
  pointer-events: none;
}
.mark svg{
  width: 100%; height: 100%;
  display: block;
}
.mark svg *{
  fill: none;
  stroke: var(--stroke);
  stroke-width: 10;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* پیام وضعیت و کنترل‌ها */
#message{
  min-height: 24px;
  font-size: 15px;
  text-align: center;
}

#controls{
  width: 100%;
  display: flex;
  justify-content: center;
}
#reset-btn{
  font: inherit;
  background: var(--bg-glass);
  color: var(--ink);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 8px 14px;
  box-shadow: var(--shadow);
}

/* دکمه پایین بازی کوچکتر از خود صفحه بازی است (مطابق خواسته) */
#reset-btn { transform: scale(0.92); }

/* مودال تبریک */
#modal{
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,0.35);
  z-index: 30;
}
#modal .modal-content{
  background: rgba(255,255,255,0.9);
  color: var(--ink);
  padding: 18px 16px;
  border-radius: var(--radius);
  width: min(86vw, 360px);
  text-align: center;
  box-shadow: var(--shadow);
}
#modal button{
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.08);
  background: white;
  color: var(--ink);
}
