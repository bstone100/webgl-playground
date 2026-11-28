import {Mat4} from "./math/mat4.js";
import {clamp, cubicBezier, easingFunction, lerp, lerpTransform, slerp} from "./math/utils.js";

// a SceneNode has a transform but no geometry
export class SceneNode {
    #animationFinished = false;
    #singleShotAnimation = null;

    constructor(props = {}) {
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
        if (parent) {
            parent.addChild(this);
        }
    }

    addChild(child) {
        if (!child) return;
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child) {
        if (!child || child.parent !== this) return;
        child.parent = null;
        this.children = this.children.filter(c => c !== child);
    }

    setParent(parent) {
        if (parent) {
            parent.addChild(this);
        } else if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    get defaultLocalTransform() {
        return this.translationMatrix.times(this.rotationMatrix).times(this.scaleMatrix);
    }

    // note: could return a Promise that fulfills when the animation finishes
    doSingleAnimation(animation) {
        if (!animation) return;
        animation?.keyframes.sort((a, b) => a.t - b.t);

        // if we were in the middle of a single shot animation we need to end it right now and apply the retain policy
        if (this.#singleShotAnimation && this.#singleShotAnimation.retain) {
            const localTransform = this.getLocalTransform({
                startTime: this.#singleShotAnimation.startTime,
                currentTime: performance.now()
            });

            this.translationMatrix = localTransform.getTranslationMatrix();
            this.rotationMatrix = localTransform.getRotationMatrix();
            this.scaleMatrix = localTransform.getScaleMatrix();
        }

        // now we can just swap the reference to point to the new single shot animation
        // in effect, we're changing the target of the previous animation mid flight and adding more time

        this.#singleShotAnimation = {
            ...animation,
            iterations: 1,
            startTime: performance.now()
        };
    }

    // this function determines where this node is in 3D space given the current time
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
            direction = "forward",
            path = "linear"
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

        // animation already finished
        if (animation === this.animation && this.#animationFinished) {
            return this.defaultLocalTransform;
        }

        const durationMs = unit === "ms" ? duration : duration * 1000;

        const iteration = Math.floor(timeElapsedMs / durationMs);

        // animation has just finished, apply the retain policy
        if (iteration >= iterations && iterations !== "infinite") {

            // set the object's transform to the last keyframe that played
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

        // insert a keyframe at t = 0 if there isn't one already
        // this way the object will animate from its start position to the one keyframe
        if (keyframes[0].t !== 0) {
            keyframes.unshift({
                t: 0
            });
        }

        // if there is only one keyframe and it's at t = 0, then add a duplicate of it at t = 1
        // the object will do the one keyframe's pose the whole time
        if (keyframes.length === 1 && keyframes[0].t === 0) {
            keyframes.push({
                ...keyframes[0],
                t: 1,
            });
        }

        // this is a value in [0, 1] that says how far we are through the current iteration
        let tIteration = (timeElapsedMs % durationMs) / durationMs;

        if (direction === "reverse") {
            tIteration = 1 - tIteration;
        } else if (direction === "alternate") {
            // just check if this is an odd iteration and reverse
            if (iteration % 2 === 1) {
                tIteration = 1 - tIteration;
            }
        }

        tIteration = clamp(0, tIteration, 1);

        let kf1Index;
        let kf2Index;
        if (tIteration === 1) {
            // this is an edge case where due to floating point error (elapsed % duration) / duration gives 1
            kf1Index = keyframes.length - 2;
            kf2Index = keyframes.length - 1;
        } else {
            // use tIteration as an index into the keyframes array
            kf1Index = Math.floor(tIteration * (keyframes.length - 1));
            kf2Index = kf1Index + 1;
        }

        // at this point we can finally grab our two keyframes and interpolate between them

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

        // this is a value in [0, 1] that says how far we are in between the two keyframes
        let tKeyframe = (tIteration - kf1.t) / (kf2.t - kf1.t);

        // apply the easing function
        if (easing.type === "cubic-bezier") {
            tKeyframe = cubicBezier(...easing.values, tKeyframe);
        } else {
            tKeyframe = easingFunction(easing.type, tKeyframe);
        }

        // now we are ready to do interpolation between the two keyframes
        return lerpTransform(kf1Transform, kf2Transform, tKeyframe, path);
    }

    getWorldTransform(sceneInfo) {
        if (this.parent) {
            return this.parent.getWorldTransform(sceneInfo).times(this.getLocalTransform(sceneInfo));
        } else {
            return this.getLocalTransform(sceneInfo);
        }
    }

}






























