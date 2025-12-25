"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Song, Readiness } from "@/types";

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<Readiness | "">("");
  const [sortBy, setSortBy] = useState<
    "updated" | "played-recent" | "played-oldest"
  >("updated");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getReadinessColor = (readiness?: Readiness) => {
    switch (readiness) {
      case "Idea":
        return "bg-purple-500";
      case "Writing":
        return "bg-blue-500";
      case "Practice":
        return "bg-yellow-500";
      case "GigReady":
        return "bg-green-500";
      case "Archived":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  useEffect(() => {
    fetchSongs();
  }, [readinessFilter, sortBy]);

  const fetchSongs = async (query = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (readinessFilter) params.append("readiness", readinessFilter);
      if (sortBy) params.append("sort", sortBy);
      params.append("excludeArchived", "true");

      const url = `/api/songs${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSongs(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Guitar Harmony
            </h1>
            <Link
              href="/archived"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium"
            >
              Archived Songs
            </Link>
          </div>
          <Link
            href="/songs/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
          >
            Create Song
          </Link>
        </div>

        {/* Status Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Song Status Legend
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Idea
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Writing
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Practice
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Gig Ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Archived
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs by title, lyrics, key, or guitar..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchSongs("");
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Filter by Status
              </label>
              <select
                value={readinessFilter}
                onChange={(e) =>
                  setReadinessFilter(e.target.value as Readiness | "")
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="Idea">Idea</option>
                <option value="Writing">Writing</option>
                <option value="Practice">Practice</option>
                <option value="GigReady">Gig Ready</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "updated"
                      | "played-recent"
                      | "played-oldest"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="updated">Recently Updated</option>
                <option value="played-recent">Recently Played</option>
                <option value="played-oldest">Least Recently Played</option>
              </select>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            Loading songs...
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? "No songs found matching your search."
                : "No songs yet. Create your first song!"}
            </p>
            {!searchQuery && (
              <Link
                href="/songs/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
              >
                Create Song
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200 dark:border-gray-700 relative"
              >
                {/* Status Circle in top-right corner */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-8 h-8 rounded-full ${getReadinessColor(
                      song.readiness
                    )} border-2 border-white dark:border-gray-800 shadow-md`}
                    title={song.readiness || "Writing"}
                  />
                </div>

                <div className="pr-10">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate mb-3">
                    {song.title}
                  </h2>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {song.key && (
                      <p>
                        <span className="font-medium">Key:</span> {song.key}
                      </p>
                    )}
                    {song.guitar && (
                      <p>
                        <span className="font-medium">Guitar:</span>{" "}
                        {song.guitar}
                      </p>
                    )}
                    {song.lyrics && (
                      <p className="line-clamp-3">
                        {song.lyrics.substring(0, 100)}
                        {song.lyrics.length > 100 ? "..." : ""}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-xs text-gray-500 dark:text-gray-500">
                    <p>
                      Last played: {formatRelativeTime(song.last_played_at)}
                    </p>
                    <p>
                      Updated: {new Date(song.updated_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
