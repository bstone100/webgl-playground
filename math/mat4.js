import {Vec4} from "./vec4.js";
import {degreesToRadians} from "./utils.js";
import {Vec3} from "./vec3.js";

export class Mat4 {
    constructor(props = {}) {
        const {
            // I'm providing various ways to build a matrix because I'm nice
            X, Y, Z, T, A, B, C, D, m, operations, position, lookAt, from, direction
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

        if (operations) {
            // let's assume the person who wrote the operations wants them applied in 1st, 2nd, 3rd order
            // and we assume the person already put them in scale, rotation, translation order

            // we need: this = 3rd * 2nd * 1st * this

            // forward loop over operations
            // in loop:
                // get transform matrix
                // apply it like: this.m = transform * this.m
                // aka this.m = transform.times(this.m)

            for (const operation of operations) {
                let transform = null;
                switch (operation.type) {
                    case "scale": transform = Mat4.scale(operation); break;
                    case "rotate": transform = Mat4.rotate(operation); break;
                    case "translate": transform = Mat4.translate(operation); break;
                }
                if (transform) {
                    this.m = transform.times(this).m;
                }
            }
        }

        // this is a rotation matrix, use the position to build the matrix but don't put it in the matrix
        if (lookAt && from) {
            const Z = from.minus(lookAt).normalize();
            const X = Vec3.up.cross(Z).normalize();
            const Y = Z.cross(X).normalize();

            this.X = X;
            this.Y = Y;
            this.Z = Z;
        }

        if (position) {
            // this is a translation matrix, put the position in the matrix
            this.T = {...position, w: 1}
        }

        // point -Z axis at direction
        if (direction) {
            // so Z is normalize(-direction)
            // need to normalize all
            const Z = new Vec3(direction).negate().normalize();
            const X = Vec3.up.cross(Z).normalize();
            const Y = Z.cross(X).normalize;

            this.X = X;
            this.Y = Y;
            this.Z = Z;
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

    setTranslation(vec3) {
        this.m[0][3] = vec3.x;
        this.m[1][3] = vec3.y;
        this.m[2][3] = vec3.z;
    }

    static translate({x = 0, y = 0, z = 0}) {
        return new Mat4({
            m: [
                [1, 0, 0, x],
                [0, 1, 0, y],
                [0, 0, 1, z],
                [0, 0, 0, 1]
            ]
        });
    }

    static scale({x = 1, y = 1, z = 1}) {
        return new Mat4({
            m: [
                [x, 0, 0, 0],
                [0, y, 0, 0],
                [0, 0, z, 0],
                [0, 0, 0, 1]
            ]
        });
    }

    static rotate({angle, axis, unit, direction}) {
        if (direction === "clockwise") angle = -angle;
        if (unit === "degrees") angle = degreesToRadians(angle);

        const c = Math.cos(angle);
        const s = Math.sin(angle);
        switch (axis.toUpperCase()) {
            case "Z": return new Mat4({
                m: [
                    [c, -s, 0, 0],
                    [s, c, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ]
            });
            case "Y": return new Mat4({
                m: [
                    [c, 0, s, 0],
                    [0, 1, 0, 0],
                    [-s, 0, c, 0],
                    [0, 0, 0, 1]
                ]
            });
            case "X": return new Mat4({
                m: [
                    [1, 0, 0, 0],
                    [0, c, -s, 0],
                    [0, s, c, 0],
                    [0, 0, 0, 1]
                ]
            });
        }
    }

    times(val) {
        if (val instanceof Vec4) {
            return new Vec4({
                x: this.A.dot(val),
                y: this.B.dot(val),
                z: this.C.dot(val),
                w: this.D.dot(val)
            });
        } else if (val instanceof Mat4) {
            return new Mat4({
                X: this.times(val.X),
                Y: this.times(val.Y),
                Z: this.times(val.Z),
                T: this.times(val.T)
            });
        }
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
























