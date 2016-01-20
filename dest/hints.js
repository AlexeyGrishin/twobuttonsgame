"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HintState = function () {
    function HintState(hints) {
        _classCallCheck(this, HintState);

        this.hintJumping = 0;
        this.hints = hints || [];
    }

    _createClass(HintState, [{
        key: "update",
        value: function update(hero, level, ms, game) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.hints[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var hint = _step.value;

                    if (hint.visible) {
                        hint.shownTime += ms;
                    }
                }

                //if (hero.movement) return;
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

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.hints[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var hint = _step2.value;

                    if (hint.x == hero.x && hint.y == hero.y) {
                        if (!hint.showIf || hint.showIf(level, game)) {
                            hint.shown = true;
                            if (!hint.visible) {
                                hint.shownTime = 0;
                            }
                            hint.visible = true;
                        }
                    } else {
                        if (hint.shownTime > (hint.delay || 1000)) {
                            hint.visible = false;
                        }
                        if (hint.shown && hint.once) {
                            hint.showIf = function () {
                                return false;
                            };
                        }
                    }
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

            this.hintJumping++;
        }
    }, {
        key: "hintsToShow",
        get: function get() {
            return this.hints.filter(function (h) {
                return h.visible;
            });
        }
    }]);

    return HintState;
}();

exports.HintState = HintState;