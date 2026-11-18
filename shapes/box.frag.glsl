precision mediump float;

varying vec4 v_worldPos;

uniform vec4 u_objectColor;

struct PointLight {
    vec3 position;
    vec3 color;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    vec3 color;
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