export function easeInSine(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
}

export function easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
}

export function easeInExpo(x) {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

export function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** @arg {(t:number)=>void} onChange */
export function animate(onChange, { duration = 2000, easing = null } = {}) {
    let startTime = 0;

    if (!easing) easing = (t) => t;

    const animation = () => {
        const progress = (Date.now() - startTime) / duration;

        if (progress >= 1) {
            onChange(1);
            return;
        }
        onChange(easing(progress));
        requestAnimationFrame(animation);
    };

    requestAnimationFrame(() => {
        onChange(0);
        startTime = Date.now();
        animation();
    });
}

/**
 * @arg {THREE.Object3D|THREE.Mesh} mesh
 * @arg {THREE.Vector3} point - the point of rotation
 * @arg {THREE.Vector3} axis - the axis of rotation (normalized)
 * @arg {number} theta - radian value of rotation */
export function rotateAboutPoint(mesh, point, axis, theta, world = false) {
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

export function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}
