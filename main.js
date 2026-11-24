import {drawSceneObject, objectToClassInstance, objectToSceneNode, resizeCanvasToDisplaySize} from "./helpers.js";
import {Vec3} from "./math/vec3.js";
import {Mat4} from "./math/mat4.js";
import {cartesianToSpherical, radiansToDegrees, sphericalToCartesian} from "./math/utils.js";

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


// let's add event listeners to the canvas and set up camera controls

let isMouseDown = false;
let prevMouseX = 0;
let prevMouseY = 0;

// mouse down must occur within canvas
window.addEventListener("mousedown", event => {
    const canvasRect = canvas.getBoundingClientRect();

    if (event.clientX > canvasRect.left && event.clientX < canvasRect.right &&
        event.clientY > canvasRect.top && event.clientY < canvasRect.bottom) {

        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        isMouseDown = true;
    }
});
window.addEventListener("mousemove", event => {
    if (isMouseDown) {
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
    }
});
window.addEventListener("mouseup", event => {
    isMouseDown = false;
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































