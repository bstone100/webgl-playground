import {Cylinder} from "../shapes/cylinder.js";
import {Cone} from "../shapes/cone.js";
import {SceneNode} from "../scene-node.js";
import {Color} from "../math/color.js";
import {Vec3} from "../math/vec3.js";
import {Mat4} from "../math/mat4.js";

// should this extend SceneObject or SceneNode?
// I'm going to do SceneObject, wait no, it should be SceneNode since we don't want draw() called on this object
export class Axis extends SceneNode {
    #cylinder;
    #cone

    constructor(props = {}, gl) {
        super(props);

        const {
            axis = "Y"
        } = props;

        this.axis = axis.toUpperCase();

        this.#cylinder = new Cylinder({
            radius: 0.02,
            height: 1,
            parent: this
        }, gl);
        this.#cone = new Cone({
            radius: 0.04,
            height: 0.1,
            parent: this
        }, gl);

        // set transform and color
        switch (this.axis) {
            case "Y": {
                // translate cylinder up by its height / 2
                this.#cylinder.translationMatrix.setTranslation(new Vec3({y: this.#cylinder.height / 2}));

                // translate cone up by cylinder height plus cone height / 2
                this.#cone.translationMatrix.setTranslation(new Vec3({y: this.#cylinder.height + this.#cone.height / 2}));

                this.#cylinder.color = new Color({r: 0, g: 1, b: 0, a: 1});
                this.#cone.color = new Color({r: 0, g: 1, b: 0, a: 1});
                break;
            }
            case "X": {
                this.#cylinder.rotationMatrix = Mat4.rotate({
                    angle: 90,
                    unit: "degrees",
                    direction: "clockwise",
                    axis: "Z"
                });
                this.#cone.rotationMatrix = Mat4.rotate({
                    angle: 90,
                    unit: "degrees",
                    direction: "clockwise",
                    axis: "Z"
                });

                // now translate along x axis
                this.#cylinder.translationMatrix.setTranslation(new Vec3({x: this.#cylinder.height / 2}));
                this.#cone.translationMatrix.setTranslation(new Vec3({x: this.#cylinder.height + this.#cone.height / 2}));

                this.#cylinder.color = new Color({r: 1, g: 0, b: 0, a: 1});
                this.#cone.color = new Color({r: 1, g: 0, b: 0, a: 1});
                break;
            }
            case "Z": {
                // rotate 90 degrees counterclockwise about x axis
                this.#cylinder.rotationMatrix = Mat4.rotate({
                    angle: 90,
                    unit: "degrees",
                    direction: "counterclockwise",
                    axis: "X"
                });
                this.#cone.rotationMatrix = Mat4.rotate({
                    angle: 90,
                    unit: "degrees",
                    direction: "counterclockwise",
                    axis: "X"
                });

                // translate on z
                this.#cylinder.translationMatrix.setTranslation(new Vec3({z: this.#cylinder.height / 2}));
                this.#cone.translationMatrix.setTranslation(new Vec3({z: this.#cylinder.height + this.#cone.height / 2}));

                this.#cylinder.color = new Color({r: 0, g: 0, b: 1, a: 1});
                this.#cone.color = new Color({r: 0, g: 0, b: 1, a: 1});
                break;
            }
        }
    }
}





















