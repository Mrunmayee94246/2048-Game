let tiles = [];
let score = 0;
let paused = false;

const game = document.getElementById("game");
const scoreEl = document.getElementById("score");
const achievementEl = document.getElementById("achievement");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");

const restartBtn = document.getElementById("restartBtn");
const resumeBtn = document.getElementById("resumeBtn");

/* SOUND FIX (FINAL) */
let soundEnabled = false;

window.addEventListener("click", () => {
    soundEnabled = true;

    // unlock audio (VERY IMPORTANT)
    moveSound.play().then(() => {
        moveSound.pause();
        moveSound.currentTime = 0;
    }).catch(()=>{});

}, { once: true });

const moveSound = new Audio("sound/move.mp3");
const mergeSound = new Audio("sound/merge.mp3");

function playMove(){
    if(!soundEnabled) return;

    moveSound.currentTime = 0;
    moveSound.play().catch(()=>{});
}

function playMerge(){
    if(!soundEnabled) return;

    mergeSound.currentTime = 0;
    mergeSound.play().catch(()=>{});
}
/* TILE CLASS */
class Tile{
    constructor(v,r,c){
        this.value=v; this.r=r; this.c=c;
        this.merged=false;
    }
}

/* START */
function startGame(){
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameContainer").classList.remove("hidden");
    restart();
}

/* SAVE */
function saveGame(){
    localStorage.setItem("tiles",JSON.stringify(tiles));
    localStorage.setItem("score",score);
}

function loadGame(){
    let t=localStorage.getItem("tiles");
    if(!t) return;

    tiles=JSON.parse(t);
    score=parseInt(localStorage.getItem("score"));

    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameContainer").classList.remove("hidden");

    draw();
}

/* DRAW */
function draw(){
    game.innerHTML="";

    for(let r=0;r<4;r++)
        for(let c=0;c<4;c++){
            let cell=document.createElement("div");
            cell.className="cell";
            cell.style.left=c*85+"px";
            cell.style.top=r*85+"px";
            game.appendChild(cell);
        }

    tiles.forEach(t=>{
        let div=document.createElement("div");
        div.className="tile tile-"+t.value;
        div.textContent=t.value;

        div.style.transform=`translate(${t.c*85}px,${t.r*85}px)`;

        if(t.merged){
            div.classList.add("merge");
            showScorePop(t.value,t.r,t.c);
            t.merged=false;
        }

        game.appendChild(div);
    });

    scoreEl.textContent=score;
    updateAchievement();
    saveGame();
}

/* SCORE POP */
function showScorePop(val,r,c){
    let pop=document.createElement("div");
    pop.className="score-pop";
    pop.textContent="+"+val;
    pop.style.left=c*85+"px";
    pop.style.top=r*85+"px";
    game.appendChild(pop);

    setTimeout(()=>pop.remove(),600);
}

let bestTile = localStorage.getItem("bestTile") || 0;

function updateAchievement(){
    let currentMax = Math.max(...tiles.map(t=>t.value),0);

    if(currentMax > bestTile){
        bestTile = currentMax;
        localStorage.setItem("bestTile", bestTile);
        achievementEl.textContent = "🎉 New: " + bestTile;
    } else {
        achievementEl.textContent = "Best: " + bestTile;
    }
}
/* SPAWN */
function spawn(){
    let empty=[];
    for(let r=0;r<4;r++)
        for(let c=0;c<4;c++)
            if(!tiles.find(t=>t.r===r&&t.c===c))
                empty.push({r,c});

    if(empty.length===0) return;

    let s=empty[Math.floor(Math.random()*empty.length)];
    tiles.push(new Tile(Math.random()>0.9?4:2,s.r,s.c));
}

/* MOVE */
function move(dir){
    if(paused) return;

    let moved=false;

    let sort={
        left:(a,b)=>a.c-b.c,
        right:(a,b)=>b.c-a.c,
        up:(a,b)=>a.r-b.r,
        down:(a,b)=>b.r-a.r
    };

    tiles.sort(sort[dir]);

    tiles.forEach(t=>{
        let dr=dir==="down"?1:dir==="up"?-1:0;
        let dc=dir==="right"?1:dir==="left"?-1:0;

        while(true){
            let nr=t.r+dr, nc=t.c+dc;

            if(nr<0||nr>3||nc<0||nc>3) break;

            let other=tiles.find(o=>o.r===nr&&o.c===nc);

            if(!other){
                t.r=nr; t.c=nc; moved=true;
            }
            else if(other.value===t.value && !other.merged){
                other.value*=2;
                other.merged=true;
                score+=other.value;
                playMerge();

                tiles=tiles.filter(x=>x!==t);
                moved=true;
                break;
            } else break;
        }
    });

    if(moved){
        playMove();
        setTimeout(()=>{
            spawn();
            draw();
            checkGame();
        },120);
    }
}

/* GAME CHECK */
function canMove(){
    for(let t of tiles){
        let dirs=[[0,1],[1,0]];
        for(let d of dirs){
            let r=t.r+d[0], c=t.c+d[1];
            let o=tiles.find(x=>x.r===r&&x.c===c);
            if(o && o.value===t.value) return true;
        }
    }
    return false;
}

function checkGame(){
    if(tiles.length===16 && !canMove()){
        showOverlay("Game Over","gameover");
    }
}

/* OVERLAY */
function showOverlay(msg,type){
    paused=true;
    message.textContent=msg;
    overlay.style.display="flex";

    if(type==="gameover"){
        restartBtn.style.display="block";
        resumeBtn.style.display="none";
    } else {
        restartBtn.style.display="block";
        resumeBtn.style.display="block";
    }
}

function pauseGame(){
    showOverlay("Paused","pause");
}

function resume(){
    paused=false;
    overlay.style.display="none";
}

function restart(){
    tiles=[];
    score=0;
    paused=false;
    overlay.style.display="none";
    spawn(); spawn();
    draw();
}

/* CONTROLS */
document.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft") move("left");
    if(e.key==="ArrowRight") move("right");
    if(e.key==="ArrowUp") move("up");
    if(e.key==="ArrowDown") move("down");
});