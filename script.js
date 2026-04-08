// Main Entry Point
document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active-section'));

            btn.classList.add('active');
            const targetId = btn.dataset.target;
            document.getElementById(targetId).classList.add('active-section');

            // Trigger resize for Three.js if switching to dice
            if (targetId === 'dice-section' && window.resizeDice) {
                window.resizeDice();
            }
        });
    });

    // Initialize Global Functions
    if (window.initDice) window.initDice();
    if (window.initCards) window.initCards();
    if (window.initNecklace) window.initNecklace();
});

// ==========================================
// MODULE: DICE (Three.js r128)
// ==========================================
window.initDice = function () {
    const container = document.getElementById('dice-canvas-container');
    if (!container) return;
    if (typeof THREE === 'undefined') {
        container.innerHTML = '<p style="color:white">Error: Three.js not loaded. Please check internet connection.</p>';
        return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Initial arrangement of values 1-6
    let faceValues = [1, 2, 3, 4, 5, 6];
    let materials = [];
    let cube;

    function createDotTexture(value) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, 256, 256);

        ctx.fillStyle = '#0f172a';

        // Dot drawing helper
        const drawDot = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fill();
        };

        // Positions: Center, TL, TR, ML, MR, BL, BR
        const C = 128; // Center
        const offset = 60;
        const L = C - offset;
        const R = C + offset;
        const T = C - offset;
        const B = C + offset;

        // Symmetric configurations
        if (value === 1) {
            drawDot(C, C);
        } else if (value === 2) {
            drawDot(L, T); drawDot(R, B); // Diagonal
        } else if (value === 3) {
            drawDot(L, T); drawDot(C, C); drawDot(R, B);
        } else if (value === 4) {
            drawDot(L, T); drawDot(R, T);
            drawDot(L, B); drawDot(R, B);
        } else if (value === 5) {
            drawDot(L, T); drawDot(R, T);
            drawDot(C, C);
            drawDot(L, B); drawDot(R, B);
        } else if (value === 6) {
            drawDot(L, T); drawDot(R, T);
            drawDot(L, C); drawDot(R, C);
            drawDot(L, B); drawDot(R, B);
        }

        return new THREE.CanvasTexture(canvas);
    }

    function createMaterials() {
        return faceValues.map(v => new THREE.MeshStandardMaterial({ map: createDotTexture(v) }));
    }

    function buildCube() {
        if (cube) {
            // Update material only if geometry is same
            cube.material = createMaterials();
            return;
        }
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        materials = createMaterials();
        cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
    }

    buildCube();

    // ==========================================
    // AXES HELPER SETUP (Bottom-Left)
    // ==========================================
    const axesContainer = document.createElement('div');
    axesContainer.id = 'dice-axes-canvas';
    container.appendChild(axesContainer);

    const axesScene = new THREE.Scene();
    const axesCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    // Align axes camera roughly with main camera initially
    axesCamera.up = camera.up;

    // Transparent renderer for axes
    const axesRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    axesRenderer.setSize(100, 100);
    axesContainer.appendChild(axesRenderer.domElement);

    const axesHelper = new THREE.AxesHelper(2);
    // Custom colors or thicker lines could go here, but default is X=Red, Y=Green, Z=Blue
    axesScene.add(axesHelper);

    // Add Labels (X, Y, Z)
    function createAxisLabel(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.8, 0.8, 0.8);
        return sprite;
    }

    const labelX = createAxisLabel('X', '#ff6666'); // Light Red
    labelX.position.set(2.2, 0, 0);
    axesScene.add(labelX);

    const labelY = createAxisLabel('Y', '#66ff66'); // Light Green
    labelY.position.set(0, 2.2, 0);
    axesScene.add(labelY);

    const labelZ = createAxisLabel('Z', '#6666ff'); // Light Blue
    labelZ.position.set(0, 0, 2.2);
    axesScene.add(labelZ);

    let targetRotationQ = new THREE.Quaternion();

    function animate() {
        requestAnimationFrame(animate);

        // Update main scene
        if (cube) cube.quaternion.slerp(targetRotationQ, 0.1);
        controls.update();
        renderer.render(scene, camera);

        // Update Axes Scene
        // Sync orientation: Point axesCamera at (0,0,0) from same relative direction as main camera
        axesCamera.position.copy(camera.position).sub(controls.target); // relative vector
        axesCamera.position.setLength(5); // fixed distance
        axesCamera.lookAt(axesScene.position);

        axesRenderer.render(axesScene, axesCamera);
    }
    animate();

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

    document.getElementById('dice-shuffle')?.addEventListener('click', () => {
        // Shuffle the faceValues array
        for (let i = faceValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [faceValues[i], faceValues[j]] = [faceValues[j], faceValues[i]];
        }
        // Update texture
        buildCube();
    });

    window.resizeDice = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', window.resizeDice);
};

// ==========================================
// MODULE: CARDS
// ==========================================
window.initCards = function () {
    const container = document.getElementById('card-display-area');
    const drawBtn = document.getElementById('btn-draw-hand');
    const showPermsBtn = document.getElementById('btn-show-perms');
    const permLabel = document.getElementById('perm-label');
    const permsList = document.getElementById('all-perms-list');

    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const SUITS = ['♠', '♥', '♣', '♦'];

    let currentHand = [];

    function getRandomCard() {
        const r = RANKS[Math.floor(Math.random() * RANKS.length)];
        const s = SUITS[Math.floor(Math.random() * SUITS.length)];
        const color = (s === '♥' || s === '♦') ? 'red' : 'black';
        return { rank: r, suit: s, color: color, id: Math.random() };
    }

    function createCardEl(card) {
        const el = document.createElement('div');
        el.className = `card ${card.color}`;
        el.innerHTML = `${card.rank}${card.suit}`;
        return el;
    }

    function renderHand(hand) {
        container.innerHTML = '';
        container.style.flexWrap = "wrap";
        container.style.gap = "0px";
        container.style.overflowY = "hidden";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        // Reset display to flex for single hand
        container.style.display = "flex";

        hand.forEach(card => {
            container.appendChild(createCardEl(card));
        });
    }

    drawBtn?.addEventListener('click', () => {
        currentHand = [getRandomCard(), getRandomCard(), getRandomCard()];
        renderHand(currentHand);
        if (permLabel) permLabel.textContent = "Original";
        if (permsList) {
            permsList.innerHTML = "";
            permsList.style.opacity = 0;
        }
    });

    // Helper to generate permutations
    function getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const perms = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
            const remainingPerms = getPermutations(remaining);
            for (const p of remainingPerms) {
                perms.push([current].concat(p));
            }
        }
        return perms;
    }

    showPermsBtn?.addEventListener('click', () => {
        if (currentHand.length === 0) return;

        const allPerms = getPermutations(currentHand);

        // Use Grid layout for 3x2 arrangement
        container.innerHTML = '';
        container.style.display = "grid";
        container.style.gridTemplateColumns = "1fr 1fr";
        container.style.gridTemplateRows = "repeat(3, 1fr)";
        container.style.gap = "5px";
        container.style.padding = "10px";
        container.style.overflow = "hidden";
        container.style.alignItems = "center";
        container.style.justifyItems = "center";

        allPerms.forEach((perm, index) => {
            const row = document.createElement('div');
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.justifyContent = "center";
            row.style.transform = "scale(0.85)";
            row.style.width = "100%";

            perm.forEach(card => {
                row.appendChild(createCardEl(card));
            });

            // Label for the row
            const label = document.createElement('div');
            label.style.color = "white";
            label.style.marginLeft = "8px";
            label.style.fontFamily = "monospace";
            label.style.fontSize = "1.1rem";
            label.textContent = `#${index + 1}`;
            row.appendChild(label);

            container.appendChild(row);
        });

        if (permLabel) permLabel.textContent = "Showing all 6 permutations";
    });
}; // END initCards

// ==========================================
// MODULE: NECKLACE
// ==========================================
window.initNecklace = function () {
    const svg = document.getElementById('necklace-svg');
    if (!svg) return;

    const CX = 200, CY = 200;
    const R = 80;
    const colors = ['#1e293b', '#f8fafc'];

    // 2B 2W Types:
    // Type A: Adjacent (e.g., 0,0,1,1)
    // Type B: Alternating (e.g., 0,1,0,1)

    let currentType = 'A'; // Start with A
    let beads = [0, 0, 1, 1];

    function setType(type) {
        currentType = type;
        if (type === 'A') {
            beads = [0, 0, 1, 1]; // Adjacent
        } else {
            beads = [0, 1, 0, 1]; // Alternating
        }
        render();
        updateInfo();
    }

    function render() {
        svg.innerHTML = '';

        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", CX);
        ring.setAttribute("cy", CY);
        ring.setAttribute("r", R);
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "#64748b");
        ring.setAttribute("stroke-width", "4");
        svg.appendChild(ring);

        // Positions: Top, Right, Bottom, Left
        const positions = [
            { x: CX, y: CY - R },
            { x: CX + R, y: CY },
            { x: CX, y: CY + R },
            { x: CX - R, y: CY }
        ];

        beads.forEach((cVal, i) => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", positions[i].x);
            circle.setAttribute("cy", positions[i].y);
            circle.setAttribute("r", 25);
            circle.setAttribute("fill", colors[cVal]);
            circle.setAttribute("stroke", "#94a3b8");
            circle.setAttribute("stroke-width", "3");
            svg.appendChild(circle);
        });
    }

    function rotateLogic() {
        const last = beads.pop();
        beads.unshift(last);
        render();
        updateInfo();
    }

    function reflectLogic() {
        // Vertical reflection swap left(3) and right(1)
        const temp = beads[1];
        beads[1] = beads[3];
        beads[3] = temp;
        render();
        updateInfo();
    }

    function updateInfo() {
        // Determine type based on current bead config to be safe
        let hasAdjacent = false;
        for (let i = 0; i < 4; i++) {
            if (beads[i] === beads[(i + 1) % 4]) hasAdjacent = true;
        }

        let text = "";
        // Removed Orbit Size count as requested
        if (hasAdjacent) {
            text = "Type 1: Adjacent Pair";
        } else {
            text = "Type 2: Alternating";
        }

        const info = document.getElementById('orbit-list');
        if (info) {
            info.innerHTML = `
                <h3 style="margin:0 0 5px 0; color:#38bdf8">${text}</h3>
            `;
        }
    }

    document.getElementById('neck-rotate')?.addEventListener('click', rotateLogic);
    document.getElementById('neck-reflect')?.addEventListener('click', reflectLogic);
    document.getElementById('neck-toggle-type')?.addEventListener('click', () => {
        if (currentType === 'A') setType('B');
        else setType('A');
    });

    render();
    updateInfo();
};
