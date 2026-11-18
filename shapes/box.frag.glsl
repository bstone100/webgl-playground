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

uniform vec4 u_ambientLightColor;

void main() {

    // phong shading

    vec3 ambient = u_objectColor.rgb * u_ambientLightColor.rgb;

    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    for (int i = 0; i < u_pointLightCount; i++) {
        PointLight pointLight = u_pointLights[i];
        // we just need the translation
        vec3 lightPos = pointLight.transform[3].xyz;
        // we need to compare the light vector with the surface normal

    }


    vec3 finalColor = ambient + totalDiffuse + totalSpecular;


    gl_FragColor = vec4(finalColor, 1.0);
}





























