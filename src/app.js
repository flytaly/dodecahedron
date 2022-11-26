import * as THREE from 'three';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import BaseSketch from './base-sketch';

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

        this.setValues(1);
        this.addDodecahedronHalf();
        this.rotateLeafs();

        const g = new THREE.SphereGeometry(0.03, 4, 4);
        const m = new THREE.MeshPhongMaterial({ color: 'blue' });
        const mesh = new THREE.Mesh(g, m);
        mesh.position.set(3, 1, 2);
        this.scene.add(mesh);

        this.animate();
    }

    setValues(radius = 1) {
        this.radius = radius;
        this.pentaAngle = (2 * Math.PI) / 5;
        this.apothem = Math.cos(this.pentaAngle / 2) * radius;
        this.zAxis = new THREE.Vector3(0, 0, 1);
        this.dihedralAngle = (Math.PI * 116.56505) / 180;
    }

    createPentagon({ radius = 1, index = 1, material = null }) {
        material =
            material ||
            new THREE.ShaderMaterial({
                uniforms: {
                    u_time: { value: 0 },
                    u_texture: { value: this.drawText({ text: index, horizontalPadding: 0.2 }) },
                    u_bgColor: { value: new THREE.Color('blue') },
                    u_lightPos: { value: new THREE.Vector3(3, 1, 2) },
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
        const { radius, apothem, zAxis, pentaAngle } = this;

        /** @type THREE.Mesh[] */
        this.halfGroup = new THREE.Group();

        // Central pentagon
        /* const material = new THREE.MeshBasicMaterial({ color: 'gray', side: THREE.DoubleSide }); */
        this.halfGroup.add(this.createPentagon({ radius, index: 0 }));

        // 5 pentagonal "leafs"
        for (let i = 0; i < 5; i++) {
            const penta = this.createPentagon({ radius, index: i + 1 });
            penta.position.set(0, -apothem * 2, 0);
            penta.position.applyAxisAngle(zAxis, pentaAngle * i);
            penta.rotateZ(pentaAngle / 2);
            this.halfGroup.add(penta);
        }

        this.scene.add(this.halfGroup);
    }

    rotateLeafs() {
        const { apothem, dihedralAngle, pentaAngle, zAxis } = this;

        /** @type THREE.Vector3[] */
        const rotationPoints = [];
        /** @type THREE.Vector3[] */
        const rotationAxis = [];

        const pentas = this.halfGroup.children;

        for (let index = 0; index < pentas.length - 1; index++) {
            const point = new THREE.Vector3(0, -apothem, 0);
            const axis = new THREE.Vector3(1, 0, 0);
            point.applyAxisAngle(zAxis, pentaAngle * index);
            axis.applyAxisAngle(zAxis, pentaAngle * index);
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
        this.time += 0.01;

        this.halfGroup.children[1].material.uniforms.u_time.value = this.time;
        this.halfGroup.rotateY(0.01);
        this.render();
        this.rafId = requestAnimationFrame(this.animate.bind(this));
    }
}

new Sketch('container');
