uniform vec3 u_lightPos;
uniform sampler2D u_texture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSurfaceToLight;
varying vec3 vSurfaceToView;

void main() {
    vec2 uv = vUv - vec2(0.0, 0.0);
    vec4 t = texture2D(u_texture, uv);
    vec3 color = vec3(vUv, 0.0);
    color = t.rgb;
    color = max(color, vec3(0.5, 0.5, 0.7));

    vec3 diffuse = color * max(dot(vSurfaceToLight, vNormal), 0.0);
    vec3 ambient = color * 0.5;
    vec3 light = ambient + diffuse;

    vec3 halfVector = normalize(vSurfaceToLight + vSurfaceToView);
    float specular = dot(vNormal, halfVector);
    specular = pow(specular, 260.0);
    light += specular * 0.2;

    // gl_FragColor = vec4(color, 1.0);
    gl_FragColor = vec4(light, 1.0);
}
