import {Vec3} from "./vec3.js";

export class Point3 extends Vec3 {
    constructor(props) {
        super(props);

        this.w = 1;
    }
}