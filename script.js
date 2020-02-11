// score counter
var score = 0;

// if game is lost
var gameLost = false;

// module responsible for movement and pause
const playerController = {
    left: false,
    right: false,
    up: false,
    keyListener: function (event) {
        var keyState = (event.type == 'keydown') ? true : false;
        switch (event.keyCode) {
            case 37:
                // left arrow, go left
                playerController.left = keyState;
                break;
            case 38:
                // right arrow, go right
                playerController.up = keyState;
                break;
            case 39:
                // up arrow, jump
                playerController.right = keyState;
                break;
            case 27:
                // ESC key, stop the game
                if (!keyState) return;
                if (gameController.gameEnabled && gameLost == false) {
                    // pause
                    this.canvas = document.getElementById('canvas');
                    this.ctx = this.canvas.getContext('2d');
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Paused',canvas.width/2,300);
                    this.ctx.fillText('Press the \'ESC\' to resume',canvas.width/2,350);
                    this.ctx.fillText("Press the \'spacebar\' to restart the game",canvas.width/2,400);
                    gameController.gameEnabled = false;
                    renderer.stopRenderingEngine();
                } else if (gameController.gameEnabled == false && gameLost == false) {
                    // unpause
                    gameController.gameEnabled = true;
                    renderer.startRenderingEngine();
                }
            case 32:
                // Spacebar key, reload the game
                if (gameController.gameEnabled == false) {
                    location.reload();
                }
                break;
        }
    }
};

// game controller
const gameController = {
    // config
    gameLoopTime: 20,
    flakesCount: 1,
    flakes: [],
    // state
    gameEnabled: false,
    gameLoop: null,

    createFlake: function () {
        // create a flake
        if(this.flakesCount < 20){
            const flake = {
                x: Math.round(Math.random() * 640),
                y: 0,
                r: Math.round(Math.random() * 10 + 5),
                d: Math.round(Math.random() + 1)
            };
            this.flakes.push(flake);
            this.flakesCount++;
        }   
    },
    // game state triggers
    startGame: function () {
        // load the game
        this.loopTime = 20;
        // set input handlers
        window.addEventListener('keydown', playerController.keyListener);
        window.addEventListener('keyup', playerController.keyListener);
        // start rendering
        this.gameEnabled = true;
        this.gameLoop = setInterval(function () {
            this.playerControls();
            this.physics();
            this.collisions();
        }.bind(this), this.gameLoopTime);
        renderer.startRenderingEngine();
        // start flakes generator
        this.flakesGenerator = setInterval(function() {
            this.createFlake();
        }.bind(this), 3000);
        // count the score
        setInterval(function (){
            if(this.gameEnabled == true){
                score = score + 10;
            }
       }.bind(this), 1000);          
    },
    endGame: function () {
        // unload the game
        // remove input handlers
        window.removeEventListener('keydown');
        window.removeEventListener('keyup');
        // stop rendering
        this.gameStarted = false;
        renderer.stopRenderingEngine();
        this.rendererEnabled = false;
    },
    // player
    player: {
        width: 36,
        height: 36,
        jumping: true,
        x: 290,
        y: 600,
        x_velocity: 0.5,
        y_velocity: 0.5
    },
    // player controller
    playerControls: function () {
        if (playerController.up && !this.player.jumping) {
            this.player.y_velocity -= 15;
            this.player.jumping = true;
        }

        if (playerController.left) {
            this.player.x_velocity -= 0.5;
        }

        if (playerController.right) {
            this.player.x_velocity += 0.5;
        }
    },
    // physics
    physics: function () {
        if (this.gameEnabled) {
            // player gravity
            this.player.y_velocity += 0.5;
            this.player.x += this.player.x_velocity;
            this.player.y += this.player.y_velocity;
            this.player.x_velocity *= 0.9;
            this.player.y_velocity *= 0.9;

            // check the vertical position
            if (this.player.y > 764 - 16 - 36) {
                this.player.jumping = false;
                this.player.y = 764 - 16 - 36;
                this.player.y_velocity = 0;
            }

            // check the horizontal position
            if (this.player.x < -36) {
                this.player.x = 640;
            } else if (this.player.x > 640) {
                this.player.x = -36;
            }
        }
    },
    // collisions
    collisions: function() {
        const playerBoundingBox = {
            startX: this.player.x,
            startY: this.player.y,
            endX: this.player.x + this.player.width,
            endY: this.player.y + this.player.height
        };
        for (var i = 0; i < this.flakesCount; i++) {
            // check collisions
            const flake = this.flakes[i];
            if (
                flake !== undefined
                && (flake.x >= playerBoundingBox.startX && flake.x <= playerBoundingBox.endX)
                && (flake.y >= playerBoundingBox.startY && flake.y <= playerBoundingBox.endY)
                ) {
                    // player touches the flake
                    if(gameController.gameEnabled == true){
                        gameLost = true;
                        renderer.renderLostGame();
                    }                
                    gameController.gameEnabled = false;
                    renderer.stopRenderingEngine();
                }
        }
    }
}



// renderer
const renderer = {
    enabled: false,
    ctx: null,
    flakes: null,
    theme: {
        pauseBackgroundColor: '#121212',
        backgroundColor: '#202020',
        floorColor: '#202830',
        playerColor: '#ff0000',
        flakesColor: '#CC00FF'
    },
    // start and stop rendering
    startRenderingEngine: function () {
        // get canvas
        this.canvas = document.getElementById('canvas');
        this.canvas.width = 640;
        this.canvas.height = 800;
        this.ctx = this.canvas.getContext('2d');
        // start rendering
        this.enabled = true;
        this.render();
    },
    stopRenderingEngine: function () {
        // stop rendering
        this.enabled = false;
    },
    // flakes
    renderFlakes: function () {
        // render flakes
        this.ctx.fillStyle = this.theme.flakesColor;
        this.ctx.beginPath();
        for (var i = 0; i < gameController.flakes.length; i++) {
            const flake = gameController.flakes[i];
            this.ctx.moveTo(flake.x, flake.y);
            this.ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2, true);
        }
        this.ctx.fill();
        this.moveFlakes();
    },
    moveFlakes: function () {   
        // move flake
        for (var i = 0; i < gameController.flakes.length; i++) {
            gameController.flakes[i].y += Math.pow(gameController.flakes[i].d, 2) + 2 - 0.1;
            if (gameController.flakes[i].y > 800){
                gameController.flakes[i].y = 0;
                gameController.flakes[i].x = Math.round(Math.random() * 640);
                gameController.flakes[i].r = Math.round(Math.random() * 10 + 5);
                gameController.flakes[i].d = Math.round(Math.random() + 1);
            }
        }
    },
    // game area
    renderBackground: function () {
        this.ctx.fillStyle = this.theme.backgroundColor;
        this.ctx.fillRect(0, 0, 640, 800);
    },
    renderFloor: function () {
        // render floor
        this.ctx.strokeStyle = this.theme.floorColor;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 754);
        this.ctx.lineTo(640, 754);
        this.ctx.stroke();
    },
    renderGameArea: function () {
        // render background and floor
        this.renderBackground();
        this.renderFloor();
        this.renderFlakes();
    },
    renderPlayer: function () {
        // render player
        this.ctx.fillStyle = this.theme.playerColor;
        this.ctx.beginPath();
        this.ctx.rect(
            gameController.player.x,
            gameController.player.y,
            gameController.player.width,
            gameController.player.height
        );
        this.ctx.fill();
    },
    renderScore: function () {
        // render the score display
        this.ctx.textAlign = 'center'
        this.ctx.fillStyle = "white";
        this.ctx.font = "22px Arial";
        this.ctx.fillText("Score " + score, canvas.width/2, 50);
    },
    renderLostGame: function () {
        // render the text after collision with the flake
        gameIsOn = false;
        this.ctx.textAlign = "center";
        this.ctx.fillText("You lost!", canvas.width/2, 300);
        this.ctx.fillText("Your score is: " + score, canvas.width/2, 350);
        this.ctx.fillText("Press the button below to try again", canvas.width/2, 400);
        this.ctx.fillText("or", canvas.width/2, 450);
        this.ctx.fillText("Press the \'spacebar\' to restart the game", canvas.width/2, 500);
    },
    render: function () {
        // check if game is turned on
        if (this.enabled) {
            // clear the screen before rendering a frame
            this.ctx.clearRect(0, 0, 640, 800);
            // render the game
            this.renderGameArea();
            this.renderPlayer();
            this.renderFlakes();
            this.renderScore();
            // wait for next frame
            window.requestAnimationFrame(renderer.render.bind(this));
        }
    }
}

window.onload = function () {
    gameController.startGame();
}

// reload page
function RestartGame() {
    location.reload();
}

window.addEventListener('keydown', playerController.keyListener);
window.addEventListener('keyup', playerController.keyListener);