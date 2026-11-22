import {Vec4} from "./vec4.js";
import {lerp} from "../helpers.js";

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

    // we need to take a spherical path from a to b
    // that means to get from (0,0,1) to (0,0,-1) we need a vector that rotates about the origin
    // for example we could travel on the xz plane, or we could travel on the zy plane
    // we could travel on any plane that is parallel to the z axis
    // those two vectors are a special case because they are parallel with each other which means that there are an infinite number of valid spherical paths
    // but for vectors that are not parallel with each other, there are only two paths, a shorter path and a longer path

    // slerping between vec2s is simple, you just lerp between the angles of a and b to get angle of c
    static slerp(a, b, t) {

    }
}



























