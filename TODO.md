# TODO

## Features

- [x] implement ability to move camera around with mouse and keyboard
  - [x] rotate camera spherically
    - [x] figure out the logic for rotating the camera after the camera has panned
  - [x] pan camera
  - [x] zoom camera
- [x] finish the other shapes
  - [x] add a line shape
  - [ ] cone shading can be improved by using multiple stacks of quads on the main surface
- [ ] move shader code and other common code out of box.js
- [ ] add support for textures
- [ ] add support for more material properties like metalness
- [ ] improve cubic bezier algorithm implementation
- [ ] add UI controls for adjusting properties of an object
  - [ ] sliders for transform
  - [ ] color picker
  - [ ] change color of lights
  - [ ] animation properties
- [x] be able to select an object by clicking on it
  - [ ] show an indicator in 3D of selection like a wireframe
- [ ] add controls to create and delete primitives
- [ ] visualize lights and cameras in the scene
- [ ] be able to switch between different camera views
- [ ] show world and local coordinate axes and grid planes
- [ ] add support for skyboxes
- [ ] add support for exporting and importing scene to a file
- [ ] add support for shadows
- [ ] allow objects to animate their location along a bezier curve
- [ ] be able to import 3d models
- [ ] start adding physics
  - [ ] don't allow objects to go through each other
    - [ ] they should have realistic collisions based on their properties
    - [ ] so they might bounce off of each other or just stop moving
  - [ ] make objects respect gravity
  - [ ] could give objects their own gravity field and let other objects orbit them
  - [ ] make motion respect physics equations

## Bugs

- [ ] after switching scenes, the home button isn't making the camera animate home