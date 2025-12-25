"use client";

import { useEffect, useState } from "react";
import { Guitar, GuitarType } from "@/types";
import Link from "next/link";

export default function GuitarsPage() {
  const [guitars, setGuitars] = useState<Guitar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGuitar, setEditingGuitar] = useState<Guitar | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Acoustic" as GuitarType,
    notes: "",
    image_url: "",
  });

  useEffect(() => {
    fetchGuitars();
  }, []);

  const fetchGuitars = async (query = searchQuery) => {
    setLoading(true);
    try {
      const url = query
        ? `/api/guitars?search=${encodeURIComponent(query)}`
        : "/api/guitars";
      const response = await fetch(url);
      const data = await response.json();
      setGuitars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching guitars:", error);
      setGuitars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuitars(searchQuery);
  };

  const openAddModal = () => {
    setEditingGuitar(null);
    setFormData({
      name: "",
      type: "Acoustic",
      notes: "",
      image_url: "",
    });
    setShowModal(true);
  };

  const openEditModal = (guitar: Guitar) => {
    setEditingGuitar(guitar);
    setFormData({
      name: guitar.name,
      type: guitar.type,
      notes: guitar.notes || "",
      image_url: guitar.image_url || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Guitar name is required");
      return;
    }

    try {
      const url = editingGuitar
        ? `/api/guitars/${editingGuitar.id}`
        : "/api/guitars";
      const method = editingGuitar ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        fetchGuitars();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save guitar");
      }
    } catch (error) {
      console.error("Error saving guitar:", error);
      alert("Error saving guitar");
    }
  };

  const handleDelete = async (guitar: Guitar) => {
    if (
      !confirm(
        `Are you sure you want to delete "${guitar.name}"?\n\nNote: If this guitar is used by any songs, those songs will still reference it.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/guitars/${guitar.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchGuitars();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete guitar");
      }
    } catch (error) {
      console.error("Error deleting guitar:", error);
      alert("Error deleting guitar");
    }
  };

  const getTypeColor = (type: GuitarType) => {
    switch (type) {
      case "Acoustic":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700";
      case "Electric":
        return "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700";
      case "Bass":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700";
      case "Other":
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← Back
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Guitar Catalog
            </h1>
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
          >
            + Add Guitar
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guitars by name, type, or notes..."
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
                  fetchGuitars("");
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            Loading guitars...
          </div>
        ) : guitars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? "No guitars found matching your search."
                : "No guitars yet. Add your first guitar!"}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
              >
                + Add Guitar
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {guitars.map((guitar) => (
              <div
                key={guitar.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {guitar.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getTypeColor(
                      guitar.type
                    )}`}
                  >
                    {guitar.type}
                  </span>
                </div>

                {guitar.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {guitar.notes}
                  </p>
                )}

                {guitar.image_url && (
                  <div className="mb-3 h-32 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                    <img
                      src={guitar.image_url}
                      alt={guitar.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(guitar)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(guitar)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1.5 px-3 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editingGuitar ? "Edit Guitar" : "Add New Guitar"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Martin D-28"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as GuitarType,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="Acoustic">Acoustic</option>
                  <option value="Electric">Electric</option>
                  <option value="Bass">Bass</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Tuned to Drop D, needs new strings"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {editingGuitar ? "Save Changes" : "Add Guitar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
