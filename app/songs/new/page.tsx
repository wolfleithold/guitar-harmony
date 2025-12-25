"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Readiness, Guitar } from "@/types";
import GuitarPickerModal from "@/components/GuitarPickerModal";

export default function NewSong() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    lyrics: "",
    key: "",
    guitar_id: null as number | null,
    readiness: "Writing" as Readiness,
  });
  const [selectedGuitar, setSelectedGuitar] = useState<Guitar | null>(null);
  const [showGuitarPicker, setShowGuitarPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGuitarSelect = (guitar: Guitar | null) => {
    setSelectedGuitar(guitar);
    setFormData({ ...formData, guitar_id: guitar?.id || null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/songs/${data.id}`);
      } else {
        console.error("Failed to create song");
        alert("Failed to create song");
      }
    } catch (error) {
      console.error("Error creating song:", error);
      alert("Error creating song");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Songs
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Create New Song
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Enter song title"
            />
          </div>

          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Key
            </label>
            <input
              type="text"
              id="key"
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="e.g., C Major, Am, G"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Guitar
            </label>
            {selectedGuitar ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedGuitar.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedGuitar.type}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuitarPicker(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGuitarPicker(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              >
                + Choose Guitar
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Status
            </label>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, readiness: "Idea" })}
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  formData.readiness === "Idea"
                    ? "bg-purple-500 border-purple-700 scale-110"
                    : "bg-purple-300 border-purple-400 hover:scale-105"
                }`}
                title="Idea"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, readiness: "Writing" })
                }
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  formData.readiness === "Writing"
                    ? "bg-blue-500 border-blue-700 scale-110"
                    : "bg-blue-300 border-blue-400 hover:scale-105"
                }`}
                title="Writing"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, readiness: "Practice" })
                }
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  formData.readiness === "Practice"
                    ? "bg-yellow-500 border-yellow-700 scale-110"
                    : "bg-yellow-300 border-yellow-400 hover:scale-105"
                }`}
                title="Practice"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, readiness: "GigReady" })
                }
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  formData.readiness === "GigReady"
                    ? "bg-green-500 border-green-700 scale-110"
                    : "bg-green-300 border-green-400 hover:scale-105"
                }`}
                title="Gig Ready"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, readiness: "Archived" })
                }
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  formData.readiness === "Archived"
                    ? "bg-gray-500 border-gray-700 scale-110"
                    : "bg-gray-300 border-gray-400 hover:scale-105"
                }`}
                title="Archived"
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selected:{" "}
              <span className="font-semibold">{formData.readiness}</span>
            </p>
          </div>

          <div>
            <label
              htmlFor="lyrics"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Lyrics
            </label>
            <textarea
              id="lyrics"
              rows={12}
              value={formData.lyrics}
              onChange={(e) =>
                setFormData({ ...formData, lyrics: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono"
              placeholder="Enter lyrics here..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
            >
              {saving ? "Creating..." : "Create Song"}
            </button>
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>

        <GuitarPickerModal
          isOpen={showGuitarPicker}
          selectedGuitarId={formData.guitar_id}
          onSelect={handleGuitarSelect}
          onClose={() => setShowGuitarPicker(false)}
        />
      </div>
    </div>
  );
}
