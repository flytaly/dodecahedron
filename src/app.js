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

        // light
        this.lightPos = new THREE.Vector3(2, 1, 3);
        const g = new THREE.SphereGeometry(0.03, 4, 4);
        const m = new THREE.MeshPhongMaterial({ color: 'blue' });
        const lightHelper = new THREE.Mesh(g, m);
        lightHelper.position.copy(this.lightPos);

        this.initSettings();

        this.mainGroup = new THREE.Group();
        this.setValues(1);
        this.createHalves();
        this.mainGroup.add(this.frontGroup);
        this.mainGroup.add(this.backGroup);
        this.scene.add(this.mainGroup);

        this.camera.position.set(3, 0, 3);
        this.camera.lookAt(0, 0, 0);

        this.scene.add(lightHelper);

        this.animate();
    }

    initSettings() {
        this.guiInit();
        this.settings = {
            uLightIntensity: 0.6,
            uNoiseCoef: 1,
            uNoiseScale: 1.3,
            uNoiseMin: 0.8,
            uNoiseMax: 2.0,
        };
        this.gui.add(this.settings, 'uLightIntensity', 0, 3, 0.01);
        this.gui.add(this.settings, 'uNoiseCoef', 0, 10, 0.01);
        this.gui.add(this.settings, 'uNoiseScale', 0, 5, 0.01);
        this.gui.add(this.settings, 'uNoiseMin', 0, 5, 0.01);
        this.gui.add(this.settings, 'uNoiseMax', 0, 5, 0.01);
    }

    applySettings() {
        const entries = Object.entries(this.settings);
        const set = (p) => {
            entries.forEach(([key, value]) => {
                p.material.uniforms[key].value = value;
            });
        };
        this.frontGroup.children.forEach(set);
        this.backGroup.children.forEach(set);
    }

    setValues(radius = 1) {
        this.radius = radius;
        this.pentaAngle = (2 * Math.PI) / 5;
        this.apothem = Math.cos(this.pentaAngle / 2) * radius;
        this.zAxis = new THREE.Vector3(0, 0, 1);
        this.dihedralAngle = Math.acos(-1 / Math.sqrt(5));

        // Calculate the distance between dodecahedron side to the center
        // length of a side of the pentagon, which is the base of an isosceles triangle formed by two radius
        const a = 2 * this.radius * Math.cos((Math.PI - this.pentaAngle) / 2);
        // height is the distance from the pentagon vertices to the opposite side
        const height = this.apothem + this.radius;
        // the same as height but starts from adjacent vertices
        const h2 = a * Math.sin(this.pentaAngle);
        // now we need to use projection of the middle point between height and h2
        this.halfDistance = (Math.cos(this.dihedralAngle - Math.PI / 2) * (height + h2)) / 2;
    }

    createHalves() {
        this.frontGroup = new THREE.Group();
        this.backGroup = new THREE.Group();
        this.dodec = new THREE.Group();

        this.addDodecahedronHalf(this.frontGroup);
        this.addDodecahedronHalf(this.backGroup);

        this.backGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI);
        this.backGroup.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.pentaAngle / 2);
        this.frontGroup.position.set(0, 0, this.halfDistance);
        this.backGroup.position.set(0, 0, -this.halfDistance);

        this.rotateLeafs(this.frontGroup);
        this.rotateLeafs(this.backGroup);
    }

    createPentagon({ radius = 1, index = 1, material = null }) {
        const s = this.settings;
        material =
            material ||
            new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uTexture: { value: this.drawText({ text: index, horizontalPadding: 0.2 }) },
                    uLightPos: { value: this.lightPos },
                    uLightIntensity: { value: s.uLightIntensity },
                    uNoiseCoef: { value: s.uNoiseCoef },
                    uNoiseScale: { value: s.uNoiseScale },
                    uNoiseMin: { value: s.uNoiseMin },
                    uNoiseMax: { value: s.uNoiseMin },
                },
                side: THREE.DoubleSide,
                vertexShader,
                fragmentShader,
            });

        const geometry = new THREE.CircleGeometry(radius, 5, Math.PI / 10);
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    /** @arg {THREE.Group} halfGroup */
    addDodecahedronHalf(halfGroup, group) {
        const { radius, apothem, zAxis, pentaAngle } = this;

        // Central pentagon
        /* const material = new THREE.MeshBasicMaterial({ color: 'gray', side: THREE.DoubleSide }); */
        halfGroup.add(this.createPentagon({ radius, index: 0 }));

        // 5 pentagonal "leafs"
        for (let i = 0; i < 5; i++) {
            const penta = this.createPentagon({ radius, index: i + 1 });
            penta.position.set(0, -apothem * 2, 0);
            penta.position.applyAxisAngle(zAxis, pentaAngle * i);
            penta.rotateZ(pentaAngle / 2);
            halfGroup.add(penta);
        }

        this.scene.add(halfGroup);
    }

    /** @arg {THREE.Group} group */
    rotateLeafs(group) {
        const { apothem, dihedralAngle, pentaAngle, zAxis } = this;

        /** @type THREE.Vector3[] */
        const rotationPoints = [];
        /** @type THREE.Vector3[] */
        const rotationAxis = [];

        const pentagons = group.children;

        for (let index = 0; index < pentagons.length - 1; index++) {
            const point = new THREE.Vector3(0, -apothem, 0);
            const axis = new THREE.Vector3(1, 0, 0);
            point.applyAxisAngle(zAxis, pentaAngle * index);
            axis.applyAxisAngle(zAxis, pentaAngle * index);
            rotationPoints.push(point);
            rotationAxis.push(axis.normalize());
        }

        for (let i = 1; i < pentagons.length; i++) {
            rotateAboutPoint(
                pentagons[i], //
                rotationPoints[i - 1],
                rotationAxis[i - 1],
                Math.PI - dihedralAngle,
                true,
            );
        }
    }

    animate() {
        this.time += 0.01;

        this.applySettings();

        this.mainGroup.rotateY(0.004);
        this.mainGroup.rotateX(0.002);

        this.render();
        this.rafId = requestAnimationFrame(this.animate.bind(this));
    }
}

new Sketch('container');
