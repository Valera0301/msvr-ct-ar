// Converts degrees to radians
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// Generates Neovius surface geometry (vertices and indices)
function CreateNeoviusSurface(uSegments, vSegments) {
    const vertices = [];
    const indices = [];
    const uStart = -Math.PI, uEnd = Math.PI;
    const vStart = -Math.PI, vEnd = Math.PI;
    const uDelta = (uEnd - uStart) / uSegments;
    const vDelta = (vEnd - vStart) / vSegments;
    const vertIdx = [];

    // Generate vertices
    for (let vi = 0; vi <= vSegments; vi++) {
        vertIdx[vi] = [];
        for (let ui = 0; ui <= uSegments; ui++) {
            const u = uStart + ui * uDelta;
            const v = vStart + vi * vDelta;
            const cu = Math.cos(u);
            const cv = Math.cos(v);
            let zVal = (-3.0 * cu + -3.0 * cv) / (3.0 + 4.0 * cu * cv);
            zVal = Math.max(-1, Math.min(1, zVal));
            const z = Math.acos(zVal);
            vertices.push(u, v, z);
            vertIdx[vi][ui] = vertices.length / 3 - 1;
        }
    }

    // Generate triangle indices
    for (let vi = 0; vi < vSegments; vi++) {
        for (let ui = 0; ui < uSegments; ui++) {
            const a = vertIdx[vi][ui];
            const b = vertIdx[vi][ui + 1];
            const c = vertIdx[vi + 1][ui];
            const d = vertIdx[vi + 1][ui + 1];
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    return {
        vertexArray: new Float32Array(vertices),
        indexArray: new Uint16Array(indices)
    };
}

// A-Frame component to display and animate the Neovius surface
AFRAME.registerComponent('neovius-surface', {
    init: function () {
        const scene = this.el.sceneEl.object3D;
        const meshData = CreateNeoviusSurface(15, 15);

        // Create geometry from generated data
        const bufferGeom = new THREE.BufferGeometry();
        bufferGeom.setAttribute('position', new THREE.BufferAttribute(meshData.vertexArray, 3));
        bufferGeom.setIndex(new THREE.BufferAttribute(meshData.indexArray, 1));
        bufferGeom.computeVertexNormals();

        // Solid surface material
        const meshMat = new THREE.MeshStandardMaterial({
            color: 0x3A9AD9,
            side: THREE.DoubleSide,
            metalness: 0.4,
            roughness: 0.6
        });

        // Wireframe overlay material
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });

        // Create mesh objects
        this.neoviusMesh = new THREE.Mesh(bufferGeom, meshMat);
        this.neoviusWire = new THREE.Mesh(bufferGeom, wireMat);

        // Add to A-Frame entity
        this.el.object3D.add(this.neoviusMesh);
        this.el.object3D.add(this.neoviusWire);

        // Transform the model
        this.el.object3D.position.set(0, 0, 0);
        this.el.object3D.rotation.set(0, 0, Math.PI / 2);
        this.el.object3D.scale.set(0.3, 0.3, 0.3);

        // Add basic lighting
        const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(1, 1, 2);
        this.el.object3D.add(ambLight);
        this.el.object3D.add(dirLight);

        // Set up marker tracking
        this.animActive = false;
        this.markerRoot = this.el.parentNode;

        this.markerRoot.addEventListener('markerFound', () => {
            this.animActive = true;
            this.animateSurface();
        });

        this.markerRoot.addEventListener('markerLost', () => {
            this.animActive = false;
            this.neoviusMesh.rotation.set(0, 0, 0);
            this.neoviusWire.rotation.set(0, 0, 0);
            this.neoviusMesh.position.set(0, 0, 0);
            this.neoviusWire.position.set(0, 0, 0);
        });
    },

    // Animation loop (called on each frame)
    animateSurface: function () {
        if (!this.animActive) return;

        const t = performance.now() * 0.001;
        const rotAngle = 12 * t;
        this.neoviusMesh.rotation.y = degToRad(rotAngle);
        this.neoviusWire.rotation.y = degToRad(rotAngle);
        
        requestAnimationFrame(this.animateSurface.bind(this));
    },

    remove: function () {
        this.animActive = false;
    }
});
