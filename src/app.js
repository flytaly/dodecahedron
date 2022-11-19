import * as THREE from 'three';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import BaseSketch from './base-sketch';
import js from './js.png';

/**
 * @arg {THREE.Object3D|THREE.Mesh} mesh
 * @arg {THREE.Vector3} point - the point of rotation
 * @arg {THREE.Vector3} axis - the axis of rotation (normalized)
 * @arg {number} theta - radian value of rotation */
function rotateAboutPoint(mesh, point, axis, theta, world = false) {
    mesh.position.sub(point); // remove the offset
    mesh.position.applyAxisAngle(axis, theta); // rotate the POSITION
    mesh.position.add(point); // re-add the offset
    // rotate the OBJECT
    if (world) {
        mesh.rotateOnWorldAxis(axis, theta);
        return;
    }
    mesh.rotateOnAxis(axis, theta);
}

export default class Sketch extends BaseSketch {
    constructor(selector) {
        super(selector, true);

        this.addDodecahedronHalf();

        this.rotate();

        const amb = new THREE.AmbientLight(new THREE.Color(0xffffff), 3);
        const light = new THREE.PointLight(new THREE.Color(0xffffff), 50);
        light.position.set(-1, -1, 8);
        this.scene.add(amb);
        this.scene.add(light);

        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

        this.animate();
    }

    createPentagon(radius = 1, index = 1) {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_texture: { value: this.drawText({ text: index, horizontalPadding: 0.2 }) },
                u_bgColor: { value: new THREE.Color('blue') },
            },
            side: THREE.DoubleSide,
            vertexShader,
            fragmentShader,
        });
        const geometry = new THREE.CircleGeometry(radius, 5, Math.PI / 10);
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    addDodecahedronHalf() {
        const radius = 1;
        const apothem = 0.809;
        const angle = (2 * Math.PI) / 5;
        const zAxis = new THREE.Vector3(0, 0, 1);

        /** @type THREE.Mesh[] */
        this.halfGroup = new THREE.Group();

        // Central pentagon
        this.halfGroup.add(this.createPentagon(radius, 0));

        // 5 pentagonal "leafs"
        for (let i = 0; i < 5; i++) {
            const penta = this.createPentagon(radius, i + 1);
            penta.position.set(0, -apothem * 2, 0);
            penta.position.applyAxisAngle(zAxis, angle * i);
            penta.rotateZ(angle / 2);
            this.halfGroup.add(penta);
        }

        this.scene.add(this.halfGroup);
    }

    rotate() {
        const apothem = 0.809;
        const dihedralAngle = (Math.PI * 116.56505) / 180;
        const angle = (2 * Math.PI) / 5;
        const zAxis = new THREE.Vector3(0, 0, 1);

        /** @type THREE.Vector3[] */
        const rotationPoints = [];
        /** @type THREE.Vector3[] */
        const rotationAxis = [];

        const pentas = this.halfGroup.children;

        for (let index = 0; index < pentas.length - 1; index++) {
            const point = new THREE.Vector3(0, -apothem, 0);
            const axis = new THREE.Vector3(1, 0, 0);
            point.applyAxisAngle(zAxis, angle * index);
            axis.applyAxisAngle(zAxis, angle * index);
            rotationPoints.push(point);
            rotationAxis.push(axis.normalize());
        }

        for (let i = 1; i < pentas.length; i++) {
            rotateAboutPoint(
                pentas[i], //
                rotationPoints[i - 1],
                rotationAxis[i - 1],
                Math.PI - dihedralAngle,
                true,
            );
        }
    }

    animate() {
        this.halfGroup.rotateY(0.01);
        this.render();
        this.rafId = requestAnimationFrame(this.animate.bind(this));
    }
}

new Sketch('container');
