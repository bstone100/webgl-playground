// note: maybe we should make Vec4 extend Vec3 instead of the other way around
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

    toArray() {
        const arr = new Float32Array(4);
        arr[0] = this.x;
        arr[1] = this.y;
        arr[2] = this.z;
        arr[3] = this.w;
        return arr;
    }

    dot(vec4) {
        return this.x * vec4.x + this.y * vec4.y + this.z * vec4.z + this.w * vec4.w;
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    // TODO: rewrite this class so that it extends Vec3
    normalize() {
        const l = this.length();
        return new Vec4({
            x: this.x / l,
            y: this.y / l,
            z: this.z / l,
            w: this.w
        });
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
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















