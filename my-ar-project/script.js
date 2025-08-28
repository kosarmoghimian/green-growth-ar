/* script.js — جامع و توضیح‌دار
   وظایف:
   - مدیریت دکمهٔ شروع
   - مدیریت targetFound / targetLost (MindAR)
   - نمایش/مخفی کردن گلدان و بازی دوز
   - منطق بازی دوز با AI (مینیمکس + کمی تصادف)
   - تضمین مربع بودن خانه‌ها برای مرورگرهای قدیمی
   - حالت تست آفلاین (force show)
*/

document.addEventListener('DOMContentLoaded', () => {
  // عناصر اصلی UI
  const startBtn = document.getElementById('start-btn');
  const forceShowBtn = document.getElementById('force-show-btn');
  const startScreen = document.getElementById('start-screen');
  const gameWrapper = document.getElementById('game-wrapper');
  const centerOverlay = document.getElementById('center-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayAction = document.getElementById('overlay-action');
  const statusMsg = document.getElementById('status-msg');
  const pkgTarget = document.getElementById('pkgTarget'); // a-entity target
  const arPlant = document.getElementById('ar-plant'); // a-image plant
  const boardEl = document.getElementById('game-board');
  const restartBtn = document.getElementById('restart-btn');
  const bottomDrawMsg = document.getElementById('bottom-draw-msg');

  // حالتها
  let gameStarted = false;      // آیا کاربر دکمه "شروع" را زده؟
  let targetVisible = false;    // آیا تارگت الان شناسایی شده؟
  let offlineForceShow = false; // حالت تست بدون تارگت

  // بازی دوز: وضعیت
  let board = Array(9).fill('');
  let plantStage = 1; // 1..4
  const maxPlantStage = 4;

  // الگوهای برد
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  /* --- توابع UI --- */
  function showStatus(text, timeout=2500) {
    statusMsg.textContent = text;
    statusMsg.classList.remove('status-hidden');
    if (timeout>0) setTimeout(()=>statusMsg.classList.add('status-hidden'), timeout);
  }

  function showOverlay(text, btnText, onClick) {
    overlayText.textContent = text;
    overlayAction.textContent = btnText;
    overlayAction.onclick = () => { hideOverlay(); if (onClick) onClick(); };
    centerOverlay.classList.remove('hidden');
  }
  function hideOverlay(){ centerOverlay.classList.add('hidden'); }

  function showGameUI() {
    gameWrapper.classList.remove('hidden');
    // render board and enforce square cells
    renderBoard();
    forceSquareCells();
  }
  function hideGameUI() {
    gameWrapper.classList.add('hidden');
  }

  /* --- ساخت و رندر برد دوز --- */
  function renderBoard() {
    boardEl.innerHTML = '';
    board.forEach((cell, i) => {
      const el = document.createElement('div');
      el.className = 'cell';
      el.textContent = cell;
      el.setAttribute('data-index', i);
      el.addEventListener('click', ()=> onPlayerMove(i));
      boardEl.appendChild(el);
    });
    forceSquareCells();
  }

  function setBoardEnabled(enabled) {
    [...boardEl.children].forEach(c => {
      if (enabled) c.classList.remove('disabled');
      else c.classList.add('disabled');
    });
  }

  function checkWin(b, p) {
    return winPatterns.some(pat => pat.every(i => b[i] === p));
  }
  function isFull(b) { return b.every(c => c !== ''); }

  function growPlant() {
    if (plantStage < maxPlantStage) {
      plantStage++;
      // آپدیت تصویر گلدان در صحنه AR
      arPlant.setAttribute('src', `#pot${plantStage}`);
      // اگر در حالت آفلاین نمایش تصویر HTML هم داشته باشی میتونی اینجا آپدیت کنی
    }
  }

  /* --- هوش مصنوعی (مینیمکس + هیوریستیک + نویز) --- */
  function aiBestMove() {
    const me = 'O', hu = 'X';

    function scoreState(b, depth) {
      if (checkWin(b, me)) return 10 - depth;
      if (checkWin(b, hu)) return depth - 10;
      return 0;
    }
    const center = [4], corners=[0,2,6,8], edges=[1,3,5,7];
    function hBonus(i){ if (center.includes(i)) return 3; if (corners.includes(i)) return 2; if (edges.includes(i)) return 1; return 0; }

    function minimax(b, depth, isMax) {
      if (checkWin(b, me) || checkWin(b, hu) || isFull(b)) return {score: scoreState(b, depth), move:-1};
      const avail = b.map((v,i)=> v===''? i : null).filter(v=>v!==null);
      if (isMax) {
        let best = {score:-Infinity, move:-1};
        for (const i of avail) {
          b[i]=me;
          const res=minimax(b, depth+1, false);
          b[i]='';
          const cand = res.score + 0.05*hBonus(i);
          if (cand > best.score) best = {score:cand, move:i};
        }
        return best;
      } else {
        let best = {score:Infinity, move:-1};
        for (const i of avail) {
          b[i]=hu;
          const res=minimax(b, depth+1, true);
          b[i]='';
          const cand = res.score - 0.05*hBonus(i);
          if (cand < best.score) best = {score:cand, move:i};
        }
        return best;
      }
    }

    const avail = board.map((v,i)=> v===''? i : null).filter(v=>v!==null);
    if (avail.length === 0) return null;
    let ranked = [];
    for (const i of avail) {
      const clone = board.slice();
      clone[i]='O';
      const res = minimax(clone, 0, false);
      ranked.push({move:i, score:res.score});
    }
    ranked.sort((a,b)=> b.score - a.score);
    const rnd = Math.random();
    if (ranked.length>1 && rnd < 0.25) return ranked[Math.random()<0.5?0:1].move;
    return ranked[0].move;
  }

  /* --- حرکت بازیکن و AI --- */
  let currentPlayer = 'X';
  let gameOver = false;

  function onPlayerMove(i) {
    if (gameOver) return;
    if (!targetVisible && !offlineForceShow) {
      showStatus('ابتدا تصویر را شناسایی کنید.');
      return;
    }
    if (board[i] !== '') return;
    board[i] = currentPlayer;
    renderBoard();
    if (checkWin(board, 'X')) {
      gameOver = true;
      growPlant();
      showOverlay('بردی! 🌱', 'مرحله بعد', () => { resetBoard(); });
      return;
    }
    if (isFull(board)) {
      gameOver = true;
      bottomDrawMsg.textContent = 'مساوی شدید';
      showOverlay('مساوی شد', 'شروع مجدد', () => resetBoard());
      return;
    }

    // AI move (با کمی تاخیر طبیعی)
    setBoardEnabled(false);
    setTimeout(()=> {
      const move = aiBestMove();
      if (move !== null) {
        board[move] = 'O';
        renderBoard();
      }
      if (checkWin(board, 'O')) {
        gameOver = true;
        showOverlay('باختی! دوباره امتحان کنید', 'دوباره امتحان کنید', ()=> resetBoard());
        setBoardEnabled(false);
        return;
      }
      if (isFull(board)) {
        gameOver = true;
        bottomDrawMsg.textContent = 'مساوی شدید';
        showOverlay('مساوی شد', 'شروع مجدد', ()=> resetBoard());
        return;
      }
      setBoardEnabled(true);
    }, 220);
  }

  function resetBoard() {
    board = Array(9).fill('');
    gameOver = false;
    currentPlayer = 'X';
    bottomDrawMsg.textContent = '';
    renderBoard();
    setBoardEnabled(true);
  }

  /* --- تضمین مربع بودن خانه‌ها در مرورگرهای قدیمی --- */
  function forceSquareCells() {
    const cells = boardEl.querySelectorAll('.cell');
    if (!cells.length) return;
    cells.forEach(cell => {
      const w = cell.offsetWidth;
      cell.style.height = w + 'px';
    });
  }
  window.addEventListener('resize', ()=> forceSquareCells());

  /* --- رویدادهای دکمه‌ها --- */
  startBtn.addEventListener('click', ()=> {
    gameStarted = true;
    startScreen.classList.add('hidden');
    showStatus('حالا دوربین را روی تصویر بگیر تا بازی فعال شود.', 3500);
    // اگر تارگت از قبل visible است، بلافاصله UI را نشان بده
    if (targetVisible || offlineForceShow) showGameUI();
  });

  forceShowBtn.addEventListener('click', ()=> {
    offlineForceShow = !offlineForceShow;
    if (offlineForceShow) {
      // حالت تست: نمایش فوری گلدان و بازی بدون نیاز به تارگت
      arPlant.setAttribute('visible', 'true');
      targetVisible = true;
      showStatus('حالت تست فعال شد (بدون تارگت).');
      if (gameStarted) showGameUI();
    } else {
      arPlant.setAttribute('visible', 'false');
      targetVisible = false;
      showStatus('حالت تست غیرفعال شد.');
      if (!targetVisible) hideGameUI();
    }
  });

  restartBtn.addEventListener('click', ()=> resetBoard());

  /* --- اتصال به رویدادهای MindAR --- */
  // توجه: رویدادها روی خود عنصر تارگت (a-entity) شنیده می‌شوند.
  if (pkgTarget) {
    pkgTarget.addEventListener('targetFound', () => {
      console.log('Target Found event');
      targetVisible = true;
      arPlant.setAttribute('visible', 'true');
      // اگر کاربر بازی را آغاز کرده باشد، UI بازی نشان داده شود
      if (gameStarted) showGameUI();
    });
    pkgTarget.addEventListener('targetLost', () => {
      console.log('Target Lost event');
      targetVisible = false;
      arPlant.setAttribute('visible', 'false');
      // وقتی تارگت از دست رفت، بازی مخفی شود
      if (!offlineForceShow) hideGameUI();
    });
  } else {
    console.warn('pkgTarget element not found. مطمئن شوید id="pkgTarget" در index.html موجود است.');
  }

  /* --- مقداردهی اولیه UI --- */
  hideGameUI();
  hideOverlay();
  resetBoard();

  // اگر می‌خواهی برای توسعه سریع بدون بارگیری MindAR، حالت فرضی فعال شود می‌توانی اینجا true بزنی:
  // offlineForceShow = false; // پیش‌فرض false
});
