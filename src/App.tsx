import {
  Mesh,
  BufferGeometry,
  NormalBufferAttributes,
  Material,
  Object3DEventMap,
  Vector3,
  Matrix4,
} from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import "./App.css";
import * as d3 from "d3";
import { DragControls } from "@react-three/drei";

type Vertex = {
  id: number;
  x: number;
  y: number;
  matrix: Matrix4;
};

type VertexLink = {
  source: number;
  target: number;
};

function Box(props: ThreeElements["group"]) {
  const [vertices] = useState<Vertex[]>([
    { id: 1, x: 0, y: 0, matrix: new Matrix4() },
    { id: 2, x: 0, y: 0, matrix: new Matrix4() },
    { id: 3, x: 0, y: 0, matrix: new Matrix4() },
    { id: 4, x: 0, y: 0, matrix: new Matrix4() },
    { id: 5, x: 0, y: 0, matrix: new Matrix4() },
    { id: 6, x: 0, y: 0, matrix: new Matrix4() },
    { id: 7, x: 0, y: 0, matrix: new Matrix4() },
  ]);

  const [links] = useState<VertexLink[]>([
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 4, target: 1 },
    { source: 1, target: 5 },
    { source: 1, target: 6 },
    { source: 7, target: 4 },
  ]);

  const verticesRef = useRef<
    Mesh<
      BufferGeometry<NormalBufferAttributes>,
      Material | Material[],
      Object3DEventMap
    >[]
  >([]);

  const cylinderRef = useRef<
    Mesh<
      BufferGeometry<NormalBufferAttributes>,
      Material | Material[],
      Object3DEventMap
    >[]
  >([]);

  const simulation = useMemo(() => {
    const ticked = () => {};
    const simulation = d3
      .forceSimulation<Vertex>()
      .force("charge", d3.forceManyBody())
      .force(
        "link",
        d3
          .forceLink<Vertex, VertexLink>()
          .distance(10)
          .id((d) => d.id)
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", ticked);
    return simulation;
  }, []);

  useEffect(() => {
    simulation.nodes(vertices);
  }, [vertices, simulation]);

  useEffect(() => {
    const linkForce = simulation.force("link") as d3.ForceLink<
      Vertex,
      VertexLink
    >;
    if (!linkForce) {
      console.log("linkForce is null");
      return;
    } else {
      console.log("linkForce set");
    }
    linkForce.links(links);
  }, [links, simulation]);

  const end = useMemo(() => new Vector3(0, 0, 0), []);
  const start = useMemo(() => new Vector3(0, 0, 0), []);

  useFrame(() => {
    if (verticesRef.current.length <= 0) {
      return;
    }
    simulation.tick(1);
    vertices.forEach((vertex) => {
      vertex.matrix.setPosition(vertex.x, vertex.y, 0);
    });
    links.forEach((link, index) => {
      const resolvedLink = link as unknown as {
        source: Vertex;
        target: Vertex;
      };
      const source = resolvedLink.source;
      const target = resolvedLink.target;
      const mesh = cylinderRef.current[index];

      if (mesh && source && target) {
        end.set(target.x, target.y, 0);
        start.set(source.x, source.y, 0);

        const direction = end.sub(start);
        const center = start.add(direction.clone().multiplyScalar(0.5));

        mesh.position.copy(center);
        mesh.scale.set(0.5, direction.length(), 0.5);
        mesh.quaternion.setFromUnitVectors(
          new Vector3(0, 1, 0),
          direction.clone().normalize()
        );
      }
    });
  });

  return (
    <group {...props}>
      {vertices.map((vertex, index) => (
        <DragControls
          key={vertex.id}
          autoTransform={false}
          matrix={vertex.matrix}
          onDrag={(localMatrix) => {
            // vertex.matrix.copy(localMatrix);
            const vertex = vertices[index];

            const x = localMatrix.elements[12];
            const y = localMatrix.elements[13];
            //const z = localMatrix.elements[14]

            vertex.x = x;
            vertex.y = y;
          }}
        >
          <mesh
            ref={(ref) => {
              if (!ref) return;
              verticesRef.current[vertex.id - 1] = ref;
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={"#2f74c0"} />
          </mesh>
        </DragControls>
      ))}
      {links.map((_link, index) => {
        return (
          <mesh
            key={index}
            ref={(ref) => {
              if (!ref) return;
              cylinderRef.current[index] = ref;
            }}
          >
            <cylinderGeometry args={[0.1, 0.1, 1, 32]} />
            <meshStandardMaterial color={"red"} />
          </mesh>
        );
      })}
    </group>
  );
}

export const App = () => (
  <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
    <ambientLight intensity={Math.PI / 2} />
    <spotLight
      position={[10, 10, 10]}
      angle={0.15}
      penumbra={1}
      decay={0}
      intensity={Math.PI}
    />
    <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
    <Box position={[0, 0, 0]} />
  </Canvas>
);
