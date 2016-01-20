'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require$Consts = require('consts').Consts;

var TILE_SIZE = _require$Consts.TILE_SIZE;
var MOVE_STEPS = _require$Consts.MOVE_STEPS;
var LEFT = _require$Consts.LEFT;
var RIGHT = _require$Consts.RIGHT;

var _require = require('animation');

var Animation = _require.Animation;

var UnitState = function () {
    function UnitState(_ref, level, playAnimation) {
        var x = _ref.x;
        var y = _ref.y;

        _classCallCheck(this, UnitState);

        this.x = x;
        this.y = y;
        this.level = level;
        this.rx = TILE_SIZE * x;
        this.ry = TILE_SIZE * y;
        this.movement = null;
        this.direction = RIGHT;
        this.playAnimation = playAnimation || function () {};
        this.playAnimation("stand");
        this.blinking = 0;
    }

    _createClass(UnitState, [{
        key: 'restart',
        value: function restart() {
            var _this = this;

            Animation.add(this, {
                blinking: +Math.PI / 15,
                after: function after() {
                    return _this.blinking = 0;
                }
            }, 40);
        }
    }, {
        key: 'move',
        value: function move(dx) {
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
    }, {
        key: 'fall',
        value: function fall(dx, dy) {
            var _this2 = this;

            if (this.movement) return;
            this.move(dx);
            this.movement.steps = MOVE_STEPS * 3 / 4;
            this.movement.after = function () {
                _this2.playAnimation("fall");
                _this2.movement = {
                    targetX: _this2.x + dx,
                    targetY: _this2.y + dy,
                    steps: MOVE_STEPS / 4,
                    stepDx: UnitState._step(dx),
                    stepDy: UnitState._step(dy, MOVE_STEPS / 4)
                };
            };
        }

        //TODO: add fall. use full move, then full fall

    }, {
        key: 'jump',
        value: function jump(dx, dy) {
            var _this3 = this;

            if (this.movement) return;
            this.movement = {
                targetX: this.x,
                targetY: this.y + dy,
                steps: MOVE_STEPS / 2,
                stepDx: 0,
                stepDy: UnitState._step(dy, MOVE_STEPS / 2),
                after: function after() {
                    _this3.playAnimation("walk");
                    _this3.movement = {
                        targetX: _this3.x + dx,
                        targetY: _this3.y + dy,
                        steps: MOVE_STEPS / 2,
                        stepDx: UnitState._step(dx, MOVE_STEPS / 2),
                        stepDy: 0
                    };
                }
            };
            this.playAnimation("jump");
        }
    }, {
        key: 'update',
        value: function update(ticks) {
            if (this.movement) {
                this.rx += this.movement.stepDx;
                this.ry += this.movement.stepDy;
                this.movement.steps--;
                if (this.movement.steps == 0) {
                    var after = this.movement.after;
                    if (after) {
                        this.movement = null;
                        after();
                    } else {
                        this.x = this.movement.targetX;
                        this.y = this.movement.targetY;
                        this.rx = TILE_SIZE * this.x;
                        this.ry = TILE_SIZE * this.y;
                        this.movement = null;
                        this.playAnimation("stand");
                    }
                }
            }
        }
    }], [{
        key: '_step',
        value: function _step(delta) {
            var steps = arguments.length <= 1 || arguments[1] === undefined ? MOVE_STEPS : arguments[1];

            return TILE_SIZE * delta / steps;
        }
    }]);

    return UnitState;
}();

exports.UnitState = UnitState;