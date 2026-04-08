export function initNecklace() {
    const svg = document.getElementById('necklace-svg');
    if (!svg) return;

    const CX = 200, CY = 200;
    const R = 100; // Radius of necklace
    const colors = ['#1e293b', '#f8fafc']; // Black, White (using theme colors)
    const colorNames = ['B', 'W'];

    // State: 0 = Black, 1 = White
    // Let's standard 4 beads: Top, Right, Bottom, Left
    let beads = [0, 0, 1, 1]; // Initial: B B W W

    function render() {
        // Clear SVG (keep it simple, just rebuild)
        svg.innerHTML = '';

        // Draw connector ring
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", CX);
        ring.setAttribute("cy", CY);
        ring.setAttribute("r", R);
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "#64748b");
        ring.setAttribute("stroke-width", "4");
        svg.appendChild(ring);

        // Draw Beads
        const positions = [
            { x: CX, y: CY - R }, // Top (0)
            { x: CX + R, y: CY }, // Right (1)
            { x: CX, y: CY + R }, // Bottom (2)
            { x: CX - R, y: CY }  // Left (3)
        ];

        beads.forEach((cVal, i) => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", positions[i].x);
            circle.setAttribute("cy", positions[i].y);
            circle.setAttribute("r", 20);
            circle.setAttribute("fill", colors[cVal]);
            circle.setAttribute("stroke", "#94a3b8");
            circle.setAttribute("stroke-width", "2");
            circle.style.cursor = "pointer";

            // Allow clicking to toggle color
            circle.addEventListener('click', () => {
                beads[i] = 1 - beads[i];
                render();
                updateInfo();
            });

            svg.appendChild(circle);
        });

        // Draw Axis helper if needed? Maybe later
    }

    function rotate() {
        // [0, 1, 2, 3] -> [3, 0, 1, 2]
        const last = beads.pop();
        beads.unshift(last);
        render();
        updateInfo();
    }

    function reflect() {
        // Reflect across vertical axis (Left <-> Right)
        // 0 (Top) stays, 2 (Bottom) stays. 1 and 3 swap.
        // Wait, D4 has multiple reflections. Let's do Vertical specifically.
        const temp = beads[1];
        beads[1] = beads[3];
        beads[3] = temp;
        render();
        updateInfo();
    }

    function updateInfo() {
        const countSpan = document.getElementById('neck-count');

        // Simple distinct count logic for 2B 2W only?
        // Or general? The user prompt asked "Distinct necklaces with 2 Black and 2 White".
        // Let's count current B and W
        const numW = beads.reduce((a, b) => a + b, 0);

        let text = "";
        if (numW === 2) {
            // It's 2B 2W.
            // Check if adjacent or alternating.
            // Adjacent: 0,0,1,1 (normalized)
            // Alternating: 0,1,0,1

            // Quick check: is there a pair of same colors adjacent?
            let hasAdjacent = false;
            for (let i = 0; i < 4; i++) {
                if (beads[i] === beads[(i + 1) % 4]) hasAdjacent = true;
            }

            if (hasAdjacent) text = "Type A (Adjacent Pair) - Orbit Size 4";
            else text = "Type B (Alternating) - Orbit Size 2";

            countSpan.textContent = "2 (Total 2B2W types)";
        } else {
            text = "Count not 2B 2W";
            countSpan.textContent = "-";
        }

        document.getElementById('orbit-list').innerHTML = `<p>${text}</p>`;
    }

    document.getElementById('neck-rotate')?.addEventListener('click', rotate);
    document.getElementById('neck-reflect')?.addEventListener('click', reflect);
    document.getElementById('neck-reset')?.addEventListener('click', () => {
        beads = [0, 0, 1, 1];
        render();
        updateInfo();
    });

    render();
    updateInfo();
}
