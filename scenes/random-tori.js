// let's make a scene with javascript this time

import {SceneNode} from "../scene-node.js";
import {Torus} from "../shapes/torus.js";
import {random, sphericalToCartesian} from "../math/utils.js";
import {Color} from "../math/color.js";
import {Mat4} from "../math/mat4.js";

export function buildScene(gl) {
    // spawn some tori in a unit circle

    const root = new SceneNode();

    for (let i = 0; i < 20; i++) {
        const torus = new Torus({
            minorRadius: random(0.05, 0.25),
            majorRadius: random(0.25, 0.5),
            color: new Color({r: Math.random(), g: Math.random(), b: Math.random(), a: 1}),
            scaleMatrix: Mat4.scale({x: random(0.75, 1.25), y: random(0.75, 1.25), z: random(0.75, 1.25)}),
            translationMatrix: Mat4.translate(sphericalToCartesian({
                radius: 1.5,
                theta: random(0, 2 * Math.PI),
                phi: random(0, 2 * Math.PI)
            }))
        }, gl);

        torus.setParent(root);
    }

    return root;
}