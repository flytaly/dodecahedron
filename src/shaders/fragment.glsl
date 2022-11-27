uniform vec3 uLightPos;
uniform sampler2D uTexture;
uniform float uLightPow;
uniform float uLightIntensity;
uniform float uNoiseCoef;
uniform float uNoiseScale;
uniform float uSmallNoiseScale;
uniform float uLinesDensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying vec3 vSurfaceToView;
varying vec2 vScreenSpace;

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n),
        f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

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
        gl_FragColor = vec4(vec3(0.8), 1.0);
        return;
    }

    vec2 uv = vUv;
    vec3 color = texture2D(uTexture, uv).rgb;

    vec3 lightColor = vec3(1.0, 1.0, 1.0);
    vec3 light = light_reflection(lightColor);
    light *= uLightIntensity;

    //===============================
    // grain noise
    //===============================
    /* vec2 uvScreen = gl_FragCoord.xy;
    uvScreen /= uNoiseScale;

    vec3 colorNoise = vec3(noise(uvScreen) * 0.5 + 0.5);
    float noiseMin = 0.8;
    float noiseMax = 2.;
    colorNoise *= clamp(noiseMin, noiseMax, pow(light.r, uNoiseCoef));

    gl_FragColor.rgb = max(colorNoise, color);
    gl_FragColor.a = 1.0; */

    //===============================
    // strokes noise
    //===============================
    // diagonal strokes
    float strokes = cos((vScreenSpace.x + vScreenSpace.y) * uLinesDensity);

    float smallnoise = noise(uSmallNoiseScale * vScreenSpace);
    smallnoise = smallnoise * 2.0 - 1.0; // [0, 1] => [-1, 1]

    float bignoise = noise(uNoiseScale * vScreenSpace);
    bignoise = bignoise * 2.0 - 1.0;

    // noisy strokes
    strokes += smallnoise + bignoise;

    float lightValue = light.r;
    lightValue = pow(lightValue, uLightPow);

    strokes = 1.0 - smoothstep(lightValue - 1.0, lightValue, strokes);

    vec3 linesColor = vec3(strokes + light * 0.4);

    linesColor = max(linesColor, color);

    color = mix(color, linesColor, light * 0.3);
    // color += light * 0.2;
    gl_FragColor = vec4(color, 1.0);
    // gl_FragColor = vec4(vec3(strokes), 1.0);
}
