import {Vec3} from "./vec3.js";
import {lerp} from "../helpers.js";

export class Vec2 extends Vec3 {
    constructor(props) {
        super(props);
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    static lerp(a, b, t) {
        return new Vec2({
            x: lerp(a.x, b.x, t),
            y: lerp(a.y, b.y, t)
        });
    }

    static slerp(a, b, t) {
        // lerp the angles then lerp the lengths

        // these will both be in [0, 2pi]
        const angleA = Math.atan2(a.y, a.x);
        const angleB = Math.atan2(b.y, b.x);

        let angleC;

        if (angleB >= angleA) {
            if (angleB - angleA <= Math.PI) {
                angleC = lerp(angleA, angleB, t);
            } else {
                angleC = lerp(angleA, -(2 * Math.PI - angleB), t);
            }
        } else {
            if (angleA - angleB <= Math.PI) {
                angleC = lerp(angleA, angleB, t);
            } else {
                angleC = lerp(-(2 * Math.PI - angleA), angleB, t);
            }
        }

        // lerp the length
        const lengthC = lerp(a.length(), b.length(), t);

        return new Vec2({x: Math.cos(angleC), y: Math.sin(angleC)}).times(lengthC);
    }
}

























