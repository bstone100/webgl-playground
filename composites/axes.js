import {SceneNode} from "../scene-node.js";
import {Axis} from "./axis.js";

export class Axes extends SceneNode {
    #X; #Y; #Z;
    constructor(props, gl) {
        super(props);

        this.#X = new Axis({
            axis: "X",
            parent: this
        }, gl);
        this.#Y = new Axis({
            axis: "Y",
            parent: this
        }, gl);
        this.#Z = new Axis({
            axis: "Z",
            parent: this
        }, gl);
    }
}