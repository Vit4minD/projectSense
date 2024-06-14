// components/MathComponent.js
import React from "react";
import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

interface MathComponentProps {
  math: string; // Define the type of the 'math' prop as string
}

const MathComponent: React.FC<MathComponentProps> = ({ math }) => {
  return (
    <span
      style={{
        margin: "0",
        padding: "0",
        lineHeight: "1",
        fontSize: "inherit",
        overflowY: "hidden",
      }}
      className="overflow-y-hidden"
    >
      <InlineMath>{math}</InlineMath>
    </span>
  );
};

export default MathComponent;
