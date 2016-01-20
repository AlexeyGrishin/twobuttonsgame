'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('animation');

var Animation = _require.Animation;

var tiledmap = require('gamejs/tiledmap');

var _require$Consts = require('consts').Consts;

var TILE_SIZE = _require$Consts.TILE_SIZE;
var MOVE_STEPS = _require$Consts.MOVE_STEPS;
var LEFT = _require$Consts.LEFT;
var RIGHT = _require$Consts.RIGHT;

function map2d(gids, fn) {
    var res = [];
    gids.forEach(function (row, ri) {
        res.push(row.map(function (gid, ci) {
            return fn(gid, ri, ci);
        }));
    });
    return res;
}

function map2d2vec(gids, fn) {
    var res = [];
    gids.forEach(function (row, ri) {
        row.forEach(function (gid, ci) {
            var r = fn(gid, ri, ci);
            if (r) {
                r.y = ri;
                r.x = ci;
                r.ry = TILE_SIZE * ri;
                r.rx = TILE_SIZE * ci;
                res.push(r);
            }
        });
    });
    return res;
}

function withGid(gid) {
    return function (id) {
        if (id == gid) return {};
    };
}

var LevelState = function () {
    function LevelState(mapUrl) {
        _classCallCheck(this, LevelState);

        this.tilemap = new tiledmap.Map(mapUrl);
        this.active = 'blue';
        this.enemies = map2d2vec(this.tilemap.layers[3].gids, withGid(34));
        this.mazes = {};
        this.mazes.blue = map2d(this.tilemap.layers[0].gids, function (gid) {
            return {
                empty: gid == 0,
                canWalkInto: [6, 8, 9, 10, 4, 3].indexOf(gid) != -1,
                canWalkSameLayer: [2].indexOf(gid) != -1,
                canJumpFrom: gid == 3,
                shallFall: [1, 4, 5, 7, 9, 10].indexOf(gid) != -1
            };
        });
        this.mazes.green = map2d(this.tilemap.layers[1].gids, function (gid) {
            return {
                empty: gid == 0,
                canWalkInto: [15, 16, 20, 21, 22, 24].indexOf(gid) != -1,
                canWalkSameLayer: [17, 23].indexOf(gid) != -1,
                canJumpFrom: gid == 16,
                shallFall: [1, 4, 5, 7, 9, 10].map(function (i) {
                    return i + 14;
                }).indexOf(gid) != -1
            };
        });
        this.diamonds = map2d2vec(this.tilemap.layers[2].gids, withGid(29));
        this.locks = map2d2vec(this.tilemap.layers[2].gids, function (gid) {
            if (gid == 35) return { lock: 'blue' };
            if (gid == 36) return { lock: 'green' };
        });
        this.exits = map2d2vec(this.tilemap.layers[2].gids, function (gid) {
            if (gid == 37 || gid == 38) return {};
        });
        this.startPosition = map2d2vec(this.tilemap.layers[3].gids, withGid(32))[0];

        this.mapView = new tiledmap.MapView(this.tilemap);
        this.mazeView(this.inactive).surface.setAlpha(0.5);
    }

    _createClass(LevelState, [{
        key: 'mazeView',
        value: function mazeView(name) {
            return this.mapView.layerViews[name == "blue" ? 0 : 1];
        }
    }, {
        key: '_getObject',
        value: function _getObject(ox, oy, objects) {
            return objects.filter(function (_ref) {
                var x = _ref.x;
                var y = _ref.y;
                return x == ox && y == oy;
            })[0];
        }
    }, {
        key: 'getObject',
        value: function getObject(x, y) {
            return {
                diamond: this._getObject(x, y, this.diamonds),
                exit: this._getObject(x, y, this.exits),
                lock: this._getObject(x, y, this.locks)
            };
        }
    }, {
        key: 'animateRemoval',
        value: function animateRemoval(o) {
            o.removalStep = 0;
            Animation.add(o, {
                removalStep: +1,
                after: function after() {
                    return remove(o);
                }
            }, 10);
        }
    }, {
        key: 'remove',
        value: function remove(o) {
            var _arr = [this.locks, this.diamonds];

            for (var _i = 0; _i < _arr.length; _i++) {
                var list = _arr[_i];
                var idx = list.indexOf(o);
                if (idx != -1) {
                    list.splice(idx, 1);
                    return;
                }
            }
        }
    }, {
        key: 'canWalkInto',
        value: function canWalkInto(x, y, layer) {
            return this.mazes[layer][y][x].canWalkInto;
        }
    }, {
        key: 'canWalk',
        value: function canWalk(x0, y0, x, y, layer, reverse) {
            var cell = this.mazes[layer][y][x];
            var target = null;
            if (cell.canWalkInto || cell.canWalkSameLayer && reverse) {
                target = { x: x, y: y, action: "move" };
                if (cell.shallFall) {
                    var jy = y;
                    while (this.mazes[layer][jy][x].shallFall) {
                        jy++;
                    }
                    target.y = jy;
                    target.action = "fall";
                }
                return target;
            } else if (this.mazes[layer][y0][x0].canJumpFrom) {
                target = { x: x, y: y };
                var jy = y;
                while (!this.canWalkInto(x, jy, layer)) {
                    jy--;
                }
                target.y = jy;
                target.action = "jump";
            }
            return target;
        }
    }, {
        key: 'swapInto',
        value: function swapInto() {
            var _this = this;

            var layer = arguments.length <= 0 || arguments[0] === undefined ? this.active : arguments[0];

            if (layer == this.active) return;
            this.active = this.inactive;
            Animation.add({
                opacity: 0,
                onstep: function onstep(_ref2) {
                    var opacity = _ref2.opacity;

                    _this.mazeView(_this.inactive).surface.setAlpha(opacity);
                }
            }, { opacity: +0.1 }, 5);
            Animation.add({
                opacity: 0.5,
                onstep: function onstep(_ref3) {
                    var opacity = _ref3.opacity;

                    _this.mazeView(_this.active).surface.setAlpha(opacity);
                }
            }, { opacity: -0.1 }, 5);
        }
    }, {
        key: 'inactive',
        get: function get() {
            return this.active == "green" ? "blue" : "green";
        }
    }]);

    return LevelState;
}();

exports.LevelState = LevelState;