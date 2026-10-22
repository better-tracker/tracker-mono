import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  Matrix4,
  MOUSE,
  Quaternion,
  TOUCH,
  Vector3,
} from 'three';
import { applyLabelVisibility, placeLabels, type LabelRect } from './labels';
import {
  openingView,
  selectedBranch,
  zoomDetail,
  type Graph,
  type GraphNode,
  type Selection,
} from './graph';

interface Props {
  graph: Graph;
  fullGraph: Graph;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  autoOrbit: boolean;
  reducedMotion: boolean;
  resetVersion: number;
  active: boolean;
  onFailure: () => void;
  onReset: () => void;
}
interface SceneProps extends Props {
  surface: HTMLDivElement;
  container: RefObject<HTMLDivElement | null>;
  tooltip: RefObject<HTMLDivElement | null>;
  labels: RefObject<Map<string, HTMLElement>>;
}

function Edges({ graph, branch }: { graph: Graph; branch: Set<string> }) {
  const geometries = useMemo(() => {
    const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
    const normal: number[] = [];
    const selected: number[] = [];
    for (const edge of graph.edges) {
      const points =
        branch.has(edge.source) && branch.has(edge.target) ? selected : normal;
      points.push(
        ...nodes.get(edge.source)!.position,
        ...nodes.get(edge.target)!.position,
      );
    }
    return [normal, selected].map((points) =>
      new BufferGeometry().setAttribute(
        'position',
        new Float32BufferAttribute(points, 3),
      ),
    );
  }, [graph, branch]);
  useEffect(
    () => () => geometries.forEach((geometry) => geometry.dispose()),
    [geometries],
  );
  return (
    <>
      {geometries.map((geometry, index) => (
        <lineSegments key={index} geometry={geometry}>
          <lineBasicMaterial
            color={index ? '#68695e' : '#aaa79b'}
            transparent
            opacity={index ? 0.72 : 0.32}
            depthWrite={false}
          />
        </lineSegments>
      ))}
    </>
  );
}

function Scene(props: SceneProps) {
  const {
    graph,
    fullGraph,
    selection,
    onSelect,
    autoOrbit,
    reducedMotion,
    resetVersion,
    active,
    onFailure,
    onReset,
    container,
    tooltip,
    labels,
    surface,
  } = props;
  const { camera, size, invalidate, gl } = useThree();
  const [opening] = useState(() =>
    openingView(fullGraph, size.width / size.height),
  );
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const mesh = useRef<InstancedMesh>(null);
  const branch = useMemo(
    () => selectedBranch(graph, selection.taskId),
    [graph, selection.taskId],
  );
  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      scale: new Vector3(),
      rotation: new Quaternion(),
      color: new Color(),
    }),
    [],
  );
  const previousScale = useRef(-1);
  const labelSizes = useRef(
    new Map<string, { width: number; height: number }>(),
  );
  const dirtySizes = useRef(true);
  const lastReset = useRef(resetVersion);

  useLayoutEffect(() => {
    camera.position.fromArray(opening.position);
    camera.lookAt(...opening.target);
    controls.current?.target.fromArray(opening.target);
    controls.current?.update();
    controls.current?.saveState();
    invalidate();
  }, [camera, opening, invalidate]);

  useEffect(() => {
    if (lastReset.current === resetVersion) return;
    lastReset.current = resetVersion;
    // Flush damping deltas before restoring the pose; reset() alone retains them.
    const currentControls = controls.current;
    if (currentControls) {
      currentControls.autoRotate = false;
      currentControls.enableDamping = false;
      currentControls.update();
      currentControls.reset();
      currentControls.enableDamping = !reducedMotion;
    }
    camera.position.fromArray(opening.position);
    controls.current?.target.fromArray(opening.target);
    camera.lookAt(...opening.target);
    controls.current?.update();
    invalidate();
  }, [resetVersion, camera, opening, invalidate, reducedMotion]);

  useLayoutEffect(() => {
    previousScale.current = -1;
    graph.nodes.forEach((node, index) => {
      const color = scratch.color.set(node.color);
      if (selection.taskId && !branch.has(node.id))
        color.lerp(new Color('#f3f1ea'), 0.32);
      mesh.current?.setColorAt(index, color);
    });
    if (mesh.current?.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    dirtySizes.current = true;
    invalidate();
  }, [graph, branch, selection.taskId, scratch, invalidate]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = new ResizeObserver(() => {
      dirtySizes.current = true;
      invalidate();
    });
    resize.observe(element);
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (mounted) {
        dirtySizes.current = true;
        invalidate();
      }
    });
    const focus = () => invalidate();
    element.addEventListener('focusin', focus);
    element.addEventListener('focusout', focus);
    return () => {
      mounted = false;
      resize.disconnect();
      element.removeEventListener('focusin', focus);
      element.removeEventListener('focusout', focus);
    };
  }, [container, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    controls.current?.listenToKeyEvents(element);
    const currentControls = controls.current;
    const resetKey = (event: KeyboardEvent) => {
      if (event.target !== element || event.key.toLowerCase() !== 'r') return;
      onReset();
    };
    element.addEventListener('keydown', resetKey);
    return () => {
      currentControls?.stopListenToKeyEvents();
      element.removeEventListener('keydown', resetKey);
    };
  }, [container, onReset]);

  useEffect(() => {
    invalidate();
  }, [autoOrbit, active, reducedMotion, invalidate]);

  useFrame(() => {
    const element = container.current;
    if (!element || !active || !controls.current || !mesh.current) return;
    const distance = camera.position.distanceTo(controls.current.target);
    const { opacity, dotScale } = zoomDetail(distance, opening.scale);
    element.setAttribute('data-label-opacity', opacity.toFixed(3));
    element.setAttribute('data-distance', distance.toFixed(2));
    element.setAttribute('data-baseline-scale', String(opening.scale));
    element.setAttribute('data-camera', camera.position.toArray().join(','));
    element.setAttribute(
      'data-target',
      controls.current.target.toArray().join(','),
    );
    if (Math.abs(previousScale.current - dotScale) > 0.0001) {
      graph.nodes.forEach((node, index) => {
        const radius =
          (node.kind === 'workspace'
            ? 3
            : node.kind === 'project'
              ? 3.6
              : node.kind === 'task'
                ? 4
                : 1.9) *
          dotScale *
          (branch.has(node.id) ? 1.22 : 1);
        scratch.matrix.compose(
          scratch.position.fromArray(node.position),
          scratch.rotation,
          scratch.scale.setScalar(radius),
        );
        mesh.current!.setMatrixAt(index, scratch.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.computeBoundingSphere();
      previousScale.current = dotScale;
    }
    camera.updateMatrixWorld();
    const points = graph.nodes.map((node) => {
      const vector = scratch.position.fromArray(node.position).project(camera);
      return {
        node,
        x: ((vector.x + 1) * size.width) / 2,
        y: ((1 - vector.y) * size.height) / 2,
        z: vector.z,
      };
    });
    const candidates: LabelRect[] = [];
    for (const point of points) {
      const label = labels.current.get(point.node.id);
      if (!label) continue;
      if (dirtySizes.current || !labelSizes.current.has(point.node.id))
        labelSizes.current.set(point.node.id, {
          width: label.offsetWidth,
          height: label.offsetHeight,
        });
      const dimensions = labelSizes.current.get(point.node.id)!;
      const x = Math.max(
        4,
        Math.min(point.x + 11, size.width - dimensions.width - 4),
      );
      const y = point.y - dimensions.height / 2;
      label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      const clipped =
        point.z < -1 ||
        point.z > 1 ||
        point.x < 0 ||
        point.x > size.width ||
        x < 0 ||
        y < 0 ||
        x + dimensions.width > size.width ||
        y + dimensions.height > size.height;
      const occluded =
        !clipped &&
        points.some(
          (other) =>
            other.z < point.z - 0.00001 &&
            Math.hypot(other.x - point.x, other.y - point.y) <
              (other.node.kind === 'subtask' ? 3 : 6) * dotScale,
        );
      if (
        clipped ||
        occluded ||
        (point.node.kind === 'subtask' &&
          point.node.taskId !== selection.taskId)
      )
        continue;
      const focused = label.contains(document.activeElement);
      candidates.push({
        id: point.node.id,
        x,
        y,
        ...dimensions,
        priority: focused
          ? 0
          : point.node.kind === 'task'
            ? point.node.taskId === selection.taskId
              ? 1
              : 2
            : point.node.kind === 'subtask'
              ? 4
              : 3,
      });
    }
    dirtySizes.current = false;
    const placed = placeLabels(candidates);
    for (const [id, label] of labels.current)
      applyLabelVisibility(label, opacity, placed.has(id), element);
  });

  const pick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5 || event.instanceId === undefined) return;
    const node = graph.nodes[event.instanceId];
    if (!node?.taskId) return;
    event.stopPropagation();
    onSelect({
      taskId: node.taskId,
      subtaskId: node.kind === 'subtask' ? node.entityId : null,
    });
  };
  const hover = (event: ThreeEvent<PointerEvent>) => {
    const node =
      event.instanceId === undefined
        ? undefined
        : graph.nodes[event.instanceId];
    if (!node || !tooltip.current || !container.current) return;
    const rect = container.current.getBoundingClientRect();
    tooltip.current.replaceChildren(document.createTextNode(node.title));
    tooltip.current.style.setProperty('display', 'block');
    tooltip.current.style.setProperty(
      'left',
      `${Math.max(0, Math.min(event.clientX - rect.left + 12, rect.width - 200))}px`,
    );
    tooltip.current.style.setProperty(
      'top',
      `${Math.max(0, Math.min(event.clientY - rect.top + 12, rect.height - 60))}px`,
    );
  };
  return (
    <>
      <OrbitControls
        ref={controls}
        domElement={surface}
        makeDefault
        enabled={active}
        enableDamping={!reducedMotion}
        dampingFactor={0.075}
        autoRotate={autoOrbit}
        autoRotateSpeed={0.45}
        minDistance={350 * opening.scale}
        maxDistance={4000 * opening.scale}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
      />
      <Edges graph={graph} branch={branch} />
      <instancedMesh
        ref={mesh}
        key={graph.nodes.length}
        args={[undefined, undefined, graph.nodes.length]}
        onClick={pick}
        onPointerMove={hover}
        onPointerOut={() => {
          if (tooltip.current)
            tooltip.current.style.setProperty('display', 'none');
        }}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function NodeLabel({
  node,
  selected,
  register,
  onSelect,
}: {
  node: GraphNode;
  selected: boolean;
  register: (id: string, element: HTMLElement | null) => void;
  onSelect: Props['onSelect'];
}) {
  const ref = useCallback(
    (element: HTMLElement | null) => register(node.id, element),
    [node.id, register],
  );
  const content = (
    <>
      <span className="graph-label-text">{node.title}</span>
      <span className="graph-label-full" aria-hidden="true">
        {node.title}
      </span>
    </>
  );
  const common = {
    ref,
    className: 'graph-node-label',
    'data-kind': node.kind,
    'data-selected': selected,
    'data-node-id': node.id,
    title: node.title,
    'aria-hidden': true as const,
  };
  return node.kind === 'task' ? (
    <button
      {...common}
      type="button"
      tabIndex={-1}
      aria-label={`Select ${node.title}`}
      aria-pressed={selected}
      onClick={(event) => {
        if (event.currentTarget.dataset.interactive === 'true')
          onSelect({ taskId: node.entityId, subtaskId: null });
      }}
    >
      {content}
    </button>
  ) : (
    <span {...common}>{content}</span>
  );
}

export default function GraphCanvas(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const bindContainer = useCallback((element: HTMLDivElement | null) => {
    container.current = element;
    setSurface(element);
  }, []);
  const tooltip = useRef<HTMLDivElement>(null);
  const labels = useRef(new Map<string, HTMLElement>());
  const pointer = useRef({ x: 0, y: 0, moved: false });
  const register = useCallback((id: string, element: HTMLElement | null) => {
    if (element) labels.current.set(id, element);
    else {
      if (labels.current.get(id)?.contains(document.activeElement))
        container.current?.focus({ preventScroll: true });
      labels.current.delete(id);
    }
  }, []);
  return (
    <div
      ref={bindContainer}
      className="graph-canvas"
      role="region"
      aria-label="Interactive work graph"
      aria-describedby="graph-canvas-instructions"
      tabIndex={0}
      onPointerDownCapture={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY, moved: false };
      }}
      onPointerMoveCapture={(event) => {
        if (
          Math.hypot(
            event.clientX - pointer.current.x,
            event.clientY - pointer.current.y,
          ) > 5
        )
          pointer.current.moved = true;
      }}
      onClickCapture={(event) => {
        if (pointer.current.moved && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <span id="graph-canvas-instructions" className="graph-sr-only">
        Drag open space to orbit, right-drag to pan, scroll to zoom. Arrow keys
        pan, R resets. Use List to select any task with the keyboard.
      </span>
      {surface && (
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ fov: 36, position: [0, 0, 1100], near: 1, far: 100000 }}
          gl={{ antialias: true, alpha: true }}
          fallback="Your browser does not support the 3D canvas. Use List view."
        >
          <Scene
            {...props}
            surface={surface}
            container={container}
            tooltip={tooltip}
            labels={labels}
          />
        </Canvas>
      )}
      <div className="graph-label-layer">
        {props.graph.nodes
          .filter(
            (node) =>
              node.kind !== 'subtask' || node.taskId === props.selection.taskId,
          )
          .map((node) => (
            <NodeLabel
              key={node.id}
              node={node}
              selected={
                node.kind === 'task' && node.entityId === props.selection.taskId
              }
              register={register}
              onSelect={props.onSelect}
            />
          ))}
      </div>
      <div ref={tooltip} className="graph-tooltip" role="tooltip" />
    </div>
  );
}
