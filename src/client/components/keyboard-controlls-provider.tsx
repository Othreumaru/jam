import { KeyboardControls, KeyboardControlsEntry } from "@react-three/drei";
import { useMemo } from "react";

const Controls = {
  spawn: "spawn" as const,
};

export type Controls = keyof typeof Controls;

export const KeyboardControlsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const map = useMemo<KeyboardControlsEntry<Controls>[]>(
    () => [{ name: Controls.spawn, keys: ["KeyA"] }],
    []
  );
  return <KeyboardControls map={map}>{children}</KeyboardControls>;
};
