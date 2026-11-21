import {Mat4} from "./math/mat4.js";

// a SceneNode has a transform but no geometry
export class SceneNode {
    constructor(props) {
        const {
            name = "",
            description = "",
            notes = "",
            translationMatrix = new Mat4,
            rotationMatrix = new Mat4,
            scaleMatrix = new Mat4,
            children = [],
            parent = null
        } = props;

        this.name = name;
        this.description = description;
        this.notes = notes;

        // we should store scale, rotation, translation separately
        // every frame we'll compute the model transform by doing translation * rotation * scale
        // and we need to pass the world transform to the vertex shader not the local transform
        // so we'll need to walk the tree hierarchy up to the root to compute the world transform
        // that means we need a reference to the parent node

        this.translationMatrix = translationMatrix;
        this.rotationMatrix = rotationMatrix;
        this.scaleMatrix = scaleMatrix;


        this.children = children;
        this.parent = parent;
    }

    get localTransform() {
        return this.translationMatrix.times(this.rotationMatrix).times(this.scaleMatrix);
    }

    // walk the tree to the root
    // at each level do parent.worldTransform * this.localTransform
    // we need to be caching this information
    get worldTransform() {
        if (this.parent) {
            return this.parent.worldTransform.times(this.localTransform);
        } else {
            return this.localTransform;
        }
    }
}






























