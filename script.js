// app.js
let minEval = Infinity;
for(let i=0;i<9;i++){
if(boardState[i]) continue;
boardState[i] = 'X';
const evalScore = minimax(boardState, depth+1, true, alpha, beta);
boardState[i] = null;
minEval = Math.min(minEval, evalScore);
beta = Math.min(beta, evalScore);
if(beta <= alpha) break;
}
return minEval;
}
}


function showCenterMessage(text, duration=1800){
centerMsg.textContent = text;
centerMsg.style.display = 'block';
centerMsg.style.color = config.textColor;
setTimeout(()=>{ centerMsg.style.display='none'; }, duration);
}


function updatePot(){
potImage.src = config.pots[currentPotIndex];
}


// restart
restartBtn.addEventListener('click', ()=>{
currentPotIndex = 0;
board = Array(9).fill(null);
playerTurn = true;
gameActive = true;
updatePot();
centerMsg.style.display='none';
});


// initialize
startCamera().then(()=>{
// once camera frames available, start main loop
video.addEventListener('loadeddata', ()=>{
// set canvas internal size based on computed CSS to keep resolution tidy
const rect = arCanvas.getBoundingClientRect();
arCanvas.width = Math.round(rect.width * 1); // keep 1:1 pixel ratio
arCanvas.height = Math.round(rect.height * 1);
detector.width = 300; detector.height = 300;
mainLoop();
});
});




// graceful fallback: if user wants to trigger detection manually (useful for debugging)


// Expose a debug function
window._debug = {
forceShow(){ visible=true; startGame(); },
forceHide(){ visible=false; stopGame(); }
};
