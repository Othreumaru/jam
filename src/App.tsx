import {
  Mesh,
  BufferGeometry,
  NormalBufferAttributes,
  Material,
  Object3DEventMap,
  Vector3,
  Matrix4,
} from "three";
import { useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import "./App.css";
import * as d3 from "d3";
import { DragControls, useKeyboardControls } from "@react-three/drei";
import {
  Controls,
  KeyboardControlsProvider,
} from "./client/components/keyboard-controlls-provider";
import { useVertexStore, Vertex } from "./client/state";

type NodeDatum = d3.SimulationNodeDatum & {
  id: number;
  x: number;
  y: number;
  matrix: Matrix4;
  mesh: Mesh<
    BufferGeometry<NormalBufferAttributes>,
    Material | Material[],
    Object3DEventMap
  > | null;
};

type LinkDatum = d3.SimulationLinkDatum<NodeDatum> & {
  mesh: Mesh<
    BufferGeometry<NormalBufferAttributes>,
    Material | Material[],
    Object3DEventMap
  > | null;
};

function Spider(props: ThreeElements["group"]) {
  const [selectedVertex, setSelectedVertex] = useState<Vertex | null>(null);
  const [sub] = useKeyboardControls<Controls>();

  const [nodeDatums, setNodeDatums] = useState<NodeDatum[]>([]);
  const [linksDatums, setLinksDatums] = useState<LinkDatum[]>([]);

  const vertices = useVertexStore((state) => state.vertices);
  const links = useVertexStore((state) => state.links);
  const addLinkedVertex = useVertexStore((state) => state.addLinkedVertex);

  console.log("vertices", vertices);
  console.log("nodeDatums", nodeDatums);

  useEffect(() => {
    return sub(
      (state) => state.spawn,
      (pressed) => {
        if (pressed && selectedVertex) {
          const nodeDatum = nodeDatums.find(
            (nodeDatum) => nodeDatum.id === selectedVertex.id
          );
          if (!nodeDatum) {
            console.log("nodeDatum not found");
            return;
          }
          addLinkedVertex(nodeDatum.x, nodeDatum.y, selectedVertex.id);
        }
      }
    );
  }, [sub, addLinkedVertex, selectedVertex]);

  const simulation = useMemo(() => {
    const simulation = d3
      .forceSimulation<NodeDatum>()
      .force("charge", d3.forceManyBody())
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>()
          .distance(10)
          .id((d) => d.id)
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(0)
      .stop();
    return simulation;
  }, []);

  useEffect(() => {
    const newNodeDatums = vertices.map((vertex) => ({
      ...vertex,
      matrix: new Matrix4(),
      mesh: null,
    }));
    setNodeDatums(newNodeDatums);
    simulation.nodes(newNodeDatums);

    const newLinksDatum = links.map((link) => ({
      ...link,
      source: newNodeDatums[link.source - 1],
      target: newNodeDatums[link.target - 1],
      mesh: null,
    }));
    setLinksDatums(newLinksDatum);

    const linkForce = simulation.force("link") as d3.ForceLink<
      NodeDatum,
      LinkDatum
    >;
    if (!linkForce) {
      console.log("linkForce is null");
      return;
    } else {
      console.log("linkForce set");
    }
    linkForce.links(newLinksDatum);
    simulation.alpha(0.3).restart();
  }, [simulation, links, vertices]);

  const end = useMemo(() => new Vector3(0, 0, 0), []);
  const start = useMemo(() => new Vector3(0, 0, 0), []);

  useFrame(() => {
    if (nodeDatums.length <= 0) {
      return;
    }
    simulation.tick(1);
    nodeDatums.forEach((vertex) => {
      vertex.matrix.setPosition(vertex.x, vertex.y, 0);
    });
    linksDatums.forEach((link) => {
      const resolvedLink = link as unknown as {
        source: Vertex;
        target: Vertex;
      };
      const source = resolvedLink.source;
      const target = resolvedLink.target;

      if (link.mesh && source && target) {
        end.set(target.x, target.y, 0);
        start.set(source.x, source.y, 0);

        const direction = end.sub(start);
        const center = start.add(direction.clone().multiplyScalar(0.5));

        link.mesh.position.copy(center);
        link.mesh.scale.set(0.5, direction.length(), 0.5);
        link.mesh.quaternion.setFromUnitVectors(
          new Vector3(0, 1, 0),
          direction.clone().normalize()
        );
      }
    });
  });

  return (
    <group {...props}>
      {nodeDatums.map((vertex, index) => (
        <DragControls
          key={vertex.id}
          autoTransform={false}
          matrix={nodeDatums[index].matrix}
          onDragStart={() => {
            setSelectedVertex(vertex);
            simulation.alphaTarget(0.3).restart();
          }}
          onDragEnd={() => {
            simulation.alphaTarget(0).restart();
            vertex.fx = undefined;
            vertex.fy = undefined;
          }}
          onDrag={(localMatrix) => {
            // vertex.matrix.copy(localMatrix);
            const x = localMatrix.elements[12];
            const y = localMatrix.elements[13];
            //const z = localMatrix.elements[14]

            vertex.fx = x;
            vertex.fy = y;
          }}
        >
          <mesh
            ref={(ref) => {
              if (!ref) return;
              vertex.mesh = ref;
            }}
            onClick={() => {
              setSelectedVertex(vertex);
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={selectedVertex === vertex ? "red" : "#2f74c0"}
            />
          </mesh>
        </DragControls>
      ))}
      {linksDatums.map((link, index) => {
        return (
          <mesh
            key={index}
            ref={(ref) => {
              if (!ref) return;
              link.mesh = ref;
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
  <KeyboardControlsProvider>
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
      <Spider />
    </Canvas>
  </KeyboardControlsProvider>
);
