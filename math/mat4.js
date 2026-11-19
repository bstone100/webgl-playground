import {Vec4} from "./vec4.js";

export class Mat4 {
    constructor(props) {
        const {
            X, Y, Z, T, A, B, C, D, m
        } = props;

        if (m) {
            this.m = m;
        } else {
            this.m = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ];
        }

        if (X) this.X = X;
        if (Y) this.Y = Y;
        if (Z) this.Z = Z;
        if (T) this.T = T;
        if (A) this.A = A;
        if (B) this.B = B;
        if (C) this.C = C;
        if (D) this.D = D;
    }

    // packed in column major order
    toArray() {
        const arr = new Float32Array(16);
        arr[0] = this.m[0][0];
        arr[1] = this.m[1][0];
        arr[2] = this.m[2][0];
        arr[3] = this.m[3][0];
        arr[4] = this.m[0][1];
        arr[5] = this.m[1][1];
        arr[6] = this.m[2][1];
        arr[7] = this.m[3][1];
        arr[8] = this.m[0][2];
        arr[9] = this.m[1][2];
        arr[10] = this.m[2][2];
        arr[11] = this.m[3][2];
        arr[12] = this.m[0][3];
        arr[13] = this.m[1][3];
        arr[14] = this.m[2][3];
        arr[15] = this.m[3][3];
        return arr;
    }

    toInverse() {
        return new Mat4({
            A: new Vec4({
                x: this.m[0][0],
                y: this.m[1][0],
                z: this.m[2][0],
                w: -this.T.dot(this.X)
            }),
            B: new Vec4({
                x: this.m[0][1],
                y: this.m[1][1],
                z: this.m[2][1],
                w: -this.T.dot(this.Y)
            }),
            C: new Vec4({
                x: this.m[0][2],
                y: this.m[1][2],
                z: this.m[2][2],
                w: -this.T.dot(this.Z)
            })
        });
    }

    get X() {
        return new Vec4({
            x: this.m[0][0],
            y: this.m[1][0],
            z: this.m[2][0],
            w: this.m[3][0]
        })
    }

    set X(vec4) {
        this.m[0][0] = vec4.x;
        this.m[1][0] = vec4.y;
        this.m[2][0] = vec4.z;
        this.m[3][0] = vec4.w;
    }

    get Y() {
        return new Vec4({
            x: this.m[0][1],
            y: this.m[1][1],
            z: this.m[2][1],
            w: this.m[3][1]
        });
    }

    set Y(vec4) {
        this.m[0][1] = vec4.x;
        this.m[1][1] = vec4.y;
        this.m[2][1] = vec4.z;
        this.m[3][1] = vec4.w;
    }

    get Z() {
        return new Vec4({
            x: this.m[0][2],
            y: this.m[1][2],
            z: this.m[2][2],
            w: this.m[3][2]
        });
    }

    set Z(vec4) {
        this.m[0][2] = vec4.x;
        this.m[1][2] = vec4.y;
        this.m[2][2] = vec4.z;
        this.m[3][2] = vec4.w;
    }

    get T() {
        return new Vec4({
            x: this.m[0][3],
            y: this.m[1][3],
            z: this.m[2][3],
            w: this.m[3][3]
        });
    }

    set T(vec4) {
        this.m[0][3] = vec4.x;
        this.m[1][3] = vec4.y;
        this.m[2][3] = vec4.z;
        this.m[3][3] = vec4.w;
    }

    get A() {
        return new Vec4({
            x: this.m[0][0],
            y: this.m[0][1],
            z: this.m[0][2],
            w: this.m[0][3]
        });
    }

    set A(vec4) {
        this.m[0][0] = vec4.x;
        this.m[0][1] = vec4.y;
        this.m[0][2] = vec4.z;
        this.m[0][3] = vec4.w;
    }

    get B() {
        return new Vec4({
            x: this.m[1][0],
            y: this.m[1][1],
            z: this.m[1][2],
            w: this.m[1][3]
        });
    }

    set B(vec4) {
        this.m[1][0] = vec4.x;
        this.m[1][1] = vec4.y;
        this.m[1][2] = vec4.z;
        this.m[1][3] = vec4.w;
    }

    get C() {
        return new Vec4({
            x: this.m[2][0],
            y: this.m[2][1],
            z: this.m[2][2],
            w: this.m[2][3]
        });
    }

    set C(vec4) {
        this.m[2][0] = vec4.x;
        this.m[2][1] = vec4.y;
        this.m[2][2] = vec4.z;
        this.m[2][3] = vec4.w;
    }

    get D() {
        return new Vec4({
            x: this.m[3][0],
            y: this.m[3][1],
            z: this.m[3][2],
            w: this.m[3][3]
        });
    }

    set D(vec4) {
        this.m[3][0] = vec4.x;
        this.m[3][1] = vec4.y;
        this.m[3][2] = vec4.z;
        this.m[3][3] = vec4.w;
    }
}
























