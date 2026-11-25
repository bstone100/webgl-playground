import {drawSceneObject, objectToClassInstance, objectToSceneNode, resizeCanvasToDisplaySize} from "./helpers.js";
import {Vec3} from "./math/vec3.js";
import {Mat4} from "./math/mat4.js";
import {cartesianToSpherical, clamp, isPointInRect, radiansToDegrees, sphericalToCartesian} from "./math/utils.js";
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

// I want to animate this
homeButton.addEventListener("click", () => {
    // find camera
    const camera = activeSceneInfo.cameras[0];

    // instead of directly setting the transform, let's set an animation

    // need to re-enable the animationFinished flag on the scene node
    // should probably not be setting animation property directly
    // also we need a way to indicate that an animation is meant to be single shot and therefore not serialized with the object

    // could have a singleShot flag or could have a separate function that uses a private animation variable which won't get serialized
    // I like the second option

    camera.doSingleAnimation({
        duration: 2000,
        unit: "ms",
        retain: true,
        easing: {type: "ease-in-out-cubic"},
        keyframes: [
            {
                t: 1,
                translationMatrix: new Mat4({
                    position: new Vec3({x: 3, y: 3, z: 3})
                }),
                rotationMatrix: new Mat4({
                    lookAt: new Vec3({x: 0, y: 0, z: 0}),
                    from: new Vec3({x: 3, y: 3, z: 3})
                })
            }
        ]
    });
});

// note: we could animate the position change to make this smoother for a scroll wheel

// right now we're zooming to and from the origin, which is not bad, but it isn't what the user will be expecting
// the user might expect the scene to zoom to or from whatever's in the center of the viewport
// or they might expect to see the scene zoom to or from whatever's under the cursor
// we will need to be able to convert cursor position to a scene ray
canvas.addEventListener("wheel", event => {
    event.preventDefault(); // prevent the page from being scrolled

    if (event.deltaY === 0 || event.deltaMode !== event.DOM_DELTA_PIXEL) return;

    // console.log(event);

    // let's figure out what is underneath the cursor and zoom about it
    // I think we will be moving the camera along a ray formed by the camera's location and some 3d point under the cursor
    // I think that 3d point is a point on the front face of the viewing frustum
    // I think we just need to take the point in canvas coordinates and convert to viewport coordinates

    // find the camera again
    const camera = activeSceneInfo.cameras[0];


    // okay this is the point in canvas space:
    // need to adjust for device pixel ratio
    const cursorPos_canvas = new Point2({
        x: event.offsetX,
        y: event.offsetY
    });

    const aspectRatio = canvas.width / canvas.height;
    const near = 0.1;
    const far = 1000;
    const viewport = camera.getViewport(aspectRatio, near, far);

    // map cursor pos to viewport
    // note: near is negative
    const cursorPos_viewport = new Point3({
        x: cursorPos_canvas.x / canvas.clientWidth * (viewport.right - viewport.left) + viewport.left,
        y: (1 - cursorPos_canvas.y / canvas.clientHeight) * (viewport.top - viewport.bottom) + viewport.bottom,
        z: -near
    });

    // now convert to world space: camera.worldTransform * point
    const cursorPos_world = camera.getWorldTransform().times(cursorPos_viewport);

    // now form the ray from the camera to the cursor position
    let cameraPos = camera.getWorldTransform().getTranslation();

    // console.log({
    //     canvas: {width: canvas.clientWidth, height: canvas.clientHeight},
    //     viewport,
    //     cursorPos_canvas,
    //     cursorPos_viewport,
    //     cursorPos_world,
    //     cameraPos
    // });

    const cameraToCursorRay = new Ray({
        origin: cameraPos,
        direction: cameraPos.minus(cursorPos_world).normalize()
    });

    // now walk the ray

    const deltaY_world = event.deltaY * 0.01;

    const newPos = cameraToCursorRay.at(deltaY_world);

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
            // now that we have added panning, the user is going to expect that after panning, rotation will no longer be about the origin
            // but what do you rotate about instead?

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

            // console.log({
            //     theta: radiansToDegrees(theta),
            //     phi: radiansToDegrees(phi)
            // });

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































