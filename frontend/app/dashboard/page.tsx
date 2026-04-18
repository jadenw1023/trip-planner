"use client"
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  role: string;
}

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchTrips() {
      try {
        const response = await api.get("/trips/");
        setTrips(response.data);
      } catch (err) {
        console.error("Failed to fetch trips", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#a1a1a1] text-lg">Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold">Your Trips</h1>
        <div className="flex gap-3">
          <Link
            href="/join"
            className="px-6 py-2 border border-[#3B82F6] text-[#3B82F6] font-semibold rounded-lg hover:bg-[#3B82F6] hover:text-white transition-colors"
          >
            Join Trip
          </Link>
          <Link
            href="/trips/new"
            className="px-6 py-2 bg-[#3B82F6] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            New Trip
          </Link>
          <button
            onClick={handleLogout}
            className="px-6 py-2 text-[#6B7280] hover:text-white transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {trips.length === 0 ? (
        <p className="text-[#a1a1a1]">No trips yet. Create your first one!</p>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="flex items-center justify-between bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors"
            >
              <div>
                <p className="font-semibold">{trip.name}</p>
                <p className="text-[#a1a1a1] text-sm">{trip.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-[#3B82F6] text-sm">{trip.start_date} → {trip.end_date}</p>
                <p className="text-[#a1a1a1] text-xs">{trip.role}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}