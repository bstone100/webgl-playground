import {Mat4} from "./math/mat4.js";
import {slerp} from "./math/utils.js";

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

        // okay we have start time and current time which is enough info to control an animation

        // now how do we control the animation?
        // "animation": {
        //     "duration": 10,
        //         "unit": "s",
        //         "iterations": 1,
        //         "easing": "linear",
        //         "keyframes": [
        //         {
        //             "t": 0,


        // we need to find where we are in the timeline
        // that means first we find t
        // we also need to be counting which iteration we're on
        // actually we don't need to count that, it is computable from the current time

        // give defaults to unset properties
        const {
            duration = 3000,
            unit = "ms",
            iterations = 1,
            easing = "linear",
            keyframes = [] // we need a plan for when there are 0 or 1 keyframes
        } = this.animation;

        const timeElapsedMs = currentTime - startTime;

        const durationMs = unit === "ms" ? duration : duration * 1000;

        // what iteration are we on?
        // if time elapsed = 7000, duration = 3000, its iteration Math.floor(elapsed / duration)
        // assuming that we start on iteration 0

        const iteration = Math.floor(timeElapsedMs / durationMs);

        // if iteration >= iterations then we don't animate
        // in that case we can either set the transform via the properties or via the last keyframe

        // now find t, which is what percent of the way through the current iteration are we

        const tIteration = (timeElapsedMs % durationMs) / durationMs;

        // now we need to find the two keyframes that we're in between

        // each keyframe has a t associated with it
        // so tIteration is in between two of those t values

        // keyframes are already sorted by t
        // we need to find the "before" keyframe and the "after" keyframe

        // we can use the length of the keyframes array to find the correct index of the before keyframe

        // keyframe indexes are [0, keyframes.length - 1]
        // we can map tIteration from [0, 1] to [0, keyframes.length - 1]

        // do special handling here for 0 or 1 keyframe
        // for 0 just use the transform properties of this node
        // for 1 always use the keyframe's transforms, don't interpolate

        // within a keyframe, for any of the 3 transform types that aren't set, use this node's properties instead

        if (keyframes.length >= 2) {
            // note: ensure these are both valid
            const kf1Index = Math.floor(tIteration * (keyframes.length - 1));
            const kf2Index = kf1Index + 1;

            const kf1 = keyframes[kf1Index];
            const kf2 = keyframes[kf2Index];

            // now build the local transform at both keyframes and then slerp between them

            // extract the matrices from the keyframes, using this object's properties as defaults
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
            const tKeyframe = (tIteration - kf1.t) / (kf2.t - kf1.t);

            // need to apply easing function here to tKeyframe

            // now we can slerp
            return slerp(kf1Transform, kf2Transform, tKeyframe);
        }
    }

    getWorldTransform(sceneInfo) {
        if (this.parent) {
            return this.parent.getWorldTransform(sceneInfo).times(this.getLocalTransform(sceneInfo));
        } else {
            return this.getLocalTransform(sceneInfo);
        }
    }

}






























