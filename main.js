import {drawSceneObject, objectToClassInstance, objectToSceneNode, resizeCanvasToDisplaySize} from "./helpers.js";
import {Vec3} from "./math/vec3.js";
import {Mat4} from "./math/mat4.js";
import {
    cartesianToSpherical,
    clamp,
    distance,
    isPointInRect,
    radiansToDegrees,
    sphericalToCartesian
} from "./math/utils.js";
import {Point2} from "./math/point2.js";
import {Point3} from "./math/point3.js";
import {Ray} from "./math/ray.js";

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");

// fetch a list of scenes
const sceneIndex = await fetch("./scene-index.json").then(res => res.json());

// populate <select> with the scenes

const selectSceneElement = document.querySelector("#select-scene");

for (const scene of sceneIndex) {
    selectSceneElement.insertAdjacentHTML("beforeend", `<option value="${scene.file}">${scene.name}</option>`);
}

// when the select value changes, fetch the active scene

let activeScene = null;
let activeSceneInfo = null;

async function setActiveScene() {
    const sceneObject = await fetch(`./scenes/${selectSceneElement.value}`).then(res => res.json());

    // this could be a long operation because it's loading a shader program for each object in the tree
    // for the future: could be done in a web worker, maybe

    // let's build up meta info about our scene while we parse it
    // fill these with references to SceneNodes
    // note that this information can change between renders if the scene graph is modified, so it should be kept in sync
    const sceneInfo = {
        ambientLights: [],
        pointLights: [],
        spotLights: [],
        cameras: []
    };
    const sceneNode = objectToClassInstance(sceneObject, sceneInfo, gl);

    if (sceneNode) {
        activeScene = sceneNode;
        activeSceneInfo = sceneInfo;
    }
}

selectSceneElement.addEventListener("change", setActiveScene);

await setActiveScene();

const homeButton = document.querySelector("#home-button");

homeButton.addEventListener("click", () => {
    // find camera
    const camera = activeSceneInfo.cameras[0];

    const homePos = new Vec3({x: 3, y: 3, z: 3});

    const distanceFromHome = distance(camera.translationMatrix.getTranslation(), homePos);

    const velocity = 20; // world units per second

    // calculate the duration of the animation given the distance of the animation and a velocity of motion
    // this means the shorter the distance, the faster the animation
    let duration = distanceFromHome / velocity;

    // cap duration to one second
    duration = Math.min(duration, 1);

    camera.doSingleAnimation({
        duration,
        unit: "s",
        retain: true,
        easing: {type: "ease-in-cubic"},
        keyframes: [
            {
                t: 1,
                translationMatrix: new Mat4({
                    position: homePos
                }),
                rotationMatrix: new Mat4({
                    lookAt: new Vec3({x: 0, y: 0, z: 0}),
                    from: homePos
                })
            }
        ]
    });
});

// note: we could animate the position change to make this smoother for a scroll wheel

// zoom the camera towards or away from the part of the scene under the cursor
canvas.addEventListener("wheel", event => {
    event.preventDefault(); // prevent the page from being scrolled

    if (event.deltaY === 0 || event.deltaMode !== event.DOM_DELTA_PIXEL) return;

    // console.log(event);

    // find the camera again
    const camera = activeSceneInfo.cameras[0];

    const cursorPos_canvas = new Point2({
        x: event.offsetX,
        y: event.offsetY
    });

    const aspectRatio = canvas.width / canvas.height;
    const viewport = camera.getViewport(aspectRatio);

    // convert cursor position from canvas space to camera space
    // this is a point somewhere on the viewport which is the near face of the viewing frustum
    const cursorPos_viewport = new Point3({
        x: cursorPos_canvas.x / canvas.clientWidth * (viewport.right - viewport.left) + viewport.left,
        y: (1 - cursorPos_canvas.y / canvas.clientHeight) * (viewport.top - viewport.bottom) + viewport.bottom,
        z: -camera.near
    });

    // now convert to world space
    const cursorPos_world = camera.getWorldTransform().times(cursorPos_viewport);

    // now form the ray from the camera to the cursor position
    let cameraPos = camera.getWorldTransform().getTranslation();

    const cameraToCursorRay = new Ray({
        origin: cameraPos,
        direction: cameraPos.minus(cursorPos_world).normalize()
    });

    // now walk the ray

    const delta_world = event.deltaY * 0.01;

    const newPos = cameraToCursorRay.at(delta_world);

    // animate the camera to its new position
    camera.doSingleAnimation({
        duration: 100,
        unit: "ms",
        retain: true,
        easing: "ease-in-out-cubic",
        keyframes: [
            {
                t: 1,
                translationMatrix: new Mat4({
                    position: newPos
                })
            }
        ]
    });
});

// block context menu so that we can use right mouse button to pan camera
canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
})

let mouseButtonDown = -1;
let prevMouseX = 0;
let prevMouseY = 0;

// mouse down must occur within canvas
// check that it's mouse button 1
window.addEventListener("mousedown", event => {
    // console.log({type: event.type, button: event.button});

    if (mouseButtonDown === -1) {
        const canvasRect = canvas.getBoundingClientRect();

        if (isPointInRect(event.clientX, event.clientY, canvasRect)) {
            prevMouseX = event.clientX;
            prevMouseY = event.clientY;
            mouseButtonDown = event.button;
        }
    }
});
window.addEventListener("mousemove", event => {
    if (mouseButtonDown === -1) return;

    const deltaX_px = event.clientX - prevMouseX; // so moving cursor right is +delta, left is -delta
    const deltaY_px = event.clientY - prevMouseY; // moving cursor down is +delta, up is -delta

    prevMouseX = event.clientX;
    prevMouseY = event.clientY;

    if (deltaX_px === 0 && deltaY_px === 0) {
        return;
    }

    switch (mouseButtonDown) {
        // left mouse button
        case 0: {
            // need to map delta from px to radians
            const deltaX_angle = deltaX_px * Math.PI / canvas.width;
            const deltaY_angle = deltaY_px * Math.PI / canvas.height;

            const camera = activeSceneInfo.cameras[0];
            const currentPos = camera.translationMatrix.getTranslation();

            // we need to take spherical coordinates relative to the point of rotation

            // first find the point of rotation
            // build a ray and then find the intersection between the ray and the xz plane
            const rotationZ = camera.rotationMatrix.getRotationZ();

            const ray = new Ray({
                origin: currentPos,
                direction: rotationZ
            });

            // find t of intersection given that y = 0 on the xz plane
            const t = -ray.origin.y / ray.direction.y;

            // now find the hit point
            const hitPoint = ray.at(t);

            // now use the hitPoint as the origin of rotation
            // that means we need to adjust currentPos by hitPoint before using the spherical functions
            // and afterward do the reverse adjustment
            // in general, what we are doing is defining a new local coordinate system with origin at hitPoint and default rotation
            // we need to convert currentPos from world coordinates to the local system by doing localSystemTransform.inverse * currentPos
            // then use spherical coordinates in local space, and when we're doing, convert back to world with localSystemTransform * currentPos

            // doing this is a shortcut, we can skip doing an inverse matrix and matrix multiplication because we're not changing the rotation
            const currentPosLocal = currentPos.minus(hitPoint);

            const {
                radius,
                theta,
                phi
            } = cartesianToSpherical(currentPosLocal);

            // now add deltas to theta and phi, then convert back to cartesian
            // I'm subtracting the delta angles now because of the definitions of theta and phi that I'm using

            const newPosLocal = sphericalToCartesian({
                radius,
                theta: theta - deltaY_angle,
                phi: phi - deltaX_angle
            });

            // convert back to world space
            const newPosWorld = newPosLocal.plus(hitPoint);

            camera.translationMatrix.setTranslation(newPosWorld);

            // we also need to update the rotation matrix so that the camera is still pointing at the origin
            camera.rotationMatrix = new Mat4({
                lookAt: hitPoint,
                from: newPosWorld
            });

            break;
        }
        // right mouse button
        case 2: {
            // now map the deltas from px to world coordinates, similar to the mapping for zooming

            // let's just start with something simple
            const deltaX_world = -deltaX_px * 0.01;
            const deltaY_world = deltaY_px * 0.01;

            // do x first: move along right basis vector

            const camera = activeSceneInfo.cameras[0];
            let currentPos = camera.translationMatrix.getTranslation();
            const rotationX = camera.rotationMatrix.getRotationX();
            const rotationY = camera.rotationMatrix.getRotationY();

            // move along rotation x
            currentPos = currentPos.plus(rotationX.times(deltaX_world));
            // now move along rotation y
            currentPos = currentPos.plus(rotationY.times(deltaY_world));

            // that should do the trick
            camera.translationMatrix.setTranslation(currentPos);

            break;
        }
    }
});
window.addEventListener("mouseup", event => {
    // console.log({type: event.type, button: event.button});
    if (event.button === mouseButtonDown) {
        mouseButtonDown = -1;
    }
});

activeSceneInfo.startTime = performance.now();

// this function is called every frame
function draw() {
    resizeCanvasToDisplaySize(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1, 1, 1, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    activeSceneInfo.currentTime = performance.now();

    // recursively draw the scene
    if (activeScene) {
        drawSceneObject(activeScene, activeSceneInfo);
    }

    requestAnimationFrame(draw);
}

draw();































