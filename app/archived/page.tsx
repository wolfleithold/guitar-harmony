"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Song } from "@/types";

export default function ArchivedPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  const getReadinessColor = () => "bg-gray-500";

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
    fetchArchivedSongs();
  }, []);

  const fetchArchivedSongs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/songs?readiness=Archived");
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error("Error fetching archived songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ id: song.id!, title: song.title });
    setConfirmInput("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    if (confirmInput !== deleteConfirm.title) {
      alert("Song name does not match. Delete cancelled.");
      return;
    }

    try {
      await fetch(`/api/songs/${deleteConfirm.id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      setConfirmInput("");
      fetchArchivedSongs();
    } catch (error) {
      console.error("Error deleting song:", error);
      alert("Failed to delete song");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Songs
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Archived Songs
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            Loading archived songs...
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No archived songs yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <div
                key={song.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200 dark:border-gray-700 relative"
              >
                {/* Status Circle in top-right corner */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-8 h-8 rounded-full ${getReadinessColor()} border-2 border-white dark:border-gray-800 shadow-md`}
                    title="Archived"
                  />
                </div>

                <Link href={`/songs/${song.id}`} className="block pr-10">
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
                </Link>

                <button
                  onClick={(e) => handleDeleteClick(song, e)}
                  className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To delete this song, please type its name exactly:
            </p>
            <p className="font-semibold text-gray-900 dark:text-white mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              {deleteConfirm.title}
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type song name here"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={confirmInput !== deleteConfirm.title}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Delete Permanently
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setConfirmInput("");
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
