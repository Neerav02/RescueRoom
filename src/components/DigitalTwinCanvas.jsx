import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createDigitalTwinAssembly,
  updateExplodedAssembly,
  disposeAssembly,
  INDUSTRIAL_PALETTE,
  SUBSYSTEM_CAMERA_TARGETS,
} from '../lib/digitalTwinAssembly';

/**
 * High-performance Three.js Canvas Controller for RescueRoom's Digital Twin.
 * Features:
 * - Always-active 360° OrbitControls (Wheel zoom in/out, drag rotate, right-click pan)
 * - Precision camera focal transitions to isolated subsystems
 * - Bounded aspect ratio preventing vertical distortion or black voids
 * - Floating on-screen zoom (+ / -), reset, and 360° turntable controls
 * - Throttled screen-space 2D leader line projection
 */
export default function DigitalTwinCanvas({
  renderMode = 'pbr',
  activeFaultId = 'BOOM_CYLINDER',
  isResolved = false,
  hoveredSubsystemId = null,
  selectedSubsystemId = 'ALL',
  explodedAmount = 0.0,
  cameraPreset = null,
  autoRotate = false,
  onProjectedCoordinates = null,
  onSelectSubsystem = null,
  onHoverSubsystem = null,
  onWebGLError = null,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    subsystems: [],
    masterGroup: null,
    animationFrameId: null,
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
    width: 0,
    height: 0,
    lastCoordTime: 0,
  });

  const [hasWebGL] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  });

  // Notify parent if WebGL is unavailable
  useEffect(() => {
    if (!hasWebGL && onWebGLError) {
      onWebGLError();
    }
  }, [hasWebGL, onWebGLError]);

  // Main Three.js Scene Setup & Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !hasWebGL) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(INDUSTRIAL_PALETTE.cadGrid);
    scene.fog = new THREE.FogExp2(INDUSTRIAL_PALETTE.cadGrid, 0.025);

    // 2. Camera: Balanced field of view (44 deg) with full-machine framing
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    // Initial camera placement: provides generous breathing room framing the entire assembly
    camera.position.set(8.5, 4.8, 8.5);
    camera.lookAt(0, 0.4, 0);

    // 3. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('[DigitalTwin] WebGL init error:', e);
      if (onWebGLError) onWebGLError();
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls: ALWAYS ACTIVE so user can rotate, zoom, and pan freely
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.0;
    controls.maxDistance = 24.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera from going beneath floor grid
    controls.target.set(0, 0.4, 0);
    controls.enabled = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.2;

    // 5. Lighting: High-contrast engineering illumination
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(7, 11, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(INDUSTRIAL_PALETTE.safetyAmber, 0.85);
    fillLight.position.set(-7, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(INDUSTRIAL_PALETTE.cadLine, 1.9);
    rimLight.position.set(0, -3, -7);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0x18282e, 1.6);
    scene.add(ambientLight);

    // 6. Master Assembly
    const { masterGroup, subsystems } = createDigitalTwinAssembly();
    scene.add(masterGroup);

    // Store references
    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      subsystems,
      masterGroup,
      animationFrameId: null,
      clock: new THREE.Clock(),
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(-999, -999),
      width,
      height,
      lastCoordTime: 0,
    };

    // Resize Observer with aspect ratio update
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          stateRef.current.width = newW;
          stateRef.current.height = newH;
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // WebGL Context Lost Protection
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('[DigitalTwin] WebGL context lost. Suspending render loop.');
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
    };
    const handleContextRestored = () => {
      console.info('[DigitalTwin] WebGL context restored.');
    };

    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup on unmount
    return () => {
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      disposeAssembly(masterGroup);
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hasWebGL, onWebGLError]);

  // Update autoRotate dynamically
  useEffect(() => {
    if (stateRef.current.controls) {
      stateRef.current.controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Smooth Camera Fly-To when selectedSubsystemId or cameraPreset changes
  useEffect(() => {
    if (!stateRef.current.camera || !stateRef.current.controls) return;
    const { camera, controls } = stateRef.current;

    let targetConfig = SUBSYSTEM_CAMERA_TARGETS[selectedSubsystemId || 'ALL'] || SUBSYSTEM_CAMERA_TARGETS.ALL;

    if (cameraPreset) {
      switch (cameraPreset) {
        case 'iso':
          targetConfig = { pos: [8.5, 5.0, 8.5], target: [0, 0.4, 0] };
          break;
        case 'top':
          targetConfig = { pos: [0.01, 12.0, 0.01], target: [0, 0, 0] };
          break;
        case 'side':
          targetConfig = { pos: [10.0, 1.4, 0], target: [0, 0.4, 0] };
          break;
        case 'boom':
          targetConfig = SUBSYSTEM_CAMERA_TARGETS.BOOM_CYLINDER;
          break;
        case 'pump':
          targetConfig = SUBSYSTEM_CAMERA_TARGETS.SWASHPLATE_PUMP;
          break;
        default:
          break;
      }
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = new THREE.Vector3(...targetConfig.pos);
    const endTarget = new THREE.Vector3(...targetConfig.target);

    let startTime = performance.now();
    const duration = 600; // 600ms smooth fly-to transition

    let activeFly = true;
    const onUserInteract = () => {
      activeFly = false;
      controls.removeEventListener('start', onUserInteract);
    };
    controls.addEventListener('start', onUserInteract);

    const stepTransition = (now) => {
      if (!activeFly) return;
      const progress = Math.min(1.0, (now - startTime) / duration);
      // Cubic ease in-out
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (progress < 1.0) {
        requestAnimationFrame(stepTransition);
      } else {
        controls.removeEventListener('start', onUserInteract);
      }
    };
    requestAnimationFrame(stepTransition);

    return () => {
      activeFly = false;
      controls.removeEventListener('start', onUserInteract);
    };
  }, [selectedSubsystemId, cameraPreset]);

  // Pointer Interaction (Raycasting & Hover)
  const handlePointerMove = useCallback((e) => {
    const container = mountRef.current;
    if (!container || !stateRef.current.renderer) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    stateRef.current.mouse.set(x, y);

    const { raycaster, camera, subsystems } = stateRef.current;
    if (!camera || !subsystems.length) return;

    raycaster.setFromCamera(stateRef.current.mouse, camera);

    const interactiveMeshes = [];
    subsystems.forEach((sub) => {
      sub.traverse((child) => {
        if (child.isMesh) {
          child.userData.subsystemId = sub.userData.id;
          interactiveMeshes.push(child);
        }
      });
    });

    const intersects = raycaster.intersectObjects(interactiveMeshes, false);
    if (intersects.length > 0) {
      const hitId = intersects[0].object.userData.subsystemId;
      if (onHoverSubsystem) onHoverSubsystem(hitId);
      container.style.cursor = 'pointer';
    } else {
      if (onHoverSubsystem) onHoverSubsystem(null);
      container.style.cursor = 'grab';
    }
  }, [onHoverSubsystem]);

  const handlePointerDown = useCallback(() => {
    const { raycaster, camera, subsystems, mouse } = stateRef.current;
    if (!camera || !subsystems.length) return;

    raycaster.setFromCamera(mouse, camera);
    const interactiveMeshes = [];
    subsystems.forEach((sub) => {
      sub.traverse((child) => {
        if (child.isMesh) {
          child.userData.subsystemId = sub.userData.id;
          interactiveMeshes.push(child);
        }
      });
    });

    const intersects = raycaster.intersectObjects(interactiveMeshes, false);
    if (intersects.length > 0) {
      const hitId = intersects[0].object.userData.subsystemId;
      if (onSelectSubsystem) onSelectSubsystem(hitId);
    }
  }, [onSelectSubsystem]);

  // Main Render & Animation Loop
  useEffect(() => {
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      stateRef.current.animationFrameId = animId;

      const {
        scene,
        camera,
        renderer,
        controls,
        subsystems,
        clock,
        width,
        height,
      } = stateRef.current;

      if (!scene || !camera || !renderer) return;

      const elapsedTime = clock.getElapsedTime();

      // Update Controls (inertia damping and autoRotate)
      if (controls) {
        controls.update();
      }

      // Update Exploded Positions & Attention Isolation Materials
      updateExplodedAssembly({
        subsystems,
        explodedAmount,
        renderMode,
        activeFaultId,
        isResolved,
        hoveredSubsystemId,
        selectedSubsystemId,
        elapsedTime,
      });

      // Project 3D Annotation Anchors into 2D Screen Space (Throttled to 10 FPS to prevent React thrashing)
      if (
        onProjectedCoordinates &&
        subsystems.length > 0 &&
        width > 0 &&
        height > 0 &&
        elapsedTime - stateRef.current.lastCoordTime > 0.1
      ) {
        stateRef.current.lastCoordTime = elapsedTime;
        const coordsMap = {};
        for (let sub of subsystems) {
          const anchor = sub.userData.annotationAnchor.clone();
          sub.localToWorld(anchor);

          // Project to normalized device coordinates [-1, 1]
          anchor.project(camera);

          const screenX = ((anchor.x + 1) * width) / 2;
          const screenY = ((-anchor.y + 1) * height) / 2;
          const isVisible = anchor.z < 1.0; // In front of camera

          coordsMap[sub.userData.id] = {
            x: Math.round(screenX),
            y: Math.round(screenY),
            visible: isVisible,
            name: sub.userData.name,
            partNumber: sub.userData.partNumber,
          };
        }
        onProjectedCoordinates(coordsMap);
      }

      // Render Scene
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    renderMode,
    activeFaultId,
    isResolved,
    hoveredSubsystemId,
    selectedSubsystemId,
    explodedAmount,
    onProjectedCoordinates,
  ]);

  // Floating Control Handlers (Zoom in, Zoom out, Reset view)
  const handleZoomIn = () => {
    const { camera, controls } = stateRef.current;
    if (!camera || !controls) return;
    const dir = new THREE.Vector3().subVectors(controls.target, camera.position);
    if (dir.length() > controls.minDistance + 0.5) {
      camera.position.addScaledVector(dir, 0.2);
      controls.update();
    }
  };

  const handleZoomOut = () => {
    const { camera, controls } = stateRef.current;
    if (!camera || !controls) return;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (dir.length() < controls.maxDistance - 1.0) {
      camera.position.addScaledVector(dir, 0.2);
      controls.update();
    }
  };

  const handleResetView = () => {
    const { camera, controls } = stateRef.current;
    if (!camera || !controls) return;
    camera.position.set(8.5, 4.8, 8.5);
    controls.target.set(0, 0.4, 0);
    controls.update();
    if (onSelectSubsystem) onSelectSubsystem('ALL');
  };

  if (!hasWebGL) {
    return (
      <div
        className="paper-card"
        style={{
          padding: '24px',
          margin: '24px',
          backgroundColor: 'var(--color-paper-light)',
          border: 'var(--border-ink)',
        }}
      >
        <span className="stamp stamp-critical">WEBGL ACCELERATION REQUIRED</span>
        <h3 style={{ margin: '8px 0 4px' }}>3D Graphics Acceleration Unavailable</h3>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
          Your browser does not currently support WebGL hardware acceleration. Please ensure hardware acceleration is enabled in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Three.js Mount Container */}
      <div
        ref={mountRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* Floating CAD HUD Navigation Controls (Zoom In, Zoom Out, Reset, 360) */}
      <div
        style={{
          position: 'absolute',
          right: '16px',
          bottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 35,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={handleZoomIn}
          className="btn"
          style={{
            width: '36px',
            height: '36px',
            padding: 0,
            fontSize: '1.2rem',
            fontWeight: 700,
            backgroundColor: 'rgba(20, 32, 31, 0.92)',
            color: 'var(--color-bone)',
            borderColor: 'var(--color-cad-stroke)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom In (+)"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="btn"
          style={{
            width: '36px',
            height: '36px',
            padding: 0,
            fontSize: '1.2rem',
            fontWeight: 700,
            backgroundColor: 'rgba(20, 32, 31, 0.92)',
            color: 'var(--color-bone)',
            borderColor: 'var(--color-cad-stroke)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom Out (-)"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          className="btn"
          style={{
            width: '36px',
            height: '36px',
            padding: 0,
            fontSize: '0.9rem',
            fontWeight: 700,
            backgroundColor: 'rgba(20, 32, 31, 0.92)',
            color: 'var(--color-hazard)',
            borderColor: 'var(--color-cad-stroke)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Reset Full Machine View (⟲)"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
