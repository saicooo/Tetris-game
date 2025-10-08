// ======== GAME CONSTANTS ========
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

const SHAPES = [
    null,
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]], // J
    [[0,0,3], [3,3,3], [0,0,0]], // L
    [[4,4], [4,4]], // O
    [[0,5,5], [5,5,0], [0,0,0]], // S
    [[0,6,0], [6,6,6], [0,0,0]], // T
    [[7,7,0], [0,7,7], [0,0,0]]  // Z
];

// ======== TETRIS CLASS ========
class Tetris {
    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.player = {
            pos: {x: 0, y: 0},
            matrix: null,
            nextMatrix: null,
            score: 0,
            level: 1,
            lines: 0
        };
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.gameOver = false;
        this.paused = false;
        
        this.init();
    }
    
    createBoard() {
        return Array.from({length: ROWS}, () => Array(COLS).fill(0));
    }
    
    createPiece(type) {
        return SHAPES[type].map(row => [...row]);
    }
    
    collide(board, player) {
        const [matrix, pos] = [player.matrix, player.pos];
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0 && 
                    (board[y + pos.y] && 
                     board[y + pos.y][x + pos.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    playerMove(dir) {
        if (this.gameOver || this.paused) return;
        
        this.player.pos.x += dir;
        if (this.collide(this.board, this.player)) {
            this.player.pos.x -= dir;
        }
    }
    
    playerRotate() {
        if (this.gameOver || this.paused) return;
        
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate(this.player.matrix, 1);
        
        while (this.collide(this.board, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate(this.player.matrix, -1);
                this.player.pos.x = pos;
                return;
            }
        }
    }
    
    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < y; x++) {
                [
                    matrix[x][y],
                    matrix[y][x]
                ] = [
                    matrix[y][x],
                    matrix[x][y]
                ];
            }
        }
        
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }
    
    playerDrop() {
        if (this.gameOver || this.paused) return;
        
        this.player.pos.y++;
        if (this.collide(this.board, this.player)) {
            this.player.pos.y--;
            this.merge(this.board, this.player);
            this.playerReset();
            this.sweep();
            this.updateScore();
        }
        this.dropCounter = 0;
    }
    
    playerHardDrop() {
        if (this.gameOver || this.paused) return;
        
        while (!this.collide(this.board, this.player)) {
            this.player.pos.y++;
        }
        this.player.pos.y--;
        this.merge(this.board, this.player);
        this.playerReset();
        this.sweep();
        this.updateScore();
    }
    
    playerReset() {
        const pieces = 'IJLOSTZ';
        
        if (this.player.nextMatrix) {
            this.player.matrix = this.player.nextMatrix;
        } else {
            this.player.matrix = this.createPiece(Math.floor(Math.random() * pieces.length) + 1);
        }
        
        this.player.nextMatrix = this.createPiece(Math.floor(Math.random() * pieces.length) + 1);
        this.player.pos.y = 0;
        this.player.pos.x = (this.board[0].length / 2 | 0) - 
                           (this.player.matrix[0].length / 2 | 0);
        
        if (this.collide(this.board, this.player)) {
            this.gameOver = true;
            this.saveScore();
            setTimeout(() => {
                alert('The End! Your scrore :: ' + this.player.score);
                window.location.href = 'scores.html';
            }, 500);
        }
    }
    
    sweep() {
        let linesCleared = 0;
        outer: for (let y = this.board.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            linesCleared++;
            y++;
        }
        
        if (linesCleared > 0) {
            const linePoints = [40, 100, 300, 1200];
            this.player.score += linePoints[linesCleared - 1] * this.player.level;
            this.player.lines += linesCleared;
            
            this.player.level = Math.floor(this.player.lines / 10) + 1;
            this.dropInterval = 1000 - (this.player.level - 1) * 100;
            if (this.dropInterval < 100) this.dropInterval = 100;
            
            this.playSound('clear');
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.player.score;
        document.getElementById('level').textContent = this.player.level;
    }
    
    saveScore() {
        const username = localStorage.getItem('tetris.username') || 'Player';
        const scores = JSON.parse(localStorage.getItem('tetris.scores') || '[]');
        
        scores.push({
            name: username,
            score: this.player.score,
            level: this.player.level,
            date: new Date().toLocaleDateString()
        });
        
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > 10) scores.length = 10;
        
        localStorage.setItem('tetris.scores', JSON.stringify(scores));
    }
    
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'clear') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }
        } catch (e) {
            console.log("Audio not supported");
        }
    }
    
    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = COLORS[value];
                    this.ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 0.05;
                    this.ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.player.nextMatrix) {
            const offset = {
                x: (4 - this.player.nextMatrix[0].length) / 2,
                y: (4 - this.player.nextMatrix.length) / 2
            };
            
            this.drawNextMatrix(this.player.nextMatrix, offset);
        }
    }
    
    drawNextMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.nextCtx.fillStyle = COLORS[value];
                    this.nextCtx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    this.nextCtx.strokeStyle = '#000';
                    this.nextCtx.lineWidth = 0.05;
                    this.nextCtx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMatrix(this.board, {x: 0, y: 0});
        
        if (this.player.matrix) {
            this.drawMatrix(this.player.matrix, this.player.pos);
        }
        
        this.drawNextPiece();
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '1px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2 / BLOCK_SIZE, 
                            this.canvas.height / 2 / BLOCK_SIZE);
        }
    }
    
    update(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.paused && !this.gameOver) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.playerDrop();
            }
        }
        
        this.draw();
        requestAnimationFrame((time) => this.update(time));
    }
    
    setupControls() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                    this.playerMove(-1);
                    break;
                case 'ArrowRight':
                    this.playerMove(1);
                    break;
                case 'ArrowDown':
                    this.playerDrop();
                    break;
                case 'ArrowUp':
                    this.playerRotate();
                    break;
                case ' ':
                    this.playerHardDrop();
                    break;
                case 'p':
                case 'P':
                    this.paused = !this.paused;
                    document.getElementById('pause-btn').textContent = 
                        this.paused ? 'Continue' : 'Pause';
                    break;
            }
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.paused = !this.paused;
            document.getElementById('pause-btn').textContent = 
                this.paused ? 'Continue' : 'Pause';
        });
    }
    
    init() {
        document.getElementById('player-name').textContent = 
            localStorage.getItem('tetris.username') || 'Player';
        
        this.canvas.width = COLS * BLOCK_SIZE;
        this.canvas.height = ROWS * BLOCK_SIZE;
        this.nextCanvas.width = 4 * BLOCK_SIZE;
        this.nextCanvas.height = 4 * BLOCK_SIZE;
        
        this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
        this.nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);
        
        this.playerReset();
        this.updateScore();
        this.update();
        this.setupControls();
        
        console.log("🎮 Tetris game started successfully!");
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('game-canvas');
    const nextCanvas = document.getElementById('next-canvas');
    
    if (gameCanvas && nextCanvas) {
        new Tetris(gameCanvas, nextCanvas);
    } else {
        console.error(" Canvases not found! Check your HTML.");
    }
});