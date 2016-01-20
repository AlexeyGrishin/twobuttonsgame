"use strict";

exports.Animation = {
    _animations: [],
    add: function add(object, deltas, steps) {
        this._animations.push({
            object: object, deltas: deltas, steps: steps, onstep: object.onstep || deltas.onstep, after: object.after || deltas.after
        });
    },
    update: function update() {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this._animations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var anim = _step.value;

                for (var k in anim.deltas) {
                    anim.object[k] += anim.deltas[k];
                }
                anim.steps--;
                if (anim.onstep) anim.onstep(anim.object);
                if (anim.steps == 0 && anim.after) anim.after();
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

        this._animations = this._animations.filter(function (a) {
            return a.steps > 0;
        });
    }
};