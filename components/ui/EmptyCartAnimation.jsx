"use client";

import Lottie from "lottie-react";
import emptyBoxAnimation from "@/public/animations/Empty Box.json";

export default function EmptyCartAnimation({ className = "w-40 h-40 mx-auto" }) {
  return (
    <div className={className}>
      {/* Canvas renderer avoids lottie-web's SVG renderer removeChild/NotFoundError
          on teardown when this conditionally-mounted animation unmounts. */}
      <Lottie
        animationData={emptyBoxAnimation}
        loop
        autoplay
        renderer="canvas"
      />
    </div>
  );
}
