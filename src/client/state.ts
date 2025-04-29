import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type Vertex = {
  id: number;
  x: number;
  y: number;
};

export type VertexLink = {
  source: number;
  target: number;
};

export type State = {
  nextId: number;
  vertices: Vertex[];
  links: VertexLink[];
  addVertex: (vertex: Vertex) => void;
  addLinkedVertex: (x: number, y: number, existingVertexId: number) => void;
  addLink: (link: VertexLink) => void;
};

export const useVertexStore = create(
  immer<State>((set) => ({
    nextId: 13,
    vertices: [
      { id: 1, x: 0, y: 0 },
      { id: 2, x: 0, y: 0 },
      { id: 3, x: 0, y: 0 },
      { id: 4, x: 0, y: 0 },
      { id: 5, x: 0, y: 0 },
      { id: 6, x: 0, y: 0 },
      { id: 7, x: 0, y: 0 },
      { id: 8, x: 0, y: 0 },
      { id: 9, x: 0, y: 0 },
      { id: 10, x: 0, y: 0 },
      { id: 11, x: 0, y: 0 },
      { id: 12, x: 0, y: 0 },
    ],
    links: [
      { source: 1, target: 2 },
      { source: 2, target: 3 },
      { source: 4, target: 1 },
      { source: 1, target: 5 },
      { source: 1, target: 6 },
      { source: 7, target: 4 },
      { source: 8, target: 5 },
      { source: 9, target: 6 },
      { source: 10, target: 7 },
      { source: 11, target: 8 },
      { source: 12, target: 9 },
      { source: 1, target: 10 },
      { source: 2, target: 11 },
      { source: 3, target: 12 },
      { source: 4, target: 5 },
      { source: 6, target: 7 },
    ],
    addVertex: (vertex) =>
      set((state) => {
        state.vertices.push(vertex);
      }),
    addLinkedVertex: (x, y, existingVertexId) =>
      set((state) => {
        const newVertex: Vertex = {
          id: state.nextId,
          x,
          y,
        };
        state.vertices.push(newVertex);
        state.links.push({
          source: existingVertexId,
          target: newVertex.id,
        });
        state.nextId += 1;
      }),
    addLink: (link) =>
      set((state) => {
        state.links.push(link);
      }),
  }))
);
