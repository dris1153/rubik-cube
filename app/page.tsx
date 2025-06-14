"use client";

import Button from "@/components/Button";
import { Scene } from "@/components/Scene";

export default function Home() {
  return (
    <div className="h-screen w-screen relative flex flex-col justify-center items-center bg-[#13060B]">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="w-full h-full relative z-10 flex flex-col items-center justify-center px-4">
        <h1
          className="text-7xl"
          style={{
            fontFamily: "'Funnel Display', 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            letterSpacing: "0.05em",
            background: "linear-gradient(90deg, #FF212D, #FFEC86)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            textShadow: `
      1px 1px 0 rgba(255, 33, 45, 0.6),
      2px 2px 2px rgba(0, 0, 0, 0.2)
    `,
            transform: "rotateX(5deg) rotateY(-8deg)",
            perspective: "800px",
            zIndex: 10,
            textTransform: "uppercase",
            position: "relative",
          }}
        >
          Anam Chain
        </h1>

        <p
          className="text-xl mt-2 text-center"
          style={{
            fontFamily: "'Funnel Display', 'Helvetica Neue', sans-serif",
            color: "white",
            maxWidth: "600px",
            lineHeight: 1.6,
            textShadow: "0 0 6px rgba(255, 236, 134, 0.4)",
            opacity: 0.95,
          }}
        >
          A Reputation-Based Blockchain
        </p>
        <div className="flex items-center justify-center gap-4 mt-6 w-full min-[400px]:max-w-[320px] flex-wrap flex-col min-[400px]:flex-row">
          <Button className="flex-1 w-full max-[400px]:before:hidden">
            White Paper
          </Button>
          <Button className="flex-1 w-full max-[400px]:before:hidden">
            Faucet
          </Button>
        </div>
      </div>
    </div>
  );
}
