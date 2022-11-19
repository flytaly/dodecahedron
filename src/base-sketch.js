import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default class BaseSketch {
    constructor(selector, withOrbitControls = true) {
        this.container = document.getElementById(selector);
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer();

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0xeeeeee, 1);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(
            70, //
            window.innerWidth / window.innerHeight,
            0.001,
            1000,
        );

        this.camera.position.set(2, 0, 4);
        this.camera.lookAt(0, 0, 0);

        if (withOrbitControls) {
            new OrbitControls(this.camera, this.renderer.domElement);
        }

        this.time = 0;

        this.setupResize();
        this.resize();
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.gui) {
            this.gui.destroy();
        }
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;

        if (this.material && this.material.uniforms.u_resolution) {
            this.material.uniforms.u_resolution.value.x = this.width;
            this.material.uniforms.u_resolution.value.y = this.height;
            this.material.uniforms.u_resolution.value.z = this.width;
            this.material.uniforms.u_resolution.value.w = this.height;
        }
        this.camera.updateProjectionMatrix();
    }

    drawText({ text, fontFamily = 'Roboto', horizontalPadding = 0.75 } = {}) {
        const texCanvas = document.createElement('canvas');
        const texCtx = texCanvas.getContext('2d');
        const idealCanvasSize = 2048;
        const maxTextureSize = Math.min(this.renderer.capabilities.maxTextureSize, idealCanvasSize);
        texCanvas.width = maxTextureSize;
        texCanvas.height = maxTextureSize;

        texCtx.fillStyle = '#fff';
        texCtx.strokeStyle = '#fff';
        texCtx.lineWidth = 1;
        texCtx.textAlign = 'center';
        texCtx.textBaseline = 'middle';
        const referenceFontSize = 250;
        texCtx.font = `${referenceFontSize}px ${fontFamily}`;
        const textWidth = texCtx.measureText(text).width;
        const deltaWidth = (texCanvas.width * horizontalPadding) / textWidth;
        const fontSise = referenceFontSize * deltaWidth;
        texCtx.font = `${fontSise}px ${fontFamily}`;
        texCtx.fillText(text, texCanvas.width / 2, texCanvas.height / 2);

        return new THREE.CanvasTexture(texCanvas);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
