import {drawSceneObject, objectToClassInstance, objectToSceneNode, resizeCanvasToDisplaySize} from "./helpers.js";
import {Vec3} from "./math/vec3.js";
import {Mat4} from "./math/mat4.js";
import {cartesianToSpherical, clamp, isPointInRect, radiansToDegrees, sphericalToCartesian} from "./math/utils.js";

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

// note: we could animate the position change to make this smoother for a scroll wheel
canvas.addEventListener("wheel", event => {
    event.preventDefault(); // prevent the page from being scrolled

    // console.log(event);

    if (event.deltaY === 0 || event.deltaMode !== event.DOM_DELTA_PIXEL) return;

    // find the camera again
    const camera = activeSceneInfo.cameras[0];
    let currentPos = camera.translationMatrix.getTranslation();

    const radius = currentPos.length();

    const newRadius = clamp(1, radius + event.deltaY * 0.01, 100);

    const newPos = currentPos.normalize().times(newRadius);

    camera.translationMatrix.setTranslation(newPos);
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
    console.log({type: event.type, button: event.button});

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
    switch (mouseButtonDown) {
        // left mouse button
        case 0: {
            const deltaX_px = event.clientX - prevMouseX; // so moving cursor right is +delta, left is -delta
            const deltaY_px = event.clientY - prevMouseY; // moving cursor down is +delta, up is -delta

            prevMouseX = event.clientX;
            prevMouseY = event.clientY;

            if (deltaX_px === 0 && deltaY_px === 0) {
                return;
            }

            // need to map delta from px to radians
            const deltaX_angle = deltaX_px * Math.PI / canvas.width;
            const deltaY_angle = deltaY_px * Math.PI / canvas.height;

            const camera = activeSceneInfo.cameras[0];
            let currentPos = camera.translationMatrix.getTranslation();

            const {
                radius,
                theta,
                phi
            } = cartesianToSpherical(currentPos);

            console.log({
                theta: radiansToDegrees(theta),
                phi: radiansToDegrees(phi)
            });

            // now add deltas to theta and phi, then convert back to cartesian
            // I'm subtracting the delta angles now because of the definitions of theta and phi that I'm using

            const newPos = sphericalToCartesian({
                radius,
                theta: theta - deltaY_angle,
                phi: phi - deltaX_angle
            });

            camera.translationMatrix.setTranslation(newPos);

            // we also need to update the rotation matrix so that the camera is still pointing at the origin
            camera.rotationMatrix = new Mat4({
                lookAt: new Vec3({x: 0, y: 0, z: 0}),
                from: newPos
            });

            break;
        }
        // right mouse button
        case 2: {
            // okay now let's pan the camera around if the right mouse button is being held

            // for panning left and right, I think the desired behavior is that we translate the camera along a line perpendicular to the translation vector

            // panning is actually simple, we're translating the camera along the right and up basis vectors of the camera's rotation matrix
            // so that is just the ray formula: p = origin + t * direction, where origin is the camera's translation and direction is either the up or right rotation basis vector

            const deltaX_px = event.clientX - prevMouseX; // so moving cursor right is +delta, left is -delta
            const deltaY_px = event.clientY - prevMouseY; // moving cursor down is +delta, up is -delta

            prevMouseX = event.clientX;
            prevMouseY = event.clientY;

            if (deltaX_px === 0 && deltaY_px === 0) {
                return;
            }

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
    // isMouseDown = false;
    console.log({type: event.type, button: event.button});
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































