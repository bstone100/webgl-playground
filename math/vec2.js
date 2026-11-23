import {Vec3} from "./vec3.js";

export class Vec2 extends Vec3 {
    constructor(props) {
        super(props);
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}

























