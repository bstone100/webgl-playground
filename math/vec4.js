export class Vec4 {
    constructor(props = {}) {
        const {
            x, y, z, w,
            r, g, b, a,
        } = props;

        if (x) this.x = x;
        if (y) this.y = y;
        if (z) this.z = z;
        if (w) this.w = w;
        if (r) this.r = r;
        if (g) this.g = g;
        if (b) this.b = b;
        if (a) this.a = a;

        if (!this.x) this.x = 0;
        if (!this.y) this.y = 0;
        if (!this.z) this.z = 0;
        if (!this.w) this.w = 0;
    }

    plus(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x + val,
                y: this.y + val,
                z: this.z + val,
                w: this.w + val
            });
        } else if (val instanceof Vec4) {
            return new this.constructor({
                x: this.x + val.x,
                y: this.y + val.y,
                z: this.y + val.z,
                w: this.w + val.w
            });
        }
    }

    minus(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x - val,
                y: this.y - val,
                z: this.z - val,
                w: this.w - val
            });
        } else if (val instanceof Vec4) {
            return new this.constructor({
                x: this.x - val.x,
                y: this.y - val.y,
                z: this.z - val.z,
                w: this.w - val.w
            });
        }
    }

    times(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x * val,
                y: this.y * val,
                z: this.z * val,
                w: this.w * val
            });
        } else if (val instanceof Vec4) {
            return new this.constructor({
                x: this.x * val.x,
                y: this.y * val.y,
                z: this.z * val.z,
                w: this.w * val.w
            });
        }
    }

    dividedBy(val) {
        if (typeof val === "number") {
            return new this.constructor({
                x: this.x / val,
                y: this.y / val,
                z: this.z / val,
                w: this.w / val
            });
        } else if (val instanceof Vec4) {
            return new this.constructor({
                x: this.x / val.x,
                y: this.y / val.y,
                z: this.z / val.z,
                w: this.w / val.w
            });
        }
    }

    dot(vec4) {
        return this.x * vec4.x + this.y * vec4.y + this.z * vec4.z + this.w * vec4.w;
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2) + Math.pow(this.w, 2));
    }

    normalize() {
        return this.dividedBy(this.length());
    }

    get r() {
        return this.x;
    }

    set r(val) {
        this.x = val;
    }

    get g() {
        return this.y;
    }

    set g(val) {
        this.y = val;
    }

    get b() {
        return this.z;
    }

    set b(val) {
        this.z = val;
    }

    get a() {
        return this.w;
    }

    set a(val) {
        this.w = val;
    }
}