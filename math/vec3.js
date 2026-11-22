import {Vec4} from "./vec4.js";
import {lerp} from "../helpers.js";
import {Vec2} from "./vec2.js";

export class Vec3 extends Vec4 {
    constructor(props) {
        super(props);

        this.w = 0;
    }

    plus(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x + val,
                y: this.y + val,
                z: this.z + val
            });
        } else if (val instanceof Vec3) {
            return new this.constructor({
                x: this.x + val.x,
                y: this.y + val.y,
                z: this.z + val.z
            });
        }
    }

    minus(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x - val,
                y: this.y - val,
                z: this.z - val
            });
        } else if (val instanceof Vec3) {
            return new this.constructor({
                x: this.x - val.x,
                y: this.y - val.y,
                z: this.z - val.z
            });
        }
    }

    times(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x * val,
                y: this.y * val,
                z: this.z * val
            });
        } else if (val instanceof Vec3) {
            return new this.constructor({
                x: this.x * val.x,
                y: this.y * val.y,
                z: this.z * val.z
            });
        }
    }

    dividedBy(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x / val,
                y: this.y / val,
                z: this.z / val
            });
        } else if (val instanceof Vec3) {
            return new this.constructor({
                x: this.x / val.x,
                y: this.y / val.y,
                z: this.z / val.z
            });
        }
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    toUnit() {
        return this.dividedBy(this.length());
    }

    normalize() {
        return this.toUnit();
    }

    negate() {
        return this.times(-1);
    }

    // see: https://mathinsight.org/cross_product_formula
    cross(vec3) {
        // (a2b3−a3b2)i−(a1b3−a3b1)j+(a1b2−a2b1)k
        // (a.y * b.z − a.z * b.y)i − (a.x * b.z − a.z * b.x)j + (a.x * b.y − a.y * b.x)k

        // a = (a1, a2, a3), b = (b1, b2, b3)
        // a = (a.x, a.y, a.z), b = (b.x, b.y, b.z)
        // i = (1, 0, 0), j = (0, 1, 0), k = (0, 0, 1)

        const a = this;
        const b = vec3;
        const i = Vec3.i;
        const j = Vec3.j;
        const k = Vec3.k;

        return i.times(a.y * b.z - a.z * b.y).minus(j.times(a.x * b.z - a.z * b.x)).plus(k.times(a.x * b.y - a.y * b.x));
    }


    static i = new Vec3({x: 1, y: 0, z: 0});
    static j = new Vec3({x: 0, y: 1, z: 0});
    static k = new Vec3({x: 0, y: 0, z: 1});

    static get X() {return Vec3.i;}
    static get Y() {return Vec3.j;}
    static get Z() {return Vec3.k;}
    static get right() {return Vec3.i;}
    static get up() {return Vec3.j;}
    static get front() {return Vec3.k;}

    static negative(vec3) {
        return vec3.times(-1);
    }

    // this takes you from point a to point b in a straight line
    // that makes sense for points but not directions
    static lerp(a, b, t) {
        return new Vec3({
            x: lerp(a.x, b.x, t),
            y: lerp(a.y, b.y, t),
            z: lerp(a.z, b.z, t)
        });
    }

    static slerp(a, b, t) {
        // okay we need to find two angles representing both vectors

        // first set of angles is for a and b both projected onto the the xy plane
        // we just need to ignore the z values
        // we can slerp the two projections onto the xy plane

        // this will give us a vector in the correct direction on the xy plane
        // Vec2.slerp just uses x and y
        // ignore the length of this vector
        const xyVec = Vec2.slerp(new Vec2({x: a.x, y: a.y}), new Vec2({x: b.x, y: b.y}), t).normalize();

        // we also need a vector on the xz plane
        // so we should project a and b onto the xz plane which just means ignore the y value

        // we can just Vec2.slerp with xz from both

        const xzVec = Vec2.slerp(new Vec2({x: a.x, y: a.z}), new Vec2({x: b.x, y: b.z}), t).normalize();

        // okay now we have two 2d vectors representing our 3d vector
        // I think the 3d vector can just grab y from the xy vec and grab x and z from the xz vec

        // this vector points in the final direction, now just need to lerp the length
        const xyzVec = new Vec3({x: xzVec.x, y: xyVec.y, z: xzVec.y}).normalize();

        const length = lerp(a.length(), b.length(), t);

        return xyzVec.times(length);
    }
}



























