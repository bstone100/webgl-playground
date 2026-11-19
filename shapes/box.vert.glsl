attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_objectTransform;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

varying vec4 v_worldPos;
varying vec4 v_worldNormal;

void main() {
    v_worldPos = u_objectTransform * vec4(a_position, 1.0);
    v_worldNormal = u_objectTransform * vec4(a_normal, 0.0);

    gl_Position = u_projectionMatrix * u_viewMatrix * v_worldPos;
}




























