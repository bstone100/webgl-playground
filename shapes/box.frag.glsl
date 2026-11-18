precision mediump float;

varying vec4 v_worldPos;
varying vec4 v_worldNormal;

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

uniform mat4 u_cameraTransform;

void main() {

    // phong shading

    vec3 totalAmbient = u_objectColor.rgb * u_ambientLightColor.rgb;

    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    vec3 fragPos = v_worldPos.xyz;
    vec3 surfaceNormal = normalize(v_worldNormal.xyz);

    for (int i = 0; i < u_pointLightCount; i++) {
        PointLight pointLight = u_pointLights[i];
        // we just need the translation
        vec3 lightPos = pointLight.transform[3].xyz;
        vec3 fragToLight = normalize(lightPos - fragPos);
        // we need to compare the light vector with the surface normal
        // okay we have the surface normal

        // we need to reduce the light contribution the further away the light is
        // attenuation = 1.0 / (kc + kl * distance + kq * distance^2)
        float kc = 1.0;
        float kl = 0.0;
        float kq = 0.1;
        float dist = distance(lightPos, v_worldPos.xyz);
        float attenuation = 1.0 / (kc + kl * dist + kq * dist * dist);

        float diffuseFactor = max(dot(surfaceNormal, fragToLight), 0.0);

        vec3 diffuse = u_objectColor.rgb * pointLight.color.rgb * diffuseFactor * attenuation;
        totalDiffuse += diffuse;

        vec3 cameraPos = u_cameraTransform[3].xyz;
        vec3 fragToCamera = normalize(cameraPos - fragPos);

        // now compute specular using halfway vector (blinn shading)
        // compare surface normal with halfway vector which is light vector + view vector
        // camera is aligned with the reflection if halfway vector is aligned with surface normal
        float specularFactor = max(dot(surfaceNormal, normalize(fragToLight + fragToCamera)), 0.0);

        // specular intensity says how much of the light is reflected
        // right now we're saying all of it is reflected, but this could be a value from a specular map
        vec3 specularIntensity = vec3(1.0);
        // this value dictates the shape of the bright spot
        // a low value means it's wide and soft, a high value means it's small and sharp, this depends on the material
        float shininess = 1.0;
        vec3 specular = specularIntensity * pointLight.color.rgb * pow(specularFactor, shininess) * attenuation;
        totalSpecular += specular;
    }


    vec3 finalColor = totalAmbient + totalDiffuse + totalSpecular;


    gl_FragColor = vec4(finalColor, 1.0);
}





























