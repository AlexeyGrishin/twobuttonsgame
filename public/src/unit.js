const {TILE_SIZE, MOVE_STEPS, LEFT, RIGHT} = require('consts').Consts;
let {Animation} = require('animation');

class UnitState {


    constructor({x, y}, level, playAnimation) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.rx = TILE_SIZE*x;
        this.ry = TILE_SIZE*y;
        this.movement = null;
        this.direction = RIGHT;
        this.playAnimation = playAnimation || (()=>{});
        this.playAnimation("stand");
        this.blinking = 0;
    }

    restart() {
        Animation.add(this, {
            blinking: +Math.PI/15,
            after: () => this.blinking = 0
        }, 40)
    }

    move(dx) {
        if (this.movement) return;
        this.movement = {
            targetX: this.x + dx,
            targetY: this.y,
            steps: MOVE_STEPS,
            stepDx: UnitState._step(dx),
            stepDy: 0
        };
        this.playAnimation("walk");
        this.direction = dx > 0 ? RIGHT : LEFT;
    }

    static _step(delta, steps = MOVE_STEPS) {
        return TILE_SIZE * delta / steps;
    }

    fall(dx, dy) {
        if (this.movement) return;
        this.move(dx);
        this.movement.steps = MOVE_STEPS * 3 / 4;
        this.movement.after = () => {
            this.playAnimation("fall");
            this.movement = {
                targetX: this.x + dx,
                targetY: this.y + dy,
                steps: MOVE_STEPS / 4,
                stepDx: UnitState._step(dx),
                stepDy: UnitState._step(dy, MOVE_STEPS / 4)
            }
        }
    }

    //TODO: add fall. use full move, then full fall

    jump(dx, dy) {
        if (this.movement) return;
        this.movement = {
            targetX: this.x,
            targetY: this.y + dy,
            steps: MOVE_STEPS / 2,
            stepDx: 0,
            stepDy: UnitState._step(dy, MOVE_STEPS / 2),
            after: () => {
                this.playAnimation("walk");
                this.movement = {
                    targetX: this.x + dx,
                    targetY: this.y + dy,
                    steps: MOVE_STEPS / 2,
                    stepDx: UnitState._step(dx, MOVE_STEPS / 2),
                    stepDy: 0
                }
            }
        };
        this.playAnimation("jump");

    }

    update(ticks) {
        if (this.movement) {
            this.rx += this.movement.stepDx;
            this.ry += this.movement.stepDy;
            this.movement.steps--;
            if (this.movement.steps == 0) {
                let after = this.movement.after;
                if (after) {
                    this.movement = null;
                    after();
                } else {
                    this.x = this.movement.targetX;
                    this.y = this.movement.targetY;
                    this.rx = TILE_SIZE*this.x;
                    this.ry = TILE_SIZE*this.y;
                    this.movement = null;
                    this.playAnimation("stand");
                }
            }
        }
    }

}

exports.UnitState = UnitState;