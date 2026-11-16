export class Point3 {
    constructor(props) {
        const {
            x = 0,
            y = 0,
            z = 0
        } = props;

        this.x = x;
        this.y = y;
        this.z = z;
    }

    times(multiplier) {
        return new this.constructor({
            x: this.x * multiplier,
            y: this.y * multiplier,
            z: this.z * multiplier
        });
    }

    dividedBy(divider) {
        return this.times(1 / divider);
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    normalize() {
        return this.dividedBy(this.length());
    }


}