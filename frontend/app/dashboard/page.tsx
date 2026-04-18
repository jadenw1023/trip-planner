"use client"
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDestinationImage } from "../../lib/unsplash";

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  role: string;
  imageUrl?: string;
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
        const tripsData = response.data;

        const tripsWithImages = await Promise.all(
          tripsData.map(async (trip: Trip) => {
            const imageUrl = await getDestinationImage(trip.destination);
            return { ...trip, imageUrl };
          })
        );

        setTrips(tripsWithImages);
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
        <p className="text-[#6B7280] text-lg">Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">Your Trips</h1>
          <p className="text-[#6B7280]">Plan your next adventure.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/join"
            className="px-5 py-2 border border-[#2563EB] text-[#2563EB] font-semibold rounded-lg hover:bg-[#2563EB] hover:text-white transition-colors"
          >
            Join Trip
          </Link>
          <Link
            href="/trips/new"
            className="px-5 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
          >
            New Trip
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-2 text-[#6B7280] hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B7280] text-lg mb-4">No trips yet.</p>
          <Link
            href="/trips/new"
            className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white"
            >
              <div
                className="h-48 bg-cover bg-center"
                style={{
                  backgroundImage: trip.imageUrl
                    ? `url(${trip.imageUrl})`
                    : "linear-gradient(135deg, #2563EB, #7C3AED)",
                }}
              />
              <div className="p-5">
                <h2 className="text-xl font-bold mb-1">{trip.name}</h2>
                <p className="text-[#6B7280]">{trip.destination}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-[#2563EB] text-sm font-medium">{trip.start_date} → {trip.end_date}</p>
                  <span className="text-xs bg-[#EFF6FF] text-[#2563EB] px-2 py-1 rounded-full">{trip.role}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}