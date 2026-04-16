"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import Link from "next/link";

export default function NewTrip() {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/trips/", {
        name,
        destination,
        start_date: startDate,
        end_date: endDate,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create trip");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Trip</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Trip Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          required
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          required
        />
        <div className="space-y-2">
          <label className="text-[#a1a1a1] text-sm">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[#a1a1a1] text-sm">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-[#3B82F6] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Create Trip
        </button>
        <Link href="/dashboard" className="block text-center text-[#a1a1a1] hover:underline">
          Back to Dashboard
        </Link>
      </form>
    </main>
  );
}