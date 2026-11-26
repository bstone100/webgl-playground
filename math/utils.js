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
        // return new Mat4({
        //     X: slerp(a.X, b.X, t),
        //     Y: slerp(a.Y, b.Y, t),
        //     Z: slerp(a.Z, b.Z, t),
        //     T: {...lerp(a.T, b.T, t), w: 1}
        // });

        const Z = slerp(a.Z, b.Z, t);
        const X = Vec3.up.cross(Z).normalize();
        const Y = Z.cross(X).normalize();
        const T = {...lerp(a.T, b.T, t), w: 1}

        return new Mat4({X, Y, Z, T});
    }
}

// angles need to be handled specially because we could go either clockwise or counterclockwise to travel from one angle to another
// we need to pick the shorter path, and we can do this by converting the larger angle to a negative angle
export function lerpAngle(a, b, t) {
    if (Math.abs(a - b) <= Math.PI) {
        return lerp(a, b, t);
    } else {
        if (a >= b) {
            // switch a to a negative angle
            return lerp(-(2 * Math.PI - a), b, t);
        } else {
            // switch b to a negative angle
            return lerp(a, -(2 * Math.PI - b), t);
        }
    }
}

export function slerp(a, b, t) {
    if (a instanceof Vec2) {
        // lerp the angles then lerp the lengths

        // these will both be in [0, 2pi]
        const angleA = Math.atan2(a.y, a.x);
        const angleB = Math.atan2(b.y, b.x);

        const angleC = lerpAngle(angleA, angleB, t);

        // lerp the length
        const lengthC = lerp(a.length(), b.length(), t);

        return new Vec2({x: Math.cos(angleC), y: Math.sin(angleC)}).times(lengthC);
    } else if (a instanceof Vec3 || a instanceof Vec4) {
        // convert both vectors to spherical coordinates, lerp all 3 properties, then convert back to cartesian

        const aSpherical = cartesianToSpherical(a);
        const bSpherical = cartesianToSpherical(b);

        const c = {
            radius: lerp(aSpherical.radius, bSpherical.radius, t),
            theta: lerpAngle(aSpherical.theta, bSpherical.theta, t),
            phi: lerpAngle(aSpherical.phi, bSpherical.phi, t)
        };

        // do we need to normalize the final result?
        // for slerping two basis vectors, both should have radius 1 so it shouldn't be necessary
        // but I'm seeing objects get stretched which tells me that there is shearing happening in the camera's transform
        // that means there might be periods during the camera animation where its basis vectors are not orthonormal
        // I think they will stay normalized, so the issue must be that they are becoming non orthogonal

        // yeah that explanation makes sense, if all 3 basis vectors are independently taking the fastest path to their destination, then they will not necessarily stay orthogonal during interpolation
        // what should we do instead?
        // one thing we could do is to just slerp the Z basis vector and then construct the X and Y vectors from the Z vector

        return sphericalToCartesian(c);
    } else if (a instanceof Mat4) {
        // slerp the 3 basis vectors as well as the translation
        // return new Mat4({
        //     X: slerp(a.X, b.X, t),
        //     Y: slerp(a.Y, b.Y, t),
        //     Z: slerp(a.Z, b.Z, t),
        //     T: {...slerp(a.T, b.T, t), w: 1}
        // });

        // don't slerp the three basis vectors

        // just slerp the Z vector

        // this is actually an interesting question
        // let's try just slerping Z and rebuilding X and Y
        // but this solution isn't completely correct because it doesn't account for if the matrix was rotated about Z

        const Z = slerp(a.Z, b.Z, t);
        const X = Vec3.up.cross(Z).normalize();
        const Y = Z.cross(X).normalize();
        const T = {...slerp(a.T, b.T, t), w: 1}

        return new Mat4({X, Y, Z, T});



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

export function distance(a, b) {
    return a.minus(b).length();
}
































