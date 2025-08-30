/* ==========================
   AR: toggle UI on targetFound / targetLost
========================== */
const uiRoot = document.getElementById('ui-root');
const marker = document.getElementById('marker');
const modal = document.getElementById('modal');
const modalNext = document.getElementById('modal-next');
const messageBox = document.getElementById('message');
const plantImg = document.getElementById('plant');
const stageLabel = document.getElementById('stage-label');
const resetBtn = document.getElementById('reset-btn');
const boardEl = document.getElementById('board');

let stage = 1; // 1..4
const plantPaths = [
  './assets/image/pot1.png',
  './assets/image/pot2.png',
  './assets/image/pot3.png',
  './assets/image/pot4.png',
];

/* وقتی تارگت شناسایی شد، بازی ظاهر شود */
marker.addEventListener('targetFound', () => {
  uiRoot.classList.remove('hidden');
  uiRoot.setAttribute('aria-hidden', 'false');
});

/* وقتی تارگت گم شد، UI پنهان می‌شود (دوربین باز می‌ماند) */
marker.addEventListener('targetLost', () => {
  uiRoot.classList.add('hidden');
  uiRoot.setAttribute('aria-hidden', 'true');
});

/* ==========================
   Tic-Tac-Toe with smart AI (Minimax + spice)
========================== */
const HUMAN = 'X';
const AI = 'O';

let board, isHumanTurn, gameOver, winner;

function initBoard(){
  board = Array(9).fill(null);
  isHumanTurn = true;   // بازیکن شروع می‌کند
  gameOver = false;
  winner = null;
  messageBox.textContent = 'نوبت توست';
  renderBoard();
}

function renderBoard(){
  boardEl.innerHTML = '';
  for(let i=0; i<9; i++){
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('data-i', i);

    // SVG علامت
    const mark = document.createElement('div');
    mark.className = 'mark';

    if(board[i] === 'X'){
      mark.innerHTML = `
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <line x1="18" y1="18" x2="82" y2="82"></line>
          <line x1="82" y1="18" x2="18" y2="82"></line>
        </svg>
      `;
    } else if(board[i] === 'O'){
      mark.innerHTML = `
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="32"></circle>
        </svg>
      `;
    }

    btn.appendChild(mark);
    btn.addEventListener('click', () => onCell(i), {passive:true});
    boardEl.appendChild(btn);
  }
}

function onCell(i){
  if(gameOver || board[i]) return;
  if(!isHumanTurn) return;

  board[i] = HUMAN;
  isHumanTurn = false;
  renderBoard();

  const state = evaluateState(board);
  if(state.terminal){
    endGame(state.winner);
    return;
  }

  // حرکت هوش مصنوعی کمی بعد از حرکت کاربر (طبیعی‌تر)
  setTimeout(() => {
    const aiMove = pickBestMove(board);
    if(aiMove != null){
      board[aiMove] = AI;
    }
    renderBoard();

    const after = evaluateState(board);
    if(after.terminal){
      endGame(after.winner);
    } else {
      isHumanTurn = true;
      messageBox.textContent = 'نوبت توست';
    }
  }, 180);
}

function evaluateState(b){
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for(const [a,b2,c] of lines){
    if(b[a] && b[a]===b[b2] && b[a]===b[c]){
      return { terminal:true, winner: b[a] };
    }
  }
  if(b.every(v => v)) return { terminal:true, winner: 'D' };
  return { terminal:false, winner:null };
}

/* Minimax با کمی تصادفی‌سازی برای تنوع حرکت‌ها */
function pickBestMove(b){
  // گاهی (کم) از بهترین حرکت کمی انحراف می‌کنیم تا طبیعی شود
  const available = b.map((v,i)=> v?null:i).filter(v=>v!==null);

  // اگر حرکت برد مستقیم داریم، اولویت بده
  for(const i of available){
    b[i] = AI;
    if(evaluateState(b).winner === AI){ b[i]=null; return i; }
    b[i] = null;
  }
  // اگر حریف برد مستقیم دارد، بلاک کن
  for(const i of available){
    b[i] = HUMAN;
    if(evaluateState(b).winner === HUMAN){ b[i]=null; return i; }
    b[i] = null;
  }

  // Minimax کامل
  let bestScore = -Infinity;
  let bestMoves = [];
  for(const i of available){
    b[i] = AI;
    const score = minimax(b, false, 0, -Infinity, Infinity);
    b[i] = null;
    if(score > bestScore){
      bestScore = score;
      bestMoves = [i];
    } else if(score === bestScore){
      bestMoves.push(i);
    }
  }

  // انتخاب از بین بهترین‌ها + کمی ادویه برای تنوع
  if(bestMoves.length === 0) return available[0] ?? null;
  if(Math.random() < 0.25){ // 25% شانس انتخاب حرکت خوب ولی نه لزوماً بهترین
    const nonBest = available.filter(i => !bestMoves.includes(i));
    if(nonBest.length) return nonBest[Math.floor(Math.random()*nonBest.length)];
  }
  return bestMoves[Math.floor(Math.random()*bestMoves.length)];
}

function minimax(b, isMaximizing, depth, alpha, beta){
  const state = evaluateState(b);
  if(state.terminal){
    if(state.winner === AI) return 10 - depth;
    if(state.winner === HUMAN) return depth - 10;
    return 0;
  }
  const avail = b.map((v,i)=> v?null:i).filter(v=>v!==null);

  if(isMaximizing){
    let maxEval = -Infinity;
    for(const i of avail){
      b[i] = AI;
      const evalScore = minimax(b, false, depth+1, alpha, beta);
      b[i] = null;
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if(beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(const i of avail){
      b[i] = HUMAN;
      const evalScore = minimax(b, true, depth+1, alpha, beta);
      b[i] = null;
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if(beta <= alpha) break;
    }
    return minEval;
  }
}

function endGame(w){
  gameOver = true;
  winner = w;
  if(w === HUMAN){
    messageBox.textContent = 'بردی! 👏';
    // نمایش مودال تبریک و رفتن به مرحله بعد
    showWinModal();
  } else if(w === AI){
    messageBox.textContent = 'باختی؛ دوباره امتحان کن.';
    // مرحله تغییر نکند
  } else {
    messageBox.textContent = 'مساوی شد.';
  }
}

/* مودال برد */
function showWinModal(){
  modal.classList.remove('hidden');
  modalNext.focus();
}
modalNext.addEventListener('click', () => {
  modal.classList.add('hidden');
  advanceStage();
  initBoard();
});

/* پیشروی مرحله و رشد گل؛ فقط در صورت برد */
function advanceStage(){
  if(stage < 4){
    stage += 1;
    plantImg.src = plantPaths[stage-1];
    stageLabel.textContent = `مرحله ${stage} / ۴`;
  } else {
    // تکمیل گل
    congratAllDone();
  }
}

function congratAllDone(){
  // پیام وسط صفحه
  modal.classList.remove('hidden');
  document.getElementById('modal-title').textContent = 'تبریک! 🎉';
  document.getElementById('modal-text').textContent = 'گل کامل شد و هر چهار مرحله را رد کردی.';
  modalNext.textContent = 'شروع دوباره';
  modalNext.onclick = () => {
    modal.classList.add('hidden');
    // ریست کلی مراحل و گل
    stage = 1;
    plantImg.src = plantPaths[0];
    stageLabel.textContent = `مرحله ${stage} / ۴`;
    // بازگرداندن متن مودال به حالت اولیه
    document.getElementById('modal-title').textContent = 'تبریک!';
    document.getElementById('modal-text').textContent = 'مرحله بعد آماده‌ست.';
    modalNext.textContent = 'باشه';
    modalNext.onclick = () => {
      modal.classList.add('hidden');
      advanceStage();
      initBoard();
    };
    initBoard();
  };
}

/* کنترل‌ها */
resetBtn.addEventListener('click', () => {
  initBoard();
});

/* شروع اولیه */
initBoard();
