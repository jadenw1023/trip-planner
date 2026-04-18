"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getSocket, disconnectSocket } from "../../../lib/socket";
import { getDestinationImage } from "../../../lib/unsplash";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  invite_code: string;
  members: { id: string; name: string; role: string }[];
}

interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  category: string;
  votes: number;
}

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  paid_by: string;
}

interface Suggestion {
  name: string;
  description: string;
  location: string;
  category: string;
}

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [newExpense, setNewExpense] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchTrip() {
      try {
        const response = await api.get(`/trips/${tripId}`);
        setTrip(response.data);

        const image = await getDestinationImage(response.data.destination);
        setHeroImage(image);

        const actResponse = await api.get(`/trips/${tripId}/activities`);
        setActivities(actResponse.data);

        const budgetResponse = await api.get(`/trips/${tripId}/budget`);
        setBudgetItems(budgetResponse.data.items);
        setBudgetTotal(budgetResponse.data.total);
      } catch (err) {
        console.error("Failed to fetch trip", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId, router]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      socket.emit("join_trip", { trip_id: tripId });
    });

    socket.on("activity_added", (data) => {
      setActivities((prev) => [...prev, data]);
    });

    socket.on("vote_updated", (data) => {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === data.activity_id ? { ...a, votes: data.total_votes } : a
        )
      );
    });

    socket.on("budget_updated", (data) => {
      setBudgetItems((prev) => [...prev, data.item]);
      setBudgetTotal(data.total);
    });

    return () => {
      socket.emit("leave_trip", { trip_id: tripId });
      disconnectSocket();
    };
  }, [tripId]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post(`/trips/${tripId}/activities`, {
        name: newActivity,
        location: newLocation,
        date: newDate,
        category: newCategory,
      });
      setActivities([...activities, response.data]);
      setNewActivity("");
      setNewLocation("");
      setNewDate("");
      setNewCategory("");
    } catch (err) {
      console.error("Failed to add activity", err);
    }
  }

  async function handleVote(activityId: string, value: number) {
    try {
      await api.post(`/trips/${tripId}/activities/${activityId}/vote`, { value });
      const response = await api.get(`/trips/${tripId}/activities`);
      setActivities(response.data);
    } catch (err) {
      console.error("Failed to vote", err);
    }
  }

  async function handleDeleteActivity(activityId: string) {
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
      setActivities(activities.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error("Failed to delete activity", err);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/trips/${tripId}/budget`, {
        name: newExpense,
        amount: parseFloat(newAmount),
      });
      const response = await api.get(`/trips/${tripId}/budget`);
      setBudgetItems(response.data.items);
      setBudgetTotal(response.data.total);
      setNewExpense("");
      setNewAmount("");
    } catch (err) {
      console.error("Failed to add expense", err);
    }
  }

  async function handleDeleteExpense(itemId: string) {
    try {
      await api.delete(`/trips/${tripId}/budget/${itemId}`);
      const response = await api.get(`/trips/${tripId}/budget`);
      setBudgetItems(response.data.items);
      setBudgetTotal(response.data.total);
    } catch (err) {
      console.error("Failed to delete expense", err);
    }
  }

  async function handleGetSuggestions(category: string = "") {
    setAiLoading(true);
    try {
      const response = await api.post(`/trips/${tripId}/suggest`, { category });
      const parsed = JSON.parse(response.data.suggestions.replace(/```json\n?|```/g, ""));
      setSuggestions(parsed);
    } catch (err) {
      console.error("Failed to get suggestions", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAddSuggestion(suggestion: Suggestion) {
    try {
      const response = await api.post(`/trips/${tripId}/activities`, {
        name: suggestion.name,
        description: suggestion.description,
        location: suggestion.location,
        category: suggestion.category,
      });
      setActivities([...activities, response.data]);
      setSuggestions(suggestions.filter((s) => s.name !== suggestion.name));
    } catch (err) {
      console.error("Failed to add suggestion", err);
    }
  }

  async function handleGetSummary() {
    setAiLoading(true);
    try {
      const response = await api.get(`/trips/${tripId}/summary`);
      setSummary(response.data.summary);
    } catch (err) {
      console.error("Failed to get summary", err);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#6B7280] text-lg">Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Trip not found</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: heroImage
            ? `url(${heroImage})`
            : "linear-gradient(135deg, #2563EB, #7C3AED)",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-6 w-full">
            <h1 className="text-4xl font-bold text-white">{trip.name}</h1>
            <p className="text-white/80">{trip.destination} · {trip.start_date} → {trip.end_date}</p>
          </div>
        </div>
        <div className="absolute top-4 right-6 flex gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
          >
            ← Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors text-sm cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-[#6B7280]">
            <p>
              Invite code: <span className="text-[#2563EB] font-mono">{trip.invite_code}</span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${trip.invite_code}`);
                alert("Invite link copied!");
              }}
              className="mt-1 text-xs text-[#2563EB] hover:underline cursor-pointer"
            >
              Copy Invite Link
            </button>
          </div>
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to delete this trip?")) {
                try {
                  await api.delete(`/trips/${tripId}`);
                  router.push("/dashboard");
                } catch (err) {
                  console.error("Failed to delete trip", err);
                }
              }
            }}
            className="text-sm text-red-500 hover:text-red-400 cursor-pointer"
          >
            Delete Trip
          </button>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Members</h2>
          <div className="flex gap-3">
            {trip.members.map((member) => (
              <div key={member.id} className="bg-white rounded-lg px-4 py-2 shadow-sm border border-[#E5E7EB]">
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="text-[#6B7280] text-xs">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Activities</h2>
          <form onSubmit={handleAddActivity} className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              placeholder="Activity name"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 min-w-[150px] px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">Category</option>
              <option value="food">Food</option>
              <option value="sightseeing">Sightseeing</option>
              <option value="nightlife">Nightlife</option>
              <option value="shopping">Shopping</option>
              <option value="adventure">Adventure</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>

          {activities.length === 0 ? (
            <p className="text-[#6B7280]">No activities yet. Add one or get AI suggestions!</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB]">
                  <div>
                    <p className="font-semibold">{activity.name}</p>
                    <p className="text-[#6B7280] text-sm">
                      {activity.location}{activity.date ? ` · ${activity.date}` : ""}{activity.category ? ` · ${activity.category}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleVote(activity.id, 1)} className="text-[#2563EB] hover:opacity-80 cursor-pointer">👍</button>
                    <span className="text-sm font-semibold">{activity.votes}</span>
                    <button onClick={() => handleVote(activity.id, -1)} className="text-red-500 hover:opacity-80 cursor-pointer">👎</button>
                    <button onClick={() => handleDeleteActivity(activity.id)} className="text-[#6B7280] hover:text-red-500 transition-colors cursor-pointer text-sm">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Budget</h2>
          <form onSubmit={handleAddExpense} className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Expense name"
              value={newExpense}
              onChange={(e) => setNewExpense(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-32 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-[#E5E7EB]">
            <p className="text-xl font-bold text-[#2563EB]">Total: ${budgetTotal.toFixed(2)}</p>
          </div>

          {budgetItems.length === 0 ? (
            <p className="text-[#6B7280]">No expenses yet.</p>
          ) : (
            <div className="space-y-2">
              {budgetItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm border border-[#E5E7EB]">
                  <p>{item.name}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[#2563EB] font-semibold">${item.amount.toFixed(2)}</p>
                    <button onClick={() => handleDeleteExpense(item.id)} className="text-[#6B7280] hover:text-red-500 transition-colors cursor-pointer text-sm">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">AI Assistant</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={() => handleGetSuggestions()} disabled={aiLoading} className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-50">
              {aiLoading ? "Thinking..." : "Suggest Activities"}
            </button>
            <button onClick={() => handleGetSuggestions("food")} disabled={aiLoading} className="px-4 py-2 bg-white text-[#1F2937] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50">
              Food Ideas
            </button>
            <button onClick={() => handleGetSuggestions("sightseeing")} disabled={aiLoading} className="px-4 py-2 bg-white text-[#1F2937] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50">
              Sightseeing
            </button>
            <button onClick={() => handleGetSuggestions("nightlife")} disabled={aiLoading} className="px-4 py-2 bg-white text-[#1F2937] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50">
              Nightlife
            </button>
            <button onClick={handleGetSummary} disabled={aiLoading} className="px-4 py-2 bg-white text-[#1F2937] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50">
              Trip Summary
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-3 mb-4">
              <h3 className="font-bold">Suggestions</h3>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB]">
                  <div>
                    <p className="font-semibold">{suggestion.name}</p>
                    <p className="text-[#6B7280] text-sm">{suggestion.description}</p>
                    <p className="text-[#6B7280] text-xs mt-1">{suggestion.location} · {suggestion.category}</p>
                  </div>
                  <button onClick={() => handleAddSuggestion(suggestion)} className="px-4 py-2 bg-[#2563EB] text-white text-sm rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer">
                    Add to Trip
                  </button>
                </div>
              ))}
            </div>
          )}

          {summary && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB]">
              <h3 className="font-bold mb-3">Trip Summary</h3>
              <div className="text-sm text-[#6B7280] prose prose-sm max-w-none">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}