attribute vec4 a_position;

uniform mat4 u_objectTransform;

varying vec4 v_worldPos;

void main() {
    v_worldPos = u_objectTransform * a_position;
}




























