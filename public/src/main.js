var gamejs = require('gamejs');
var animate = require('gamejs/animate');
var audio = require('gamejs/audio');
var {Font} = require('gamejs/font');
let {Animation} = require('animation');
let graphics = require('gamejs/graphics');

let {UnitState} = require('unit');
let {LevelState} = require('level');
let {HintState} = require('hints');

const {TILE_SIZE, MOVE_STEPS, LEFT, RIGHT} = require('consts').Consts;

const levels = require('levels').levels;


class GameState {
    constructor() {
        this.stage = "begin";
        this.levelIdx = 0;
        this.hints = new HintState();
        this.playMusic = true;
        this.restart();
    }

    hasEnemyOn(x,y) {
        return this.enemies.filter((e) => e.x == x && e.y == y ).length > 0;
    }

    next() {
        this.levelIdx++;
        if (this.levelIdx < levels.length) {
            this.stage = "level";
            this.restart();
        }
        else {
            this.stage = "end";
        }
    }

    restart(dead = false) {
        this.level = new LevelState(levels[this.levelIdx].map);
        this.hints = new HintState(levels[this.levelIdx].hints);
        this.hero = new UnitState(this.level.startPosition, this.level, (anim) => {
                Animations.hero.green.start(anim);
                Animations.hero.blue.start(anim);
            }
        );
        if (dead) this.hero.restart();
        this.enemies = this.level.enemies.map((enemy) => {
            return new UnitState(enemy, this.level, (anim) => {
                if (anim != "stand") {
                    Animations.enemy.start(this.level.active);
                } else {
                    Animations.enemy.start("stand");
                }
            });
        });
        if (this.sound) {
            this.sound.stop();
            this.sound = null;
        }
        if (levels[this.levelIdx].music) {
            this.sound = new audio.Sound(levels[this.levelIdx].music);
            this.sound.setVolume(this.playMusic ? 1 : 0);
            this.sound.play(true);
        }
        pressed = {}

    }

    update(ms) {
        this.hero.update();
        this.enemies.forEach((e) => e.update());
        this.hints.update(this.hero, this.level, ms, this);
        for (let enemy of this.enemies) {
            if (Math.abs(enemy.rx - this.hero.rx) < TILE_SIZE/2 && enemy.ry == this.hero.ry) {
                Sounds.denied.play();
                this.restart(true);
                return;
            }
        }
    }

    moveEnemies(dx, layer) {
        let targets = [];
        for (let enemy of this.enemies) {
            let target = this.level.canWalk(enemy.x, enemy.y, enemy.x + dx, enemy.y, layer, true);
            if (!target && layer != this.level.active) return false;
            targets.push(target);
        }
        this.enemies.forEach((enemy, i) => {
            let target = targets[i];
            if (!target) return;
            enemy[target.action](target.x - enemy.x, target.y - enemy.y);
        });
        return true;
    }

    move(dx) {
        let direction = dx > 0 ? RIGHT : LEFT;
        let layer = dx > 0 ? "blue" : "green";
        let tx = this.hero.x + dx, ty = this.hero.y;
        let target = this.level.canWalk(this.hero.x, this.hero.y, tx, ty, layer);
        if (target && this.moveEnemies(-dx, layer)) {
            let {diamond, exit, lock} = this.level.getObject(target.x, target.y);
            if (lock) {
                Sounds.denied.play();
                //beep
                return;
            }
            this.hero[target.action](target.x - this.hero.x, target.y - this.hero.y);
            Sounds[target.action].play();
            this.level.swapInto(layer);

            if (diamond) {
                let lockToRemove = this.level.locks.filter(({lock}) => lock == layer)[0];
                if (lockToRemove) {
                    this.level.remove(diamond);
                    this.level.remove(lockToRemove);
                    Sounds.diamond.play();
                }
            }
            if (exit) {
                this.next();
            }
        } else {
            Sounds.denied.play();
        }
    }

    toggleMusic() {
        if (this.playMusic) {
            this.sound.setVolume(0);
            this.playMusic = false;
        } else {
            this.sound.setVolume(1);
            this.playMusic = true;
        }
    }
}

function createBg(nr) {
    let bg = new animate.SpriteSheet(gamejs.image.load('./data/bg.png'), {width: 32, height: 32});
    let bgface = new graphics.Surface(TILE_SIZE*20 + 10, TILE_SIZE*20 + 10);
    for (var i = 0; i < 21; i++) {
        for (var j = 0; j < 21; j++) {
            bgface.blit(bg.get(nr), [i*TILE_SIZE, j*TILE_SIZE]);
        }
    }
    bgface.setAlpha(0.8);
    return bgface;
}

var Sounds = {
    denied: "./data/denied.wav",
    diamond: "./data/diamond.wav",
    done: "./data/done.wav",
    fall: "./data/down.wav",
    jump: "./data/up.wav",
    move: "./data/step.wav"
};

var Animations = {
    hero: {
        green: 'green',
        blue: 'blue'
    },
    enemy: 'enemy'
};

class SoundWrapper {
    constructor(path) {
        this.sound = new gamejs.audio.Sound(path);
        this.playing = false;
    }

    play() {
        if (this.playing) return;
        this.playing = true;
        setTimeout(() => this.playing = false, this.sound.getLength()*1000);
        return this.sound.play();
    }

    stop() {
        this.playing = true;
        return this.sound.stop();
    }

    setVolume(v) {
        this.sound.setVolume(v);
    }
}

function range(n) {
    let r = [];
    for (let i = 0; i < n; i++) {
        r.push(i);
    }
    return r;
}

function loadDiamond(type) {
    let anim = new animate.Animation(
        new animate.SpriteSheet(gamejs.image.load(`./data/${type} diamond.png`), {width: 32, height: 32}),
        "normal",
        {
            normal: {
                frames: range(28),
                rate: 12,
                loop: true
            }
        }
    );
    anim.start("normal");
    return anim;
}

function loadHero(type) {
    return new animate.Animation(
        new animate.SpriteSheet(gamejs.image.load(`./data/${type}.png`), {width: 32, height: 32}),
        "stand",
        {
            //stand: {frames: [0], rate: 0, loop: true},
            stand: {frames: [0,1,2,3,2,1], rate: 24, loop: true},
            walk: {frames: range(9), rate: 48, loop: true},
            jump: {frames: [0, 1, 2, 3, 4], rate: 24},
            fall: {frames: [5, 6, 7, 8], rate: 24}
        }
    );
}

function loadEnemy(type) {
    return new animate.Animation(
        new animate.SpriteSheet(gamejs.image.load(`./data/${type}.png`), {width: 32, height: 32}),
        "stand",
        {
            stand: {frames: range(10), rate: 6, loop: true},
            blue: {frames: range(10), rate: 24, loop: true},
            green: {frames: range(10).reverse(), rate: 24, loop: true}
        }
    );

}
let pressed = {};


gamejs.preload([
    './data/maze-blue.png', './data/maze-green.png', './data/objects.png', './data/bg.png',
    './data/blue.png', './data/green.png', './data/blue diamond.png', './data/green diamond.png',
    './data/enemy.png'
]);
gamejs.preload(levels.map((l) => l.music).filter((m) => m));
gamejs.preload(Object.keys(Sounds).map((k) => Sounds[k]));
gamejs.ready(() => {
    gamejs.display.setCaption('2mazes');

    for (let k in Sounds) {
        Sounds[k] = new SoundWrapper(Sounds[k]);
        Sounds[k].setVolume(0.4);
    }

    let backgrounds = {
        blue: createBg(0),
        green: createBg(1),
    };
    Animations.hero.green = loadHero('green');
    Animations.hero.blue = loadHero('blue');
    Animations.enemy = loadEnemy('enemy');

    let display = gamejs.display.getSurface();
    let game = new GameState();
    gamejs.event.onKeyDown(function(e) {
        pressed[e.key] = true;
        if (e.key === gamejs.event.K_r) {
            game.restart(true);
        }
        if (e.key === gamejs.event.K_s) {
            game.toggleMusic();
        }
    });
    gamejs.event.onKeyUp(function(e) {
        pressed[e.key] = false;
    });

    const DIAMONDS = {
        blue: loadDiamond('blue'),
        green: loadDiamond('green')
    };

    gamejs.onTick(function(msDuration) {
        if (pressed[gamejs.event.K_RIGHT]) {
            game.move(+1);
        }
        if (pressed[gamejs.event.K_LEFT]) {
            game.move(-1);
        }
        Animation.update();
        display.clear();
        DIAMONDS.blue.update(msDuration);
        DIAMONDS.green.update(msDuration);
        Animations.hero.green.update(msDuration);
        Animations.hero.blue.update(msDuration);
        Animations.enemy.update(msDuration);
        switch (game.stage) {
            case "begin":
            case "level": {
                game.update(msDuration);
                drawLevel(game.level);
                drawHero(game.hero, game.level);
                game.enemies.forEach((e) => drawEnemy(e, game.level));
                drawHints();
                break;
            }
            case "end": {
                //show something
            }
        }
    });

    const SHIFT = {
        blue: [0,0],
        green: [10,-10]
    };
    const COLOR = {
        blue: "#094664",
        green: "#1d6409"
    };


    let hintFont = new Font("12px Verdana");

    function drawHints() {
        for (let hint of game.hints.hintsToShow) {
            //render on top
            let floatingY = Math.round(Math.sin((game.hints.hintJumping / 20)) * 2);
            let x,y;
            if (hint.hx !== undefined) {
                x = hint.hx * TILE_SIZE + TILE_SIZE / 2;
                y = hint.hy * TILE_SIZE + floatingY;
            } else {
                x = game.hero.rx + TILE_SIZE / 2;
                y = game.hero.ry + floatingY;
            }
            let width = Math.max(...hint.hint.map((l) => hintFont.size(l)[0]));
            let lineHeight = hintFont.size(hint.hint[0])[1];
            let height = lineHeight * hint.hint.length;
            let arrowSize = 10;
            let pad = 5;
            let shift = SHIFT[game.level.active];
            let rect = new gamejs.Rect(shift[0] + x - width / 2 - pad, shift[1] + y - height - arrowSize - 2 * pad, width + 2 * pad, height + 2 * pad);
            let arrow = [[shift[0] + x, shift[1] + y], [shift[0] + x + arrowSize / 2, shift[1] + y - arrowSize - 1], [shift[0] + x - arrowSize / 2, shift[1] + y - arrowSize - 1]];
            graphics.rect(display, COLOR[game.level.active], rect);
            graphics.polygon(display, COLOR[game.level.active], arrow);
            hint.hint.forEach((line, i) => {
                blit(hintFont.render(line, "#fff"), [x - width / 2, y - height - arrowSize - pad + i * lineHeight]);
            });
        }

    }

    function blit(surface, pos) {
        let shift = SHIFT[game.level.active];
        pos[0] += shift[0];
        pos[1] += shift[1];
        display.blit(surface, pos);
    }

    function drawTile(surface, tile, level) {
        let pos = [tile.rx, tile.ry];
        blit(surface, pos);
    }

    function drawTiles(tileFn, tiles, level) {
        tiles.forEach((tile) => drawTile(tileFn(tile), tile, level))
    }

    function drawLevel(state) {
        display.blit(backgrounds[state.active]);
        for (let layer of [state.inactive, state.active]) {
            display.blit(state.mazeView(layer).surface, SHIFT[layer]);
        }
        for (let diamond of state.diamonds) {
            blit(DIAMONDS[state.active].image, [diamond.rx, diamond.ry])
        }
        drawTiles(()=>OBJECTS.get(game.stage == 'level' ? 8 : 9), state.exits, state);
        drawTiles((lock)=>OBJECTS.get(lock.lock == "blue" ? 6 : 7), state.locks, state);
    }

    const OBJECTS = new animate.SpriteSheet(gamejs.image.load('./data/objects.png'), {width: 32, height: 32});

    function drawHero(state, levelState) {
        let img = Animations.hero[levelState.active].image;
        img.setAlpha(Math.abs(Math.sin(state.blinking)));
        blit(img, [state.rx, state.ry]);
    }

    function drawEnemy(state, levelState) {
        blit(Animations.enemy.image, [state.rx, state.ry]);
    }


});