import {Mat4} from "./math/mat4.js";
import {clamp, cubicBezier, easingFunction, slerp} from "./math/utils.js";

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
            animation = null,
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
        this.animation = animation;

        // let's sort the animation keyframes by t
        if (this.animation && this.animation.keyframes) {
            this.animation.keyframes.sort((a, b) => a.t - b.t);
        }

        this.children = children;
        this.parent = parent;
    }

    // let's rewrite the transform functions to account for animation
    // sceneInfo will be optionally passed, and what we need from it is just startTime and currentTime
    getLocalTransform({startTime, currentTime}) {
        if (startTime === undefined || currentTime === undefined || !this.animation) {
            return this.translationMatrix.times(this.rotationMatrix).times(this.scaleMatrix);
        }

        // now how do we control the animation?
        // "animation": {
        //     "duration": 10,
        //         "unit": "s",
        //         "iterations": 1,
        //         "easing": "linear",
        //         "keyframes": [
        //         {
        //             "t": 0,

        // give defaults to unset properties
        const {
            duration = 3000,
            unit = "ms",
            iterations = 1,
            easing = {type: "linear"},
            keyframes = [],
            direction = "forward"
        } = this.animation;

        if (keyframes.length === 0) {
            return this.translationMatrix.times(this.rotationMatrix).times(this.scaleMatrix);
        }

        if (keyframes.length === 1) {
            const kf = keyframes[0];

            const {
                translationMatrix: T = this.translationMatrix,
                rotationMatrix: R = this.rotationMatrix,
                scaleMatrix: S = this.scaleMatrix
            } = kf;

            return T.times(R).times(S);
        }

        const timeElapsedMs = currentTime - startTime;

        const durationMs = unit === "ms" ? duration : duration * 1000;

        const iteration = Math.floor(timeElapsedMs / durationMs);

        if (iteration >= iterations && iterations !== "infinite") {
            const lastKf = keyframes.at(-1);

            const {
                translationMatrix: T = this.translationMatrix,
                rotationMatrix: R = this.rotationMatrix,
                scaleMatrix: S = this.scaleMatrix
            } = lastKf;

            return T.times(R).times(S);
        }

        let tIteration = (timeElapsedMs % durationMs) / durationMs;

        if (direction === "reverse") {
            tIteration = 1 - tIteration;
        } else if (direction === "alternate") {
            // just check if this is an odd iteration and reverse
            if (iteration % 2 === 1) {
                tIteration = 1 - tIteration;
            }
        }

        // okay there is an edge case which is when tIteration is exactly 1
        // we may want to also consider cases where it's less than 0 or greater than 1

        // the problem with exactly 1 is that doing floor(tIteration * (length - 1)) gives the last keyframe, but then kf2 will be out of index
        // I think if the value is exactly 1 we should set kf1index to 1 less so that kf2 will be the last index
        // t will still be 1 and slerp will just take on the last keyframe

        // also, should we clamp tIteration to 0,1 just in case
        // I don't think that's necessary, elapsed mod duration will always be in [0, duration)
        // but I think floating point error means that the division by duration can sometimes produce 1

        // note: ensure these are both valid

        // doing this just in case
        tIteration = clamp(0, tIteration, 1);

        let kf1Index;
        let kf2Index;
        if (tIteration === 1) {
            kf1Index = keyframes.length - 2;
            kf2Index = keyframes.length - 1;
        } else {
            kf1Index = Math.floor(tIteration * (keyframes.length - 1));
            kf2Index = kf1Index + 1;
        }

        const kf1 = keyframes[kf1Index];
        const kf2 = keyframes[kf2Index];

        const {
            translationMatrix: T1 = this.translationMatrix,
            rotationMatrix: R1 = this.rotationMatrix,
            scaleMatrix: S1 = this.scaleMatrix
        } = kf1;

        const {
            translationMatrix: T2 = this.translationMatrix,
            rotationMatrix: R2 = this.rotationMatrix,
            scaleMatrix: S2 = this.scaleMatrix
        } = kf2;

        const kf1Transform = T1.times(R1).times(S1);
        const kf2Transform = T2.times(R2).times(S2);

        // now we need to identify the t value to use for slerping between the keyframes
        let tKeyframe = (tIteration - kf1.t) / (kf2.t - kf1.t);

        // need to apply easing function here to tKeyframe
        if (easing.type === "cubic-bezier") {
            tKeyframe = cubicBezier(...easing.values, tKeyframe);
        } else {
            tKeyframe = easingFunction(easing.type, tKeyframe);
        }

        // now we can slerp
        return slerp(kf1Transform, kf2Transform, tKeyframe);
    }

    getWorldTransform(sceneInfo) {
        if (this.parent) {
            return this.parent.getWorldTransform(sceneInfo).times(this.getLocalTransform(sceneInfo));
        } else {
            return this.getLocalTransform(sceneInfo);
        }
    }

}






























