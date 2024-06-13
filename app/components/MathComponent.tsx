// components/MathComponent.js
import React from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

interface MathComponentProps {
  math: string; // Define the type of the 'math' prop as string
}

const MathComponent: React.FC<MathComponentProps> = ({ math }) => {
  return (
    <div
      style={{
        margin: "0",
        padding: "0",
        lineHeight: "1",
        fontSize: "inherit",
      }}
    >
      <BlockMath>{math}</BlockMath>
    </div>
  );
};

export default MathComponent;
