import {Mat4} from "./math/mat4.js";
import {clamp, cubicBezier, easingFunction, slerp} from "./math/utils.js";

// a SceneNode has a transform but no geometry
export class SceneNode {
    #animationFinished = false;
    #singleShotAnimation = null;

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
        this.animation?.keyframes?.sort((a, b) => a.t - b.t);

        this.children = children;
        this.parent = parent;
    }

    get defaultLocalTransform() {
        return this.translationMatrix.times(this.rotationMatrix).times(this.scaleMatrix);
    }

    // this will apply a single shot animation
    // note: could return a Promise that fulfills when the animation finishes
    doSingleAnimation(animation) {
        if (!animation) return;
        animation?.keyframes.sort((a, b) => a.t - b.t);
        this.#singleShotAnimation = {
            ...animation,
            iterations: 1,
            startTime: performance.now()
        };
    }

    // let's rewrite the transform functions to account for animation
    // sceneInfo will be optionally passed, and what we need from it is just startTime and currentTime
    getLocalTransform({startTime, currentTime} = {}) {
        if (startTime === undefined || currentTime === undefined) {
            return this.defaultLocalTransform;
        }

        // pick between this.animation and this.#singleShotAnimation
        const animation = this.#singleShotAnimation ?? this.animation;

        if (!animation) {
            return this.defaultLocalTransform;
        }

        // give defaults to unset properties
        const {
            delay = 0,
            duration = 3000,
            unit = "ms",
            iterations = 1,
            retain = true,
            easing = {type: "linear"},
            keyframes = [],
            direction = "forward"
        } = animation;

        // no keyframes return early
        if (keyframes.length === 0) {
            return this.defaultLocalTransform;
        }

        const delayMs = unit === "ms" ? delay : delay * 1000;

        //  if the animation object has its own startTime then use it instead of the global one
        const timeElapsedMs = currentTime - (animation.startTime ?? startTime) - delayMs;

        // we're in the delay period, return early
        if (timeElapsedMs < 0) {
            return this.defaultLocalTransform;
        }

        // if there is only one keyframe and it's at t = 0, don't do an animation, just take on the transform of the keyframe
        // but, how long the object should "hold" the keyframe depends on other properties of the animation
        // if there is a fixed number of iterations, then the object should hold the position of that one keyframe for iterations * duration time
        // if it's infinite iterations, then the object should become stuck in that position

        // here's an idea: for this case we could insert a keyframe at t = 1 with the same properties as the one keyframe
        // so let's postpone handling this case until after we have done the other logic

        // if (keyframes.length === 1 && keyframes[0].t === 0) {
        //     const kf = keyframes[0];
        //
        //     const {
        //         translationMatrix: T = this.translationMatrix,
        //         rotationMatrix: R = this.rotationMatrix,
        //         scaleMatrix: S = this.scaleMatrix
        //     } = kf;
        //
        //     return T.times(R).times(S);
        // }

        if (animation === this.animation && this.#animationFinished) {
            return this.defaultLocalTransform;
        }

        const durationMs = unit === "ms" ? duration : duration * 1000;

        const iteration = Math.floor(timeElapsedMs / durationMs);

        // when we are done with iterating, just take on the transform of the last animation
        // or perhaps we should stop referencing keyframes at this point
        // in CSS it is an option to acquire the last keyframe of the animation when it finishes

        // there may be cases where we want an animation to remove itself from the object when it's done

        // okay I've added a boolean retain property to animations
        // true means at the end of the iterations we should set this object's default transforms to those of the last keyframe
        // false means we should not do that
        // in the true case, we should only do this action once, at the end of animation, don't continually apply the last keyframe every frame afterward
        // we should set a flag on the animation object when it is finished



        if (iteration >= iterations && iterations !== "infinite") {

            // we've made it past last iteration

            // conditionally apply the retain policy
            // we need to account for the direction property
            // if the direction is reversed take the first keyframe
            // if the direction was alternate and iterations is even, then take the first keyframe
            // if direction is alternate and iterations is odd, take last keyframe

            if (retain) {
                let kf;
                if (direction === "forward") kf = keyframes.at(-1);
                if (direction === "reverse") kf = keyframes[0];
                if (direction === "alternate" && iterations % 2 === 1) kf = keyframes.at(-1);
                if (direction === "alternate" && iterations % 2 === 0) kf = keyframes[0];

                if (kf.translationMatrix) this.translationMatrix = kf.translationMatrix;
                if (kf.rotationMatrix) this.rotationMatrix = kf.rotationMatrix;
                if (kf.scaleMatrix) this.scaleMatrix = kf.scaleMatrix;
            }

            // if this was a single shot animation we should remove the reference
            // the flag is only needed for this.animation because we want to retain the property after it is finished

            if (animation === this.#singleShotAnimation) {
                this.#singleShotAnimation = null;
            } else if (animation === this.animation) {
                this.#animationFinished = true;
            }

            return this.defaultLocalTransform;
        }

        // beyond this point we will be doing an animation

        // okay let's insert a keyframe at t = 0 if there isn't one already
        // this way the object will animate from its start position to the one keyframe
        if (keyframes[0].t !== 0) {
            keyframes.unshift({
                t: 0
            });
        }

        // second odd case: only one keyframe at t = 0
        // in this case let's add a duplicate of it at t = 1
        if (keyframes.length === 1 && keyframes[0].t === 0) {
            keyframes.push({
                ...keyframes[0],
                t: 1,
            });
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

        // doing this just in case
        tIteration = clamp(0, tIteration, 1);

        let kf1Index;
        let kf2Index;
        if (tIteration === 1) {
            // this is an edge case where due to floating point error (elapsed % duration) / duration gives 1
            kf1Index = keyframes.length - 2;
            kf2Index = keyframes.length - 1;
        } else {
            kf1Index = Math.floor(tIteration * (keyframes.length - 1));
            kf2Index = kf1Index + 1;
        }

        // let's properly handle the case when there is only one keyframe
        // I think in this case we should insert a keyframe at t = 0 with the default transform
        // but only do that if the one keyframe has t > 0
        // I think we may want to always insert a keyframe at t = 0 when there isn't already a keyframe at t = 0
        // so that the object will animate to the first listed keyframe
        // but we shouldn't stick a keyframe at the end because we want the object to take on the transform of the last keyframe

        // in the case that there is only one keyframe and the keyframe is at t = 0, then there won't be an animation, we'll set the transform to that keyframe's and exit early

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






























