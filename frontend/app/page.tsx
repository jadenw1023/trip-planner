import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-4 text-white">
          Trip Planner
        </h1>
        <p className="text-white/80 text-xl mb-10">
          Plan trips together, in real time.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}