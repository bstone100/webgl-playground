attribute vec4 a_position;

uniform mat4 u_objectTransform;
uniform mat4 u_viewMatrix;

varying vec4 v_worldPos;

void main() {
    v_worldPos = u_objectTransform * a_position;

    gl_Position = u_viewMatrix * v_worldPos;
}




























