class Brick {
    constructor(board, x, y, style) {
        let brick = document.createElement('div');
        this.x = x + 16; this.y = y + 8;
        brick.classList.add('brick');
        brick.classList.add(`brick-${style}`);
        brick.style.left = x + 'px';
        brick.style.top = y + 'px';
        board.appendChild(brick);
        this.el = brick;
    }
    checkTopCollision(x, y, newX, newY) {
        // console.log(newX, newY, this.x, this.y);
        if(newX >= this.x - 16 && newX <= this.x + 16 && newY >= this.y-8 && newY <=this.y+8)
            return true;
        return null;
    }

    destroy() {
        this.el.remove();
    }
}

class Track {
    constructor(board) {
        this.el = document.createElement('div');
        this.el.classList.add('track');
        board.appendChild(this.el);
        this.setPosition(0, 0)
    }

    setPosition(x, y) {
        console.log(x, y)
        this.x = x; this.y = y;

        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
    }

    moveTo(x, duration) {
        this.x = x;
        this.el.style.left = x+'px';
    }

    topCollision(x, y, newX, newY) {
        if(newX/0.75>= this.x - 32 && newX/0.75 <= this.x + 32 && newY/0.75 + 16>= this.y)
            return (newX/0.75 - (this.x-32))/64;
        return null;
    }
}

class Ball {
    constructor(board) {
        this.el = document.createElement('div');
        this.el.classList.add('ball');
        this.el.classList.add('ball-0');
        board.appendChild(this.el);
        console.log('hello');
        this.baseSpeed = 200;
    }

    setPosition(x, y) {
        this.x = x; this.y = y;
        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
    }

    letsFly(direction) {
        this.speedX = Math.sin(direction);
        this.speedY = -Math.cos(direction);
    }

    update(duration, timestamp) {
        let newX = this.x + duration * this.speedX * this.baseSpeed;
        let newY = this.y + duration * this.speedY * this.baseSpeed;

        this.setPosition(newX, newY);
    }
}

class Board {
    constructor(el, wall){
        this.el = document.querySelector(el);
        this.track = new Track(this.el);
        this.ball = new Ball(this.el);
        this.track.setPosition(200, 300);
        this.el.addEventListener('mousemove', event => this.handleEvent(event));
        this.el.addEventListener('click', event => this.handleEvent(event));
        this.mouseX = 200;
        this.state = 'HANDLED';
        this.bricks = [];
        this.buildWall(wall);
        this.lives = 0;this.updateLives(3);
        this.score = 0; this.updateScore(0);
    }

    updateLives(count) {
        this.lives = Math.max(0, this.lives + count);
        document.querySelector('#balls').innerHTML = '<i class="ball"></i>'.repeat(this.lives);
        if(this.lives == 0)
            document.querySelector('#gameover').classList.remove('hidden');
        return this.lives > 0;
    }

    updateScore(count) {
        this.score += count;
        document.querySelector('#score').innerText = 'Score: ' + this.score.toString().padStart(5, '0');
    }

    update(duration, timestamp) {
        this.track.moveTo(Math.max(Math.min(this.mouseX, 394), 32), duration);

        if(this.state == 'HANDLED')
            this.ball.setPosition(this.track.x*0.75, this.track.y*0.75 - 10);
        else if(this.state == 'FLYING') {
            let prevX = this.ball.x, prevY = this.ball.y;
            this.ball.update(duration, timestamp);
            let newX = this.ball.x, newY = this.ball.y;
            
            if(this.ball.y > 240) {
                this.state = 'HANDLED';
                return this.updateLives(-1);;
            }
        
            if(this.ball.x-4 < 0 || this.ball.x+4 > 320)
                this.ball.speedX *= -1;
            if(this.ball.y-4 < 0)
                this.ball.speedY *= -1;
            let col = this.track.topCollision(prevX, prevY, newX, newY);

            if(col != null) {
                // col = Math.pow(Math.abs(col-0.5), 0.25);
                // console.log(col);
                // if(col < 0.1 || col > 0.9)
                //     this.ball.speedX *= 2;
                this.ball.speedY *= -1;
            }

            for(let brick of this.bricks) {
                if(brick.checkTopCollision(prevX, prevY, newX, newY)) {
                    this.ball.speedY *= -1;
                    this.updateScore(+10);
                    brick.destroy();
                    const index = this.bricks.indexOf(brick);
                    if (index > -1) {
                        this.bricks.splice(index, 1);
                    }
                    break;
                }
            }
        }

        return true;
    }

    handleEvent(event) {
        // console.log(event)
        if(event.type == 'mousemove') {
            this.mouseX = event.offsetX / 1.5;
            return event.stopPropagation();
        } else
        if(event.type == 'click') {
            if(this.state == 'HANDLED') {
                console.log("Let's fly");
                let dir = (this.mouseX - 32)/(394-32); // ????
                const direction = -(0.5*dir - 0.25) * Math.PI;
                this.ball.letsFly(direction);
                this.state = 'FLYING';
            }
        }
    }

    buildWall(wall) {
        for(let y=0;y<4;y++)
            for(let x=0;x<10;x++) {
                const style = Math.floor(Math.random() * 7);
                const brick = new Brick(this.el, 32*x, 16*y, style);
                this.bricks.push(brick);
                // break;
            }

    }
}

function oninit(){
    console.log('Initializing');
    let board = new Board('div#board', [
        ' 11111 ',
        '2 2 2 2'
    ]);
    let lastTimestamp;

    const callback = function(timestamp) {
        let duration = (timestamp - lastTimestamp) / 1000.0;
        lastTimestamp = timestamp;

        if(board.update(duration, timestamp))
            window.requestAnimationFrame(callback);
    }

    window.requestAnimationFrame(callback);
}