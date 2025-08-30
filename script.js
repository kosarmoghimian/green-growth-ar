const startBtn = document.getElementById("startBtn");
const welcomeScreen = document.getElementById("welcome-screen");
const gameContainer = document.getElementById("game-container");
const board = document.getElementById("board");
const cells = document.querySelectorAll(".cell");
const flowerImg = document.getElementById("flowerImg");
const finalMessage = document.getElementById("finalMessage");

let currentPlayer = "X";
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];
let flowerStage = 0;

startBtn.addEventListener("click", () => {
  welcomeScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  board.classList.remove("hidden");
  startCamera();
});

function startCamera() {
  const video = document.getElementById("camera");
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
  });
}

cells.forEach(cell => {
  cell.addEventListener("click", () => handleCellClick(cell));
});

function handleCellClick(cell) {
  const index = cell.getAttribute("data-index");
  if (gameState[index] !== "" || !gameActive) return;

  gameState[index] = currentPlayer;
  cell.textContent = currentPlayer;

  if (checkWin(currentPlayer)) {
    gameActive = false;
    if (currentPlayer === "X") {
      growFlower();
      setTimeout(nextLevel, 1000);
    }
  } else if (!gameState.includes("")) {
    resetBoard();
  } else {
    currentPlayer = "O";
    aiMove();
  }
}

function aiMove() {
  // هوش مصنوعی ساده ولی نه تصادفی کاملاً
  let move = findBestMove();
  gameState[move] = "O";
  cells[move].textContent = "O";

  if (checkWin("O")) {
    gameActive = false;
    resetBoard();
  } else {
    currentPlayer = "X";
  }
}

function findBestMove() {
  // دفاع و حمله: اول ببین میشه برد، بعد جلو برد حریف رو بگیر، بعد رندوم
  for (let i = 0; i < 9; i++) {
    if (gameState[i] === "") {
      gameState[i] = "O";
      if (checkWin("O")) {
        gameState[i] = "";
        return i;
      }
      gameState[i] = "";
    }
  }
  for (let i = 0; i < 9; i++) {
    if (gameState[i] === "") {
      gameState[i] = "X";
      if (checkWin("X")) {
        gameState[i] = "";
        return i;
      }
      gameState[i] = "";
    }
  }
  let emptyCells = gameState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function checkWin(player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(pattern => 
    pattern.every(index => gameState[index] === player)
  );
}

function resetBoard() {
  gameState = ["", "", "", "", "", "", "", "", ""];
  cells.forEach(c => c.textContent = "");
  gameActive = true;
  currentPlayer = "X";
}

function growFlower() {
  if (flowerStage < 3) {
    flowerStage++;
    flowerImg.src = `images/pot${flowerStage}.png`;
    flowerImg.classList.add("grow");
    setTimeout(() => flowerImg.classList.remove("grow"), 600);
  } else {
    finalMessage.classList.remove("hidden");
    board.classList.add("hidden");
  }
}

function nextLevel() {
  resetBoard();
}
