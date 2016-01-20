let {Animation} = require('animation');
var tiledmap = require('gamejs/tiledmap');
const {TILE_SIZE, MOVE_STEPS, LEFT, RIGHT} = require('consts').Consts;

function map2d(gids, fn) {
    let res = [];
    gids.forEach((row, ri) => {
        res.push(row.map((gid, ci) => fn(gid, ri, ci)))
    });
    return res;
}

function map2d2vec(gids, fn) {
    let res = [];
    gids.forEach((row, ri) => {
        row.forEach((gid, ci) => {
            let r = fn(gid, ri, ci);
            if (r) {
                r.y = ri;
                r.x = ci;
                r.ry = TILE_SIZE*ri;
                r.rx = TILE_SIZE*ci;
                res.push(r);
            }
        })
    });
    return res;
}

function withGid(gid) {
    return function(id) {
        if (id == gid) return {};
    }
}

class LevelState {
    constructor(mapUrl) {
        this.tilemap = new tiledmap.Map(mapUrl);
        this.active = 'blue';
        this.enemies = map2d2vec(this.tilemap.layers[3].gids, withGid(34));
        this.mazes = {};
        this.mazes.blue = map2d(this.tilemap.layers[0].gids, (gid) => {return {
            empty: gid == 0,
            canWalkInto: [6, 8, 9, 10, 4, 3].indexOf(gid) != -1,
            canWalkSameLayer: [2].indexOf(gid) != -1,
            canJumpFrom: gid == 3,
            shallFall: [1, 4, 5, 7, 9, 10].indexOf(gid) != -1
        }});
        this.mazes.green = map2d(this.tilemap.layers[1].gids, (gid) => { return {
            empty: gid == 0,
            canWalkInto: [15, 16, 20, 21, 22, 24].indexOf(gid) != -1,
            canWalkSameLayer: [17,23].indexOf(gid) != -1,
            canJumpFrom: gid == 16,
            shallFall: [1, 4, 5, 7, 9, 10].map((i) => i+14).indexOf(gid) != -1
        }});
        this.diamonds = map2d2vec(this.tilemap.layers[2].gids, withGid(29));
        this.locks = map2d2vec(this.tilemap.layers[2].gids, (gid) => {
            if (gid == 35) return {lock: 'blue'};
            if (gid == 36) return {lock: 'green'};
        });
        this.exits = map2d2vec(this.tilemap.layers[2].gids, (gid) => {
            if (gid == 37 || gid == 38) return {};
        });
        this.startPosition = map2d2vec(this.tilemap.layers[3].gids, withGid(32))[0];

        this.mapView = new tiledmap.MapView(this.tilemap);
        this.mazeView(this.inactive).surface.setAlpha(0.5);
    }

    get inactive() {
        return this.active == "green" ? "blue":"green";
    }

    mazeView(name) {
        return this.mapView.layerViews[name == "blue" ? 0 : 1];
    }

    _getObject(ox, oy, objects) {
        return objects.filter(({x,y}) => x == ox && y == oy)[0];
    }

    getObject(x,y) {
        return {
            diamond: this._getObject(x, y, this.diamonds),
            exit: this._getObject(x, y, this.exits),
            lock: this._getObject(x, y, this.locks)
        }
    }

    animateRemoval(o) {
        o.removalStep = 0;
        Animation.add(o, {
            removalStep: +1,
            after: () => remove(o)
        }, 10)
    }

    remove(o) {
        for (var list of [this.locks, this.diamonds]) {
            let idx = list.indexOf(o);
            if (idx != -1) {
                list.splice(idx, 1);
                return;
            }
        }
    }

    canWalkInto(x, y, layer) {
        return this.mazes[layer][y][x].canWalkInto;
    }

    canWalk(x0, y0, x, y, layer, reverse) {
        let cell = this.mazes[layer][y][x];
        let target = null;
        if (cell.canWalkInto || (cell.canWalkSameLayer && reverse)) {
            target = {x, y, action: "move"};
            if (cell.shallFall) {
                let jy = y;
                while (this.mazes[layer][jy][x].shallFall) { jy++;}
                target.y = jy;
                target.action = "fall";
            }
            return target;
        } else if (this.mazes[layer][y0][x0].canJumpFrom) {
            target = {x: x, y: y};
            let jy = y;
            while (!this.canWalkInto(x, jy, layer)) { jy--;}
            target.y = jy;
            target.action = "jump";
        }
        return target;
    }



    swapInto(layer = this.active) {
        if (layer == this.active) return;
        this.active = this.inactive;
        Animation.add({
            opacity: 0,
            onstep: ({opacity}) => {
                this.mazeView(this.inactive).surface.setAlpha(opacity);
            }
        }, {opacity: +0.1}, 5);
        Animation.add({
            opacity: 0.5,
            onstep: ({opacity}) => {
                this.mazeView(this.active).surface.setAlpha(opacity);
            }
        }, {opacity: -0.1}, 5)
    }

}

exports.LevelState = LevelState;