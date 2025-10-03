import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const parallaxX = (mousePosition.x - window.innerWidth / 2) / 50;
  const parallaxY = (mousePosition.y - window.innerHeight / 2) / 50;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-20 left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl animate-pulse"
          style={{
            transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            transition: "transform 0.2s ease-out",
          }}
        />
        <div
          className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse"
          style={{
            transform: `translate(${-parallaxX}px, ${-parallaxY}px)`,
            transition: "transform 0.2s ease-out",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl animate-pulse"
          style={{
            transform: `translate(calc(-50% + ${
              parallaxX * 0.5
            }px), calc(-50% + ${parallaxY * 0.5}px))`,
            transition: "transform 0.2s ease-out",
            animationDelay: "0.5s",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main content */}
      <div className="relative z-10 mx-4 max-w-2xl text-center">
        {/* 404 Number with glitch effect */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-foreground drop-shadow-xl animate-pulse">
            404
          </h1>
          <div
            className="absolute inset-0 text-9xl font-black text-emerald-600/50 opacity-50 blur-sm animate-pulse"
            style={{ animationDelay: "0.1s" }}>
            404
          </div>
        </div>

        {/* Main message */}
        <h2 className="mb-4 text-3xl font-bold text-foreground">
          Lost in Space
        </h2>
        <p className="mb-6 text-base text-muted-foreground">
          The page you're looking for has drifted into another dimension.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          Route:{" "}
          <span className="font-mono text-foreground">{location.pathname}</span>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/"
            className="group flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all">
            <Home className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Back to Home
          </a>

          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-muted text-foreground border border-border rounded-lg font-medium hover:bg-muted/80 hover:scale-105 transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>

        {/* Floating astronaut/icon */}
        {/* <div className="mt-16 flex justify-center">
          <div className="animate-bounce">
            <Search className="w-16 h-16 text-muted-foreground/50" />
          </div>
        </div> */}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-500 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotFound;
