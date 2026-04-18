"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import Link from "next/link";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post(`/trips/join/${code}`);
      router.push(`/trips/${response.data.trip.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to join trip");
    }
  }

  return (
    <main className="min-h-screen flex">
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1920&q=80')",
        }}
      />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-2">Join a Trip</h1>
          <p className="text-[#6B7280] mb-8">Enter the invite code to join your group.</p>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Invite Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              Join Trip
            </button>
            <Link href="/dashboard" className="block text-center text-[#6B7280] hover:underline">
              Back to Dashboard
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}