exports.Animation = {
    _animations: [],
    add(object, deltas, steps) {
        this._animations.push({
            object, deltas, steps, onstep: object.onstep || deltas.onstep, after: object.after || deltas.after
        })
    },

    update() {
        for (let anim of this._animations) {
            for (let k in anim.deltas) {
                anim.object[k] += anim.deltas[k];
            }
            anim.steps--;
            if (anim.onstep) anim.onstep(anim.object);
            if (anim.steps == 0 && anim.after) anim.after();
        }
        this._animations = this._animations.filter((a) => a.steps > 0);
    }
};