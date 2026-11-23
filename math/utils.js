// I'm going to put class neutral functions here
import {Vec2} from "./vec2.js";
import {Vec3} from "./vec3.js";
import {Mat4} from "./mat4.js";
import {Vec4} from "./vec4.js";

export function lerp(a, b, t) {
    if (typeof a === "number") {
        return a + t * (b - a);
    } else if (a instanceof Vec2) {
        return new Vec2({
            x: lerp(a.x, b.x, t),
            y: lerp(a.y, b.y, t)
        });
    } else if (a instanceof Vec3 || a instanceof Vec4) {
        return new Vec3({
            x: lerp(a.x, b.x, t),
            y: lerp(a.y, b.y, t),
            z: lerp(a.z, b.z, t)
        });
    } else if (a instanceof Mat4) {
        return new Mat4({
            X: slerp(a.X, b.X, t),
            Y: slerp(a.Y, b.Y, t),
            Z: slerp(a.Z, b.Z, t),
            T: {...lerp(a.T, b.T, t), w: 1}
        });
    }
}

export function slerp(a, b, t) {
    if (a instanceof Vec2) {
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
    } else if (a instanceof Vec3 || a instanceof Vec4) {
        // we're slerping the 2d projections of the 3d vectors onto the xy plane and the xz plane
        // this gives us two 2d vectors that together form the final slerped 3d vector
        const xyVec = slerp(new Vec2({x: a.x, y: a.y}), new Vec2({x: b.x, y: b.y}), t).normalize();
        const xzVec = slerp(new Vec2({x: a.x, y: a.z}), new Vec2({x: b.x, y: b.z}), t).normalize();

        const xyzVec = new Vec3({x: xzVec.x, y: xyVec.y, z: xzVec.y}).normalize();

        const length = lerp(a.length(), b.length(), t);

        return xyzVec.times(length);
    } else if (a instanceof Mat4) {
        // slerp the 3 basis vectors as well as the translation
        return new Mat4({
            X: slerp(a.X, b.X, t),
            Y: slerp(a.Y, b.Y, t),
            Z: slerp(a.Z, b.Z, t),
            T: {...slerp(a.T, b.T, t), w: 1}
        });
    }
}

export function degreesToRadians(degrees) {
    return degrees / 180 * Math.PI;
}

// values from CSS
export function easingFunction(f, t) {
    switch (f) {
        case "linear": return t;
        case "ease": return cubicBezier(0.25, 0.1, 0.25, 1.0, t).y;
        case "ease-in": return cubicBezier(0.42, 0, 1.0, 1.0, t).y;
        case "ease-out": return cubicBezier(0, 0, 0.58, 1.0, t).y;
        case "ease-in-out": return cubicBezier(0.42, 0, 0.58, 1.0, t).y;
    }
    return t;
}

export function cubicBezier(x1, y1, x2, y2, t) {
    const P0 = new Vec2({x: 0, y: 0});
    const P1 = new Vec2({x: x1, y: y1});
    const P2 = new Vec2({x: x2, y: y2});
    const P3 = new Vec2({x: 1, y: 1});

    const i = 1 - t;

    const A = P0.times(i).plus(P1.times(t));
    const B = P1.times(i).plus(P2.times(t));
    const C = P2.times(i).plus(P3.times(t));

    const X = A.times(i).plus(B.times(t));
    const Y = B.times(i).plus(C.times(t));

    const P = X.times(i).plus(Y.times(t));

    // I think we just need to return P.y
    // if that's correct I wonder if we even need to look at the x values
    return P;
}

export function clamp(min, val, max) {
    return Math.min(Math.max(val, min), max);
}






































