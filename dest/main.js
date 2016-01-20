'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var gamejs = require('gamejs');
var animate = require('gamejs/animate');
var audio = require('gamejs/audio');

var _require = require('gamejs/font');

var Font = _require.Font;

var _require2 = require('animation');

var Animation = _require2.Animation;

var graphics = require('gamejs/graphics');

var _require3 = require('unit');

var UnitState = _require3.UnitState;

var _require4 = require('level');

var LevelState = _require4.LevelState;

var _require5 = require('hints');

var HintState = _require5.HintState;

var _require$Consts = require('consts').Consts;

var TILE_SIZE = _require$Consts.TILE_SIZE;
var MOVE_STEPS = _require$Consts.MOVE_STEPS;
var LEFT = _require$Consts.LEFT;
var RIGHT = _require$Consts.RIGHT;

var levels = require('levels').levels;

var GameState = function () {
    function GameState() {
        _classCallCheck(this, GameState);

        this.stage = "begin";
        this.levelIdx = 0;
        this.hints = new HintState();
        this.playMusic = true;
        this.restart();
    }

    _createClass(GameState, [{
        key: 'hasEnemyOn',
        value: function hasEnemyOn(x, y) {
            return this.enemies.filter(function (e) {
                return e.x == x && e.y == y;
            }).length > 0;
        }
    }, {
        key: 'next',
        value: function next() {
            this.levelIdx++;
            if (this.levelIdx < levels.length) {
                this.stage = "level";
                this.restart();
            } else {
                this.stage = "end";
            }
        }
    }, {
        key: 'restart',
        value: function restart() {
            var _this = this;

            var dead = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            this.level = new LevelState(levels[this.levelIdx].map);
            this.hints = new HintState(levels[this.levelIdx].hints);
            this.hero = new UnitState(this.level.startPosition, this.level, function (anim) {
                if (_this.heroFalling && anim == "stand") {
                    Sounds.fall.play();
                }
                _this.heroFalling = anim == "fall";
                Animations.hero.green.start(anim);
                Animations.hero.blue.start(anim);
            });
            if (dead) this.hero.restart();
            this.enemies = this.level.enemies.map(function (enemy) {
                return new UnitState(enemy, _this.level, function (anim) {
                    if (anim != "stand") {
                        Animations.enemy.start(_this.level.active);
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
            pressed = {};
        }
    }, {
        key: 'update',
        value: function update(ms) {
            this.hero.update();
            this.enemies.forEach(function (e) {
                return e.update();
            });
            this.hints.update(this.hero, this.level, ms, this);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.enemies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var enemy = _step.value;

                    if (Math.abs(enemy.rx - this.hero.rx) < TILE_SIZE / 2 && enemy.ry == this.hero.ry) {
                        Sounds.denied.play();
                        this.restart(true);
                        return;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: 'moveEnemies',
        value: function moveEnemies(dx, layer) {
            var targets = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.enemies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var enemy = _step2.value;

                    var target = this.level.canWalk(enemy.x, enemy.y, enemy.x + dx, enemy.y, layer, true);
                    if (!target && layer != this.level.active) return false;
                    targets.push(target);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this.enemies.forEach(function (enemy, i) {
                var target = targets[i];
                if (!target) return;
                enemy[target.action](target.x - enemy.x, target.y - enemy.y);
            });
            return true;
        }
    }, {
        key: 'move',
        value: function move(dx) {
            var direction = dx > 0 ? RIGHT : LEFT;
            var layer = dx > 0 ? "blue" : "green";
            var tx = this.hero.x + dx,
                ty = this.hero.y;
            var target = this.level.canWalk(this.hero.x, this.hero.y, tx, ty, layer);
            if (target && this.moveEnemies(-dx, layer)) {
                var _level$getObject = this.level.getObject(target.x, target.y);

                var diamond = _level$getObject.diamond;
                var exit = _level$getObject.exit;
                var lock = _level$getObject.lock;

                if (lock) {
                    Sounds.denied.play();
                    //beep
                    return;
                }
                this.hero[target.action](target.x - this.hero.x, target.y - this.hero.y);
                //Sounds[target.action].play();
                this.level.swapInto(layer);

                if (diamond) {
                    var lockToRemove = this.level.locks.filter(function (_ref) {
                        var lock = _ref.lock;
                        return lock == layer;
                    })[0];
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
    }, {
        key: 'toggleMusic',
        value: function toggleMusic() {
            if (this.playMusic) {
                this.sound.setVolume(0);
                this.playMusic = false;
            } else {
                this.sound.setVolume(1);
                this.playMusic = true;
            }
        }
    }]);

    return GameState;
}();

function createBg(nr) {
    var bg = new animate.SpriteSheet(gamejs.image.load('./data/bg.png'), { width: 32, height: 32 });
    var bgface = new graphics.Surface(TILE_SIZE * 20 + 10, TILE_SIZE * 20 + 10);
    for (var i = 0; i < 21; i++) {
        for (var j = 0; j < 21; j++) {
            bgface.blit(bg.get(nr), [i * TILE_SIZE, j * TILE_SIZE]);
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

var SoundWrapper = function () {
    function SoundWrapper(path) {
        _classCallCheck(this, SoundWrapper);

        this.sound = new gamejs.audio.Sound(path);
        this.playing = false;
    }

    _createClass(SoundWrapper, [{
        key: 'play',
        value: function play() {
            var _this2 = this;

            if (this.playing) return;
            this.playing = true;
            setTimeout(function () {
                return _this2.playing = false;
            }, this.sound.getLength() * 1000);
            return this.sound.play();
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.playing = true;
            return this.sound.stop();
        }
    }, {
        key: 'setVolume',
        value: function setVolume(v) {
            this.sound.setVolume(v);
        }
    }]);

    return SoundWrapper;
}();

function range(n) {
    var r = [];
    for (var i = 0; i < n; i++) {
        r.push(i);
    }
    return r;
}

function loadDiamond(type) {
    var anim = new animate.Animation(new animate.SpriteSheet(gamejs.image.load('./data/' + type + ' diamond.png'), { width: 32, height: 32 }), "normal", {
        normal: {
            frames: range(28),
            rate: 12,
            loop: true
        }
    });
    anim.start("normal");
    return anim;
}

animate.Animation.prototype.updateSounded = function (ms) {
    this.update(ms);
    var spec = this.spec[this.currentAnimation];
    if (spec && spec.sound && spec.soundOn == this.currentFrame) {
        spec.sound.play();
    }
};

function loadHero(type) {
    return new animate.Animation(new animate.SpriteSheet(gamejs.image.load('./data/' + type + '.png'), { width: 32, height: 32 }), "stand", {
        stand: { frames: [0, 1, 2, 3, 2, 1], rate: 24, loop: true, sound: Sounds.move },
        walk: { frames: range(9), rate: 48, loop: true, sound: Sounds.move, soundOn: 0 },
        jump: { frames: [0, 1, 2, 3, 4], rate: 48, sound: Sounds.jump, soundOn: 0 },
        fall: { frames: [5, 6, 7, 8], rate: 48 }
    });
}

function loadEnemy(type) {
    return new animate.Animation(new animate.SpriteSheet(gamejs.image.load('./data/' + type + '.png'), { width: 32, height: 32 }), "stand", {
        stand: { frames: range(10), rate: 6, loop: true },
        blue: { frames: range(10), rate: 24, loop: true },
        green: { frames: range(10).reverse(), rate: 24, loop: true }
    });
}
var pressed = {};

gamejs.preload(['./data/maze-blue.png', './data/maze-green.png', './data/objects.png', './data/bg.png', './data/blue.png', './data/green.png', './data/blue diamond.png', './data/green diamond.png', './data/enemy.png']);
gamejs.preload(levels.map(function (l) {
    return l.music;
}).filter(function (m) {
    return m;
}));
gamejs.preload(Object.keys(Sounds).map(function (k) {
    return Sounds[k];
}));
gamejs.ready(function () {
    gamejs.display.setCaption('2mazes');

    for (var k in Sounds) {
        Sounds[k] = new SoundWrapper(Sounds[k]);
        Sounds[k].setVolume(0.4);
    }

    var backgrounds = {
        blue: createBg(0),
        green: createBg(1)
    };
    Animations.hero.green = loadHero('green');
    Animations.hero.blue = loadHero('blue');
    Animations.enemy = loadEnemy('enemy');

    var display = gamejs.display.getSurface();
    var game = new GameState();
    gamejs.event.onKeyDown(function (e) {
        pressed[e.key] = true;
        if (e.key === gamejs.event.K_r) {
            game.restart(true);
        }
        if (e.key === gamejs.event.K_s) {
            game.toggleMusic();
        }
    });
    gamejs.event.onKeyUp(function (e) {
        pressed[e.key] = false;
    });

    var DIAMONDS = {
        blue: loadDiamond('blue'),
        green: loadDiamond('green')
    };

    gamejs.onTick(function (msDuration) {
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
        Animations.hero.green.updateSounded(msDuration);
        Animations.hero.blue.updateSounded(msDuration);
        Animations.enemy.updateSounded(msDuration);
        switch (game.stage) {
            case "begin":
            case "level":
                {
                    game.update(msDuration);
                    drawLevel(game.level);
                    drawHero(game.hero, game.level);
                    game.enemies.forEach(function (e) {
                        return drawEnemy(e, game.level);
                    });
                    drawHints();
                    break;
                }
            case "end":
                {
                    //show something
                }
        }
    });

    var SHIFT = {
        blue: [0, 0],
        green: [10, -10]
    };
    var COLOR = {
        blue: "#094664",
        green: "#1d6409"
    };

    var hintFont = new Font("12px Verdana");

    function drawHints() {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            var _loop = function _loop() {
                var _Math;

                var hint = _step3.value;

                //render on top
                var floatingY = Math.round(Math.sin(game.hints.hintJumping / 20) * 2);
                var x = undefined,
                    y = undefined;
                if (hint.hx !== undefined) {
                    x = hint.hx * TILE_SIZE + TILE_SIZE / 2;
                    y = hint.hy * TILE_SIZE + floatingY;
                } else {
                    x = game.hero.rx + TILE_SIZE / 2;
                    y = game.hero.ry + floatingY;
                }
                var width = (_Math = Math).max.apply(_Math, _toConsumableArray(hint.hint.map(function (l) {
                    return hintFont.size(l)[0];
                })));
                var lineHeight = hintFont.size(hint.hint[0])[1];
                var height = lineHeight * hint.hint.length;
                var arrowSize = 10;
                var pad = 5;
                var shift = SHIFT[game.level.active];
                var rect = new gamejs.Rect(shift[0] + x - width / 2 - pad, shift[1] + y - height - arrowSize - 2 * pad, width + 2 * pad, height + 2 * pad);
                var arrow = [[shift[0] + x, shift[1] + y], [shift[0] + x + arrowSize / 2, shift[1] + y - arrowSize - 1], [shift[0] + x - arrowSize / 2, shift[1] + y - arrowSize - 1]];
                graphics.rect(display, COLOR[game.level.active], rect);
                graphics.polygon(display, COLOR[game.level.active], arrow);
                hint.hint.forEach(function (line, i) {
                    blit(hintFont.render(line, "#fff"), [x - width / 2, y - height - arrowSize - pad + i * lineHeight]);
                });
            };

            for (var _iterator3 = game.hints.hintsToShow[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                _loop();
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }
    }

    function blit(surface, pos) {
        var shift = SHIFT[game.level.active];
        pos[0] += shift[0];
        pos[1] += shift[1];
        display.blit(surface, pos);
    }

    function drawTile(surface, tile, level) {
        var pos = [tile.rx, tile.ry];
        blit(surface, pos);
    }

    function drawTiles(tileFn, tiles, level) {
        tiles.forEach(function (tile) {
            return drawTile(tileFn(tile), tile, level);
        });
    }

    function drawLevel(state) {
        display.blit(backgrounds[state.active]);
        var _arr = [state.inactive, state.active];
        for (var _i = 0; _i < _arr.length; _i++) {
            var layer = _arr[_i];
            display.blit(state.mazeView(layer).surface, SHIFT[layer]);
        }
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = state.diamonds[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var diamond = _step4.value;

                blit(DIAMONDS[state.active].image, [diamond.rx, diamond.ry]);
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        drawTiles(function () {
            return OBJECTS.get(game.stage == 'level' ? 8 : 9);
        }, state.exits, state);
        drawTiles(function (lock) {
            return OBJECTS.get(lock.lock == "blue" ? 6 : 7);
        }, state.locks, state);
    }

    var OBJECTS = new animate.SpriteSheet(gamejs.image.load('./data/objects.png'), { width: 32, height: 32 });

    function drawHero(state, levelState) {
        var img = Animations.hero[levelState.active].image;
        img.setAlpha(Math.abs(Math.sin(state.blinking)));
        blit(img, [state.rx, state.ry]);
    }

    function drawEnemy(state, levelState) {
        blit(Animations.enemy.image, [state.rx, state.ry]);
    }
});