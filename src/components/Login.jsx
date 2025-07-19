import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { usePromptStore } from "../store/promptStore";
import { useState, useEffect } from "react";

export default function Login() {
  const setUser = usePromptStore((s) => s.setUser);
  const [blocks, setBlocks] = useState([]);

  // Generate random blocks
  useEffect(() => {
    const generateBlock = () => ({
      id: Math.random(),
      x: Math.random() * 80 + 10, // 10% to 90% of screen width
      y: Math.random() * 80 + 10, // 10% to 90% of screen height
      width: Math.random() * 12 + 28, // w-14 to w-20 equivalent (56px to 80px)
      height: Math.random() * 6 + 10, // h-5 to h-8 equivalent (20px to 32px)
      color: ["indigo", "purple", "blue"][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.05 + 0.05, // 0.05 to 0.1
      duration: Math.random() * 4 + 6, // 6s to 10s lifespan
    });

    const addBlock = () => {
      const newBlock = generateBlock();
      setBlocks((prev) => [...prev, newBlock]);

      // Remove block after its duration
      setTimeout(() => {
        setBlocks((prev) => prev.filter((block) => block.id !== newBlock.id));
      }, newBlock.duration * 1000);
    };

    // Add initial blocks
    for (let i = 0; i < 1; i++) {
      setTimeout(() => addBlock(), i * 1000);
    }

    // Continue adding blocks at random intervals
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        // 70% chance to add a block
        addBlock();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes stitchFlow {
          0% { transform: translateX(-100px) translateY(-50px); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateX(calc(100vw + 100px)) translateY(50px); opacity: 0; }
        }
        
        @keyframes nodeGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        
        @keyframes blockFloat {
          0%   { opacity: 0; transform: scale(0.8) translateY(10px); }
          10%  { opacity: 0.4; }
          50%  { opacity: 0.8; transform: scale(1) translateY(0); }
          90%  { opacity: 0.4; transform: scale(1.05) translateY(-6px); }
          100% { opacity: 0; transform: scale(0.95) translateY(-12px); }
        }
        
        .gradient-shift {
          background: linear-gradient(-45deg, #0f172a, #1e40af, #7c3aed, #312e81);
          background-size: 400% 400%;
          animation: gradientShift 12s ease infinite;
        }
        
        .stitch-line {
          animation: stitchFlow 15s linear infinite;
        }
        
        .stitch-line:nth-child(2) { animation-delay: -5s; }
        .stitch-line:nth-child(3) { animation-delay: -10s; }
        
        .connection-node {
          animation: nodeGlow 4s ease-in-out infinite;
        }
        
        .connection-node:nth-child(2) { animation-delay: -1.3s; }
        .connection-node:nth-child(3) { animation-delay: -2.6s; }
        
        .random-block {
          animation: blockFloat var(--duration) ease-in-out forwards;
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center gradient-shift px-4 relative overflow-hidden">
        {/* Animated Stitching Lines */}
        {/* <div className="absolute inset-0 pointer-events-none"> 
          <div className="stitch-line absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"></div>
          <div className="stitch-line absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
          <div className="stitch-line absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
        </div> */}

        {/* Connection Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="connection-node absolute top-1/4 left-1/4 w-3 h-3 bg-indigo-400/50 rounded-full"></div>
          <div className="connection-node absolute top-2/3 right-1/3 w-3 h-3 bg-purple-400/50 rounded-full"></div>
          <div className="connection-node absolute top-1/2 left-2/3 w-3 h-3 bg-blue-400/50 rounded-full"></div>
          <div className="connection-node absolute top-1/3 right-1/4 w-2 h-2 bg-indigo-300/40 rounded-full"></div>
          <div className="connection-node absolute bottom-1/3 left-1/3 w-2 h-2 bg-purple-300/40 rounded-full"></div>
        </div>

        {/* Dynamic Random Blocks */}
        <div className="absolute inset-0 pointer-events-none">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`random-block absolute rounded-lg border bg-${block.color}-500 border-${block.color}-400`}
              style={{
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: `${block.width * 4}px`,
                height: `${block.height * 4}px`,
                /* animationDelay: `${Math.random() * 1.5}s`, */
                backgroundColor: `rgb(${
                  block.color === "indigo"
                    ? "99 102 241"
                    : block.color === "purple"
                    ? "168 85 247"
                    : "59 130 246"
                } / ${block.opacity})`,
                borderColor: `rgb(${
                  block.color === "indigo"
                    ? "129 140 248"
                    : block.color === "purple"
                    ? "196 181 253"
                    : "147 197 253"
                } / ${block.opacity * 2})`,
                "--duration": `${block.duration}s`,
              }}
            />
          ))}
        </div>
        {/* Login Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-100 shadow-2xl p-8 sm:p-10 w-full max-w-md text-center relative z-10">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 leading-tight mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to PromptStitch
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Build powerful, structured prompts with ease
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="
            w-full px-5 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl
            bg-gray-900 text-white 
            hover:bg-gray-800 
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
            shadow-md hover:shadow-lg
            flex items-center justify-center gap-3
            transition-all duration-200
          "
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-4">
            Secure authentication powered by Google
          </p>
        </div>
      </div>
    </>
  );
}
