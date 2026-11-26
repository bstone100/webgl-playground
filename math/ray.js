import {Point3} from "./point3.js";
import {Vec3} from "./vec3.js";

export class Ray {
    constructor(props) {
        const {
            origin,
            direction
        } = props;

        // let's ensure these are the proper types
        this.origin = new Point3({...origin});
        this.direction = new Vec3({...direction});
    }

    at(t) {
        return this.origin.plus(this.direction.times(t));
    }
}