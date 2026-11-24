// I'm going to put class neutral functions here
import {Vec2} from "./vec2.js";
import {Vec3} from "./vec3.js";
import {Mat4} from "./mat4.js";
import {Vec4} from "./vec4.js";
import {Point2} from "./point2.js";

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

export function radiansToDegrees(radians) {
    return radians / Math.PI * 180;
}

// see: https://easings.net/
export function easingFunction(f, x) {
    switch (f) {
        case "linear": return x;
        case "ease-in-cubic": return x * x * x;
        case "ease-out-cubic": return 1 - Math.pow(1 - x, 3);
        case "ease-in-out-cubic": return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    return x;
}

// okay this is totally wrong even though it looks right
// the problem is that t is the wrong t
// t represents x on the graph of the bezier curve
// what I implemented below finds a point P on the curve given a value s
// but that value s is unknown and needs to be computed from x which is the input to this function
// once s is solved, then y can be computed from s
export function cubicBezier(x1, y1, x2, y2, x) {
    // x(s) = (1-s)^3 * p0.x + 3(1-s)^2 * s * p1.x + 3(1-s)s^2 * p2.x + s^3 * p3.x

    // p0.x = 0, p3.x = 1

    // we know all the x values in the equation, and x(s) = t = x
    // 0 = (1-s)^3 * p0.x + 3(1-s)^2 * s * p1.x + 3(1-s)s^2 * p2.x + s^3 * p3.x - t

    // so we need to find the s value that makes that equation equal to 0
    // s is in [0,1]

    // I'm going to start with an aggressive method
    // try 100 samples of s and pick the one closest to 0
    // or leave t on the left side of the equation and try to find s that makes the right side equal to t

    // find s!!!

    let closestS = x;
    let smallestDelta = Infinity;

    // this is crappy but I want to use it for now
    for (let s = 0; s < 1; s += 0.001) {
        // compute right side of equation

        const rightSide = 3 * Math.pow((1 - s), 2) * s * x1 + 3 * (1 - s) * Math.pow(s, 2) * x2 + Math.pow(s, 3);

        const delta = Math.abs(x - rightSide);

        if (delta < smallestDelta) {
            smallestDelta = delta;
            closestS = s;
        }
        if (delta < 0.001) {
            break;
        }
    }

    // okay now we have s
    // need to compute y

    return 3 * Math.pow((1 - closestS), 2) * closestS * y1 + 3 * (1 - closestS) * Math.pow(closestS, 2) * y2 + Math.pow(closestS, 3);
}

export function clamp(min, val, max) {
    return Math.min(Math.max(val, min), max);
}

export function cartesianToSpherical(vec3) {
    const radius = vec3.length();
    const normalized = vec3.normalize();

    return {
        radius,
        theta: Math.atan2(Math.sqrt(1 - Math.pow(normalized.y, 2)), normalized.y),
        phi: Math.atan2(normalized.x, normalized.z)
    };
}

export function sphericalToCartesian(spherical) {
    return new Vec3({
        x: Math.sin(spherical.theta) * Math.sin(spherical.phi),
        y: Math.cos(spherical.theta),
        z: Math.sin(spherical.theta) * Math.cos(spherical.phi)
    }).times(spherical.radius);
}

export function isPointInRect(x, y, rect) {
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}


































