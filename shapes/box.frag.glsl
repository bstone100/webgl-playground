precision mediump float;

varying vec4 v_worldPos;

uniform vec4 u_objectColor;

struct PointLight {
    mat4 transform;
    vec4 color;
};

struct SpotLight {
    mat4 transform;
    vec4 color;
    float innerCutoffAngle;
    float outerCutoffAngle;
};

#define MAX_POINT_LIGHTS 10
#define MAX_SPOT_LIGHTS 10

uniform int u_spotLightCount;
uniform SpotLight u_spotLights[MAX_SPOT_LIGHTS];

uniform int u_pointLightCount;
uniform PointLight u_pointLights[MAX_POINT_LIGHTS];

void main() {
    gl_FragColor = u_objectColor;
}