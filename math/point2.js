export class Point2 {
    constructor({x = 0, y = 0}) {
        this.x = x;
        this.y = y;
    }

    times(multiplier) {
        return new Point2({
            x: this.x * multiplier,
            y: this.y * multiplier
        });
    }
}