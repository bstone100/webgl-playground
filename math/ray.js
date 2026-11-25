export class Ray {
    constructor(props) {
        const {
            origin,
            direction
        } = props;

        this.origin = origin;
        this.direction = direction;
    }

    at(t) {
        return this.origin.plus(this.direction.times(t));
    }
}