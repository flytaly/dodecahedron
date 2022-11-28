uniform float uTime;
uniform vec3 uLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying vec3 vSurfaceToView;

float PI = 3.14159265359;

void main() {
    vUv = uv;

    // float pentaAngle = 2.0 * PI * 0.2;
    // float apothem = cos(pentaAngle * 0.5) * 1.0;
    // float dihedral = PI * 116.56505 * 0.0055556;

    vec4 pos = vec4(position, 1.0);
    // pos.xyz *= 0.9;

    gl_Position = projectionMatrix * modelViewMatrix * pos;

    vNormal = normalize(normalMatrix * normal);
    vec3 surfaceToLightDirection = vec3(modelViewMatrix * pos);
    vec3 worldLightPos = vec3(viewMatrix * vec4(uLightPos, 1.0));
    vSurfaceToLight = normalize(worldLightPos - surfaceToLightDirection);

    vSurfaceToView = gl_Position.xyz - surfaceToLightDirection;
}
