import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initDice() {
    const container = document.getElementById('dice-canvas-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b); // Matches existing dark theme roughly

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Cube
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

    // Create textures for faces 1-6
    const materials = [];
    for (let i = 1; i <= 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 256, 256);

        // Border
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, 256, 256);

        // Text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 160px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        materials.push(new THREE.MeshStandardMaterial({ map: texture }));
    }

    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    // Animation Loop
    let targetRotationQ = new THREE.Quaternion();

    function animate() {
        requestAnimationFrame(animate);

        // Smooth rotation
        cube.quaternion.slerp(targetRotationQ, 0.1);

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Interaction Functions
    function rotateCube(axis, angle) {
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(axis, angle);
        targetRotationQ.multiplyQuaternions(q, targetRotationQ);
    }

    const AXIS_X = new THREE.Vector3(1, 0, 0);
    const AXIS_Y = new THREE.Vector3(0, 1, 0);
    const AXIS_Z = new THREE.Vector3(0, 0, 1);

    // Body Diagonals (Vertices) - Angle 2*PI/3
    const AXIS_V1 = new THREE.Vector3(1, 1, 1).normalize();
    const AXIS_V2 = new THREE.Vector3(-1, 1, 1).normalize();
    const AXIS_V3 = new THREE.Vector3(1, -1, 1).normalize();
    const AXIS_V4 = new THREE.Vector3(1, 1, -1).normalize();

    // Edge Centers (Face Diagonals) - Angle PI
    const AXIS_E1 = new THREE.Vector3(1, 1, 0).normalize();  // x=y
    const AXIS_E2 = new THREE.Vector3(1, -1, 0).normalize(); // x=-y
    const AXIS_E3 = new THREE.Vector3(1, 0, 1).normalize();  // x=z
    const AXIS_E4 = new THREE.Vector3(1, 0, -1).normalize(); // x=-z
    const AXIS_E5 = new THREE.Vector3(0, 1, 1).normalize();  // y=z
    const AXIS_E6 = new THREE.Vector3(0, 1, -1).normalize(); // y=-z

    const ANGLE_FACE = Math.PI / 2;
    const ANGLE_VERTEX = (2 * Math.PI) / 3;
    const ANGLE_EDGE = Math.PI;

    // Face Rotations
    document.getElementById('dice-rotate-x')?.addEventListener('click', () => rotateCube(AXIS_X, ANGLE_FACE));
    document.getElementById('dice-rotate-y')?.addEventListener('click', () => rotateCube(AXIS_Y, ANGLE_FACE));
    document.getElementById('dice-rotate-z')?.addEventListener('click', () => rotateCube(AXIS_Z, ANGLE_FACE));

    // Vertex Rotations
    document.getElementById('dice-rotate-v1')?.addEventListener('click', () => rotateCube(AXIS_V1, ANGLE_VERTEX));
    document.getElementById('dice-rotate-v2')?.addEventListener('click', () => rotateCube(AXIS_V2, ANGLE_VERTEX));
    document.getElementById('dice-rotate-v3')?.addEventListener('click', () => rotateCube(AXIS_V3, ANGLE_VERTEX));
    document.getElementById('dice-rotate-v4')?.addEventListener('click', () => rotateCube(AXIS_V4, ANGLE_VERTEX));

    // Edge Rotations
    document.getElementById('dice-rotate-e1')?.addEventListener('click', () => rotateCube(AXIS_E1, ANGLE_EDGE));
    document.getElementById('dice-rotate-e2')?.addEventListener('click', () => rotateCube(AXIS_E2, ANGLE_EDGE));
    document.getElementById('dice-rotate-e3')?.addEventListener('click', () => rotateCube(AXIS_E3, ANGLE_EDGE));
    document.getElementById('dice-rotate-e4')?.addEventListener('click', () => rotateCube(AXIS_E4, ANGLE_EDGE));
    document.getElementById('dice-rotate-e5')?.addEventListener('click', () => rotateCube(AXIS_E5, ANGLE_EDGE));
    document.getElementById('dice-rotate-e6')?.addEventListener('click', () => rotateCube(AXIS_E6, ANGLE_EDGE));

    document.getElementById('dice-reset')?.addEventListener('click', () => {
        targetRotationQ.set(0, 0, 0, 1);
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        if (!document.getElementById('dice-section').classList.contains('active-section')) return; // Simple optimization
        // Actually we should resize always or observe size
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
