import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FileMetadata } from '../../types';
import { ControlDock } from './ControlDock';

interface KnowledgeSpace3DProps {
  files: FileMetadata[];
  onSelectFile?: (file: FileMetadata) => void;
  selectedFile?: FileMetadata | null;
}

// Pre-allocated scratch vectors for zero-GC animation loop
const _vec3Target = new THREE.Vector3();
const _vec3Pos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

export const KnowledgeSpace3D: React.FC<KnowledgeSpace3DProps> = ({
  files,
  onSelectFile,
  selectedFile,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewPreset, setViewPreset] = useState<'core' | 'orbit' | 'top'>('orbit');
  const [separation, setSeparation] = useState<number>(1.2);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.8);
  const [activeFilter, setActiveFilter] = useState<'all' | 'document' | 'audio' | 'image'>('all');
  const [hoveredFile, setHoveredFile] = useState<FileMetadata | null>(null);

  // References to keep mutable state for animation loop without recreating the scene
  const stateRef = useRef({
    viewPreset: 'orbit' as 'core' | 'orbit' | 'top',
    separation: 1.2,
    rotationSpeed: 0.8,
    activeFilter: 'all' as 'all' | 'document' | 'audio' | 'image',
    files,
    selectedFile,
    hoveredFile: null as FileMetadata | null,
    onSelectFile,
  });

  stateRef.current = {
    viewPreset,
    separation,
    rotationSpeed,
    activeFilter,
    files,
    selectedFile,
    hoveredFile,
    onSelectFile,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.035);

    const getDims = () => {
      const w = container.clientWidth || container.offsetWidth || window.innerWidth;
      const h = container.clientHeight || container.offsetHeight || (window.innerHeight - 56);
      return { width: Math.max(w, 400), height: Math.max(h, 400) };
    };
    const initialDims = getDims();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      initialDims.width / initialDims.height,
      0.1,
      100
    );
    camera.position.set(7, 5, 8);
    camera.lookAt(0, 1.2, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialDims.width, initialDims.height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point Lighting Rig
    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.8);
    keyLight.position.set(6, 10, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool fill light
    const fillLight = new THREE.HemisphereLight(0x7fb3ff, 0x121722, 1.2);
    scene.add(fillLight);

    // Blue rim accent light
    const rimLight = new THREE.DirectionalLight(0x6366f1, 1.5);
    rimLight.position.set(-6, 3, -6);
    scene.add(rimLight);

    // Ground Floor Grid with procedural canvas texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const fctx = floorCanvas.getContext('2d')!;
    fctx.fillStyle = '#0a0e17';
    fctx.fillRect(0, 0, 256, 256);
    fctx.strokeStyle = '#1e293b';
    fctx.lineWidth = 1.5;
    fctx.strokeRect(0, 0, 256, 256);
    fctx.strokeStyle = '#312e81';
    fctx.strokeRect(64, 64, 128, 128);

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 16);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.01;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Procedural soft radial contact shadow for base
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const contactShadowGeo = new THREE.PlaneGeometry(7, 7);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // ==========================================
    // HERO SUBJECT: 8-Part Holographic Neural Core
    // ==========================================
    const heroCoreGroup = new THREE.Group();
    heroCoreGroup.position.set(0, 0, 0);

    // Part 1: Heavy Tiered Plinth Base (Titanium finish)
    const baseGeo = new THREE.CylinderGeometry(2.0, 2.3, 0.35, 36);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.35 / 2;
    baseMesh.castShadow = !isSoftwareGl;
    baseMesh.receiveShadow = !isSoftwareGl;
    heroCoreGroup.add(baseMesh);

    // Part 2: Energy Conduit Trim Ring (Brushed Gold)
    const ring1Geo = new THREE.TorusGeometry(2.15, 0.06, 16, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.15,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, goldMat);
    ring1Mesh.rotation.x = Math.PI / 2;
    ring1Mesh.position.y = 0.36;
    heroCoreGroup.add(ring1Mesh);

    // Part 3: Lower Magnetic Gyro Ring
    const gyro1Geo = new THREE.TorusGeometry(1.6, 0.08, 16, 48);
    const gyro1Mat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const gyro1Mesh = new THREE.Mesh(gyro1Geo, gyro1Mat);
    gyro1Mesh.position.y = 1.3;
    heroCoreGroup.add(gyro1Mesh);

    // Part 4: Middle Gimbal Ring
    const gyro2Geo = new THREE.TorusGeometry(1.3, 0.06, 16, 48);
    const gyro2Mat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.7,
      roughness: 0.25,
    });
    const gyro2Mesh = new THREE.Mesh(gyro2Geo, gyro2Mat);
    gyro2Mesh.position.y = 1.3;
    gyro2Mesh.rotation.x = Math.PI / 3;
    heroCoreGroup.add(gyro2Mesh);

    // Part 5: Central Octahedral Refraction Crystal (Luminous violet PBR)
    const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0x581c87,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 1.3;
    heroCoreGroup.add(crystalMesh);

    // Part 6: Upper Flux Harmonic Ring
    const fluxGeo = new THREE.TorusGeometry(0.9, 0.05, 16, 36);
    const fluxMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const fluxMesh = new THREE.Mesh(fluxGeo, fluxMat);
    fluxMesh.position.y = 1.3;
    fluxMesh.rotation.y = Math.PI / 4;
    heroCoreGroup.add(fluxMesh);

    // Part 7: Optical Top Emitter Focal Lens
    const lensGeo = new THREE.CylinderGeometry(0.2, 0.45, 0.25, 24);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.15,
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.y = 2.4;
    heroCoreGroup.add(lensMesh);

    // Part 8: 4 Resonance Stabilizer Struts
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3,
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const strutGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.8, 12);
      const strutMesh = new THREE.Mesh(strutGeo, strutMat);
      strutMesh.position.set(Math.cos(angle) * 1.7, 1.0, Math.sin(angle) * 1.7);
      strutMesh.rotation.z = Math.cos(angle) * -0.15;
      strutMesh.rotation.x = Math.sin(angle) * 0.15;
      heroCoreGroup.add(strutMesh);
    }

    scene.add(heroCoreGroup);

    // ==========================================
    // PROCEDURAL MEDIA NODES GROUP
    // ==========================================
    const mediaNodesGroup = new THREE.Group();
    scene.add(mediaNodesGroup);

    // Raycast target mesh registry
    const clickableMeshes: { mesh: THREE.Mesh; file: FileMetadata }[] = [];

    // Helper to generate procedural document texture
    const docCanvas = document.createElement('canvas');
    docCanvas.width = 128;
    docCanvas.height = 160;
    const dctx = docCanvas.getContext('2d')!;
    dctx.fillStyle = '#f8fafc';
    dctx.fillRect(0, 0, 128, 160);
    dctx.fillStyle = '#dc2626'; // PDF red banner
    dctx.fillRect(10, 12, 108, 16);
    dctx.fillStyle = '#94a3b8';
    for (let y = 38; y < 145; y += 10) {
      dctx.fillRect(14, y, y % 20 === 0 ? 70 : 100, 3);
    }
    const docTexture = new THREE.CanvasTexture(docCanvas);
    docTexture.colorSpace = THREE.SRGBColorSpace;

    function buildNodeMesh(file: FileMetadata, index: number, total: number, sep: number) {
      const nodeGroup = new THREE.Group();
      const angle = (index / Math.max(total, 1)) * Math.PI * 2;
      const radius = 4.2 * sep;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 1.0 + Math.sin(index * 1.7) * 0.4;
      nodeGroup.position.set(x, y, z);

      let primaryColor = 0x3b82f6; // Document Blue
      if (file.fileType === 'audio') primaryColor = 0x10b981; // Emerald
      if (file.fileType === 'image') primaryColor = 0xf59e0b; // Amber

      let interactiveMesh: THREE.Mesh;

      if (file.fileType === 'document') {
        // Document Pylon: 3-part composite (Backplate, page face, badge)
        const pylonGroup = new THREE.Group();
        const backGeo = new THREE.BoxGeometry(0.8, 1.1, 0.08);
        const backMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.6,
          roughness: 0.3,
        });
        const backMesh = new THREE.Mesh(backGeo, backMat);
        pylonGroup.add(backMesh);

        const pageGeo = new THREE.PlaneGeometry(0.72, 1.0);
        const pageMat = new THREE.MeshStandardMaterial({
          map: docTexture,
          roughness: 0.4,
          metalness: 0.1,
        });
        const pageMesh = new THREE.Mesh(pageGeo, pageMat);
        pageMesh.position.z = 0.045;
        pylonGroup.add(pageMesh);

        interactiveMesh = backMesh;
        nodeGroup.add(pylonGroup);
      } else if (file.fileType === 'audio') {
        // Audio Resonator: 3-part composite (Chamber, wave coil, emitter)
        const audioGroup = new THREE.Group();
        const cylinderGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 24);
        const cylinderMat = new THREE.MeshStandardMaterial({
          color: 0x064e3b,
          metalness: 0.8,
          roughness: 0.2,
        });
        const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
        audioGroup.add(cylinderMesh);

        const coilGeo = new THREE.TorusGeometry(0.42, 0.04, 12, 32);
        const coilMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          metalness: 0.9,
          roughness: 0.15,
        });
        const coilMesh1 = new THREE.Mesh(coilGeo, coilMat);
        coilMesh1.rotation.x = Math.PI / 2;
        coilMesh1.position.y = 0.2;
        audioGroup.add(coilMesh1);

        const coilMesh2 = coilMesh1.clone();
        coilMesh2.position.y = -0.2;
        audioGroup.add(coilMesh2);

        interactiveMesh = cylinderMesh;
        nodeGroup.add(audioGroup);
      } else {
        // Image / Visual Holo-Plate: 3-part composite (Border, holo lens, floating node)
        const imgGroup = new THREE.Group();
        const frameGeo = new THREE.BoxGeometry(1.1, 0.8, 0.06);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x78350f,
          metalness: 0.7,
          roughness: 0.3,
        });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        imgGroup.add(frameMesh);

        const screenGeo = new THREE.PlaneGeometry(1.0, 0.7);
        const screenMat = new THREE.MeshPhysicalMaterial({
          color: 0xfbbf24,
          roughness: 0.2,
          metalness: 0.1,
          clearcoat: 0.8,
        });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.position.z = 0.035;
        imgGroup.add(screenMesh);

        interactiveMesh = frameMesh;
        nodeGroup.add(imgGroup);
      }

      // Dynamic connection line connecting to central core
      const lineMat = new THREE.LineBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.5,
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-x, 1.3 - y, -z),
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      nodeGroup.add(line);

      // Contact grounding shadow under each media node
      const nodeShadowGeo = new THREE.CircleGeometry(0.7, 16);
      const nodeShadow = new THREE.Mesh(nodeShadowGeo, contactShadowMat);
      nodeShadow.rotation.x = -Math.PI / 2;
      nodeShadow.position.y = -y + 0.02;
      nodeGroup.add(nodeShadow);

      interactiveMesh.castShadow = !isSoftwareGl;
      interactiveMesh.receiveShadow = !isSoftwareGl;

      clickableMeshes.push({ mesh: interactiveMesh, file });
      mediaNodesGroup.add(nodeGroup);
    }

    function refreshNodes() {
      // Clear previous nodes
      while (mediaNodesGroup.children.length > 0) {
        const obj = mediaNodesGroup.children[0];
        mediaNodesGroup.remove(obj);
      }
      clickableMeshes.length = 0;

      const currentFiles = stateRef.current.files;
      const currentFilter = stateRef.current.activeFilter;
      const filtered = currentFiles.filter((f) =>
        currentFilter === 'all' ? true : f.fileType === currentFilter
      );

      filtered.forEach((file, idx) => {
        buildNodeMesh(file, idx, filtered.length, stateRef.current.separation);
      });
    }

    refreshNodes();

    // Raycast handling for hover & selection
    const handlePointerMove = (evt: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      _pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointer, camera);
      const meshes = clickableMeshes.map((c) => c.mesh);
      const intersects = _raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const hit = clickableMeshes.find(
          (c) => c.mesh === intersects[0].object || c.mesh.children.includes(intersects[0].object as any)
        );
        if (hit) {
          container.style.cursor = 'pointer';
          setHoveredFile(hit.file);
          return;
        }
      }
      container.style.cursor = 'default';
      setHoveredFile(null);
    };

    const handleClick = () => {
      _raycaster.setFromCamera(_pointer, camera);
      const meshes = clickableMeshes.map((c) => c.mesh);
      const intersects = _raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        const hit = clickableMeshes.find(
          (c) => c.mesh === intersects[0].object || c.mesh.children.includes(intersects[0].object as any)
        );
        if (hit && stateRef.current.onSelectFile) {
          stateRef.current.onSelectFile(hit.file);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // Camera target positions for presets
    const cameraTargets: Record<'core' | 'orbit' | 'top', THREE.Vector3> = {
      core: new THREE.Vector3(0, 3.2, 5.0),
      orbit: new THREE.Vector3(7, 5, 8),
      top: new THREE.Vector3(0.01, 12, 0.01),
    };

    // Render on demand to prevent software WebGL starvation
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    function renderScene() {
      // Camera positioning for preset
      const targetPos = cameraTargets[stateRef.current.viewPreset];
      camera.position.copy(targetPos);
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        renderScene();
        renderBusy = false;
        if (renderDirty) requestRender();
      });
    }

    // Initial render
    renderScene();
    requestRender();

    // Re-render when props or control state change
    const checkStateInterval = setInterval(() => {
      if (stateRef.current.rotationSpeed > 0) {
        if (crystalMesh) {
          crystalMesh.rotation.y += 0.04 * stateRef.current.rotationSpeed;
        }
        if (gyro1Mesh) {
          gyro1Mesh.rotation.z += 0.04 * stateRef.current.rotationSpeed;
        }
        requestRender();
      }
    }, 500);

    // Handle container resize via ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      const { width: nw, height: nh } = getDims();
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      requestRender();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(checkStateInterval);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-950 select-none">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Header Info */}
      <div className="absolute top-4 left-5 pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
            Multimodal Neural Knowledge Space
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Interactive 3D synthesis of readings, lecture acoustics, and diagrams. Click any node to inspect.
        </p>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredFile && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 30,
          }}
          className="bg-slate-900/95 border border-indigo-500/80 rounded-xl px-4 py-2 shadow-2xl text-slate-100 text-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2 font-medium text-indigo-300">
            <span className="capitalize font-semibold">{hoveredFile.fileType}</span>
            <span>•</span>
            <span className="text-slate-100 font-bold truncate max-w-[220px]">
              {hoveredFile.originalName}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm truncate">
            {hoveredFile.summary || 'Click to inspect cross-modal connections'}
          </p>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <ControlDock
        viewPreset={viewPreset}
        onSelectView={setViewPreset}
        separation={separation}
        onSeparationChange={setSeparation}
        rotationSpeed={rotationSpeed}
        onRotationSpeedChange={setRotationSpeed}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        nodeCount={files.length}
        selectedNodeTitle={selectedFile?.originalName}
        onResetSelection={() => onSelectFile && onSelectFile(null as any)}
      />
    </div>
  );
};
