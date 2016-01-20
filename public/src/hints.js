
class HintState {
    constructor(hints) {
        this.hintJumping = 0;
        this.hints = hints || [];
    }

    get hintsToShow() {
        return this.hints.filter((h) => h.visible)
    }

    update(hero, level, ms, game) {
        for (let hint of this.hints) {
            if (hint.visible) {
                hint.shownTime += ms;
            }
        }

        //if (hero.movement) return;
        for (let hint of this.hints) {
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
                    hint.showIf = () => false;
                }

            }
        }
        this.hintJumping++;
    }
}

exports.HintState = HintState;