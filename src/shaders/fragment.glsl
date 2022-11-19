uniform sampler2D u_texture;

varying vec2 vUv;

void main() {
    vec2 uv = vUv - vec2(0.0, 0.0);
    vec4 t = texture2D(u_texture, uv);
    vec3 color = vec3(vUv, 0.0);
    color = t.rgb;
    color = max(color, vec3(uv, 0));
    gl_FragColor = vec4(color, 1.0);
}
