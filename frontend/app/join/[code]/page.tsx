"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";

export default function JoinByLinkPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [status, setStatus] = useState("Joining trip...");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push(`/login?redirect=/join/${code}`);
      return;
    }

    async function joinTrip() {
      try {
        const response = await api.post(`/trips/join/${code}`);
        router.push(`/trips/${response.data.trip.id}`);
      } catch (err: any) {
        setStatus(err.response?.data?.detail || "Failed to join trip");
      }
    }

    joinTrip();
  }, [code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[#a1a1a1] text-lg">{status}</p>
    </div>
  );
}