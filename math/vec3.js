import { Point3 } from "./point3.js";

export class Vec3 extends Point3 {
    constructor(props) {
        super(props);
    }

    plus(vec3) {
        return new Vec3({
            x: this.x + vec3.x,
            y: this.y + vec3.y,
            z: this.z + vec3.z
        });
    }
}