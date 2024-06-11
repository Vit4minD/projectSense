import React, { useEffect } from "react";

function MathJaxLoader() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://polyfill.io/v3/polyfill.min.js?features=es6";
    script.async = true;
    script.onload = () => {
      const mathJaxScript = document.createElement("script");
      mathJaxScript.src =
        "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      mathJaxScript.async = true;
      document.body.appendChild(mathJaxScript);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // You can return null since this component doesn't render anything
}

export default MathJaxLoader;
