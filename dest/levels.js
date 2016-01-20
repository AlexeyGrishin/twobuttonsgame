"use strict";

exports.levels = [{
    map: './data/start.tmx',
    hints: [{ x: 10, y: 9, hx: 6, hy: 9, hint: ["Go here to start"] }, { x: 10, y: 9, hx: 13, hy: 9, hint: ["..or here"] }],
    music: './data/level2.ogg'
}, {
    map: './data/level1.tmx',
    music: './data/level1.ogg',
    hints: [{ x: 3, y: 9, hint: ["Press 's' to mute sound"] }, { x: 5, y: 9, hint: ["Did you notice", "that moving left", "makes the world", "green?"], once: true }, { x: 7, y: 9, hx: 7, hy: 9, hint: ["Don't worry", "Keep moving right", "to jump"], once: true }, { x: 8, y: 5, hint: ["Diamond needed to open lock"], showIf: function showIf(level) {
            return level.getObject(9, 5).diamond;
        } }, { x: 8, y: 5, hx: 4, hy: 13, hint: ["This lock"], showIf: function showIf(level) {
            return level.getObject(9, 5).diamond;
        } }, {
        x: 14, y: 9, hint: ["Wait a minute", "This diamond is blue", "but lock is green..."],
        showIf: function showIf(level) {
            return level.getObject(14, 9).diamond;
        }
    }, { x: 14, y: 9, hx: 5, hy: 13, hint: ["Hey, I'm green!"], showIf: function showIf(level) {
            return level.getObject(14, 9).diamond;
        } }, { x: 16, y: 9, hint: ["Does it make sense", "to turn left?"], showIf: function showIf(level) {
            return level.getObject(14, 9).diamond;
        } }, { x: 14, y: 9, hint: ["Well done!", "Time to find exit!"], showIf: function showIf(level) {
            return !level.getObject(14, 9).diamond;
        } }]
}, {
    map: './data/level2.tmx',
    music: './data/level3.ogg',
    hints: [{ x: 3, y: 2, hint: ["You may press 'r'", "to restart level"], once: true }, { x: 4, y: 5, hint: ["Okay, it violates", "'two buttons' theme", "but who cares?"], once: true }, { x: 6, y: 5, hx: 14, hy: 4, hint: ["This guy looks strange..."], once: true }, { x: 6, y: 3, hx: 16, hy: 4, hint: ["Does he repeat your actions?"], once: true }, { x: 7, y: 14, hint: ["Don't hate me for this maze!"], once: true }]
}, {
    map: './data/level3.tmx',
    music: './data/level5.ogg',
    hints: [{ x: 1, y: 2, hint: ["What..."], once: true, delay: 100 }, { x: 2, y: 2, hint: ["Hey, it's moving"], once: true, delay: 100 }, { x: 3, y: 2, hint: ["Are you scared?"], once: true, delay: 100 }, { x: 4, y: 2, hint: ["And did you notice..."], once: true, delay: 100 }, { x: 5, y: 2, hint: ["...you can't change direction", "when IT cannot?"], once: true, delay: 100 }, { x: 7, y: 2, hint: ["My god..."], once: true, delay: 100 }, { x: 8, y: 2, hint: ["There shall be a way..."], once: true, delay: 100 }, { x: 9, y: 2, hint: ["NOW!"], once: true, delay: 100 }, { x: 8, y: 5, hint: ["Phew!"], once: true }, { x: 13, y: 6, hint: ["Again?"], once: true }, { x: 11, y: 11, hint: ["I'm... in a trap?"], showIf: function showIf(level, game) {
            return game.hasEnemyOn(11, 17);
        } }, { x: 11, y: 11, hx: 11, hy: 17, hint: ["Gotcha!"], showIf: function showIf(level, game) {
            return game.hasEnemyOn(11, 17);
        } }]
}, {
    map: './data/end.tmx',
    music: './data/level4.ogg',
    hints: [{ x: 9, y: 10, hint: ["That's the end", "Thanks for playing!"], delay: 999999 }]
}];