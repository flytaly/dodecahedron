#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

uniform vec3 uLightPos;
uniform sampler2D uTexture;
uniform float uLightIntensity;
uniform float uNoiseCoef;
uniform float uNoiseMin;
uniform float uNoiseMax;
uniform float uNoiseScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying vec3 vSurfaceToView;

vec3 light_reflection(vec3 lightColor) {
    vec3 ambient = lightColor;
    vec3 diffuse = lightColor * max(dot(vSurfaceToLight, vNormal), 0.0);

    vec3 light = ambient + diffuse;

    // specular light
    /* vec3 halfVector = normalize(vSurfaceToLight + vSurfaceToView);
    float specular = dot(vNormal, halfVector);
    specular = pow(specular, 100.0);
    light += specular * 0.5; */

    return light;
}

void main() {
    if (!gl_FrontFacing) {
        gl_FragColor = vec4(vec3(0.7), 1.0);
        return;
    }

    vec2 uv = vUv;
    vec3 color = texture2D(uTexture, uv).rgb;
    vec3 lightColor = vec3(1.0, 1.0, 1.0);
    vec3 light = light_reflection(lightColor);
    light *= uLightIntensity;

    vec2 uvScreen = gl_FragCoord.xy;
    uvScreen /= uNoiseScale;

    vec3 colorNoise = vec3(snoise2(uvScreen) * 0.5 + 0.5);
    colorNoise *= clamp(uNoiseMin, uNoiseMax, pow(light.r, uNoiseCoef));

    // gl_FragColor = vec4(light, 1.0);
    gl_FragColor.rgb = max(colorNoise, color);
    gl_FragColor.a = 1.0;
}
