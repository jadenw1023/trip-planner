import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-6xl font-bold tracking-tight mb-4">
        Trip <span className="text-[#3B82F6]">Planner</span>
      </h1>
      <p className="text-[#a1a1a1] text-lg mb-10">
        Plan trips together in real time.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-8 py-3 bg-[#3B82F6] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 border border-[#3B82F6] text-[#3B82F6] font-semibold rounded-lg hover:bg-[#3B82F6] hover:text-white transition-colors"
        >
          Log In
        </Link>
      </div>
    </main>
  );
}