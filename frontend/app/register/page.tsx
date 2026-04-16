"use client"

import { useState } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", response.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-8">Create Account</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#282828] text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-[#3B82F6] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Sign Up
        </button>
        <p className="text-center text-[#a1a1a1]">
          Already have an account? <Link href="/login" className="text-[#3B82F6] hover:underline">Log in</Link>
        </p>
      </form>
    </main>
  );
}