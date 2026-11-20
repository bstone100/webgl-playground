import {Mat4} from "./math/mat4.js";

// a SceneNode has a transform but no geometry
export class SceneNode {
    constructor(props) {
        const {
            name = "",
            description = "",
            notes = "",
            transform = new Mat4,
            children = []
        } = props;

        this.name = name;
        this.description = description;
        this.notes = notes;
        this.transform = transform;
        this.children = children;
    }
}