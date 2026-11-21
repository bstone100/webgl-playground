precision mediump float;

varying vec4 v_worldPos;
varying vec4 v_worldNormal;

uniform vec4 u_objectColor;

struct PointLight {
    mat4 worldTransform;
    vec4 color;
};

struct SpotLight {
    mat4 worldTransform;
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

uniform mat4 u_cameraWorldTransform;

void main() {

    // phong shading

    vec3 totalAmbient = u_objectColor.rgb * u_ambientLightColor.rgb;

    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    vec3 fragPos = v_worldPos.xyz;
    vec3 surfaceNormal = normalize(v_worldNormal.xyz);

    vec3 cameraPos = u_cameraWorldTransform[3].xyz;
    vec3 fragToCamera = normalize(cameraPos - fragPos);

    for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
        if (i >= u_pointLightCount) break;

        PointLight pointLight = u_pointLights[i];
        // we just need the translation
        vec3 lightPos = pointLight.worldTransform[3].xyz;
        vec3 fragToLight = normalize(lightPos - fragPos);
        // we need to compare the light vector with the surface normal
        // okay we have the surface normal

        // we need to reduce the light contribution the further away the light is
        // attenuation = 1.0 / (kc + kl * distance + kq * distance^2)
        float kc = 1.0;
        float kl = 0.0;
        float kq = 0.1;
        float dist = distance(lightPos, fragPos);
        float attenuation = 1.0 / (kc + kl * dist + kq * dist * dist);

        float diffuseFactor = max(dot(surfaceNormal, fragToLight), 0.0);

        vec3 diffuse = u_objectColor.rgb * pointLight.color.rgb * diffuseFactor * attenuation;
        totalDiffuse += diffuse;

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

    // now calculate for the spot lights
    // it's the same color calculation as for a point light, but at the end you cut off light that's out of range
    for (int i = 0; i < MAX_SPOT_LIGHTS; i++) {
        if (i >= u_spotLightCount) break;

        SpotLight spotLight = u_spotLights[i];

        vec3 lightPos = spotLight.worldTransform[3].xyz;
        vec3 fragToLight = normalize(lightPos - fragPos);

        float kc = 1.0;
        float kl = 0.0;
        float kq = 0.1;
        float dist = distance(lightPos, fragPos);
        float attenuation = 1.0 / (kc + kl * dist + kq * dist * dist);

        float diffuseFactor = max(dot(surfaceNormal, fragToLight), 0.0);

        // we need to calculate to what degree the fragment is within range of the light cone
        // first find the angle between lightDir and lightToFrag
        // lightDir is the forward basis vector of the light's transform
        vec3 lightDir = normalize(spotLight.worldTransform[2].xyz);
        float lightToFragAngle = acos(dot(lightDir, -fragToLight)) / 3.14159 * 180.0;

        // this just means we want 1 if lightToFragAngle is less than innerCutoffAngle, 0 if its greater than outerCutoffAngle
        // and if its in between give us a smooth value between 1 and 0
        float spotLightFactor = 1.0 - smoothstep(spotLight.innerCutoffAngle, spotLight.outerCutoffAngle, lightToFragAngle);

        vec3 diffuse = u_objectColor.rgb * spotLight.color.rgb * diffuseFactor * attenuation * spotLightFactor;
        totalDiffuse += diffuse;

        float specularFactor = max(dot(surfaceNormal, normalize(fragToLight + fragToCamera)), 0.0);

        vec3 specularIntensity = vec3(1.0);
        float shininess = 1.0;
        vec3 specular = specularIntensity * spotLight.color.rgb * specularFactor * attenuation * spotLightFactor;
        totalSpecular += specular;
    }


    vec3 finalColor = totalAmbient + totalDiffuse + totalSpecular;


    gl_FragColor = vec4(finalColor, 1.0);
}





























