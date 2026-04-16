"use client"

import { useState, useEffect } from "react";
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
        <main className="flex flex-col items-center justify-center min-h-screen px-4">
            <h1 className="text-3xl font-bold mb-8">Join a Trip</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <input
                    type="text"
                    placeholder="Trip Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    required
                />
                <button
                    type="submit"
                    className="w-full py-3 bg-[#3B82F6] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                    Join Trip
                </button>
                <p className="text-center text-[#a1a1a1]">
                    Don&apos;t have a trip code? <Link href="/trips/new" className="text-[#3B82F6] hover:underline">Create a new trip</Link>
                </p>
            </form>
        </main>
    );
}