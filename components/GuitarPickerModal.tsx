"use client";

import { useState, useEffect } from "react";
import { Guitar } from "@/types";

interface GuitarPickerModalProps {
  isOpen: boolean;
  selectedGuitarId?: number | null;
  onSelect: (guitar: Guitar | null) => void;
  onClose: () => void;
}

export default function GuitarPickerModal({
  isOpen,
  selectedGuitarId,
  onSelect,
  onClose,
}: GuitarPickerModalProps) {
  const [guitars, setGuitars] = useState<Guitar[]>([]);
  const [filteredGuitars, setFilteredGuitars] = useState<Guitar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGuitars();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredGuitars(
        guitars.filter(
          (g) =>
            g.name.toLowerCase().includes(query) ||
            g.type.toLowerCase().includes(query) ||
            (g.notes && g.notes.toLowerCase().includes(query))
        )
      );
    } else {
      setFilteredGuitars(guitars);
    }
  }, [searchQuery, guitars]);

  const fetchGuitars = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/guitars");
      const data = await response.json();
      setGuitars(data);
      setFilteredGuitars(data);
    } catch (error) {
      console.error("Error fetching guitars:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (guitar: Guitar) => {
    onSelect(guitar);
    onClose();
  };

  const handleClear = () => {
    onSelect(null);
    onClose();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Acoustic":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "Electric":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "Bass":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Choose a Guitar
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guitars by name, type, or notes..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        {/* Guitar Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              Loading guitars...
            </div>
          ) : filteredGuitars.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              No guitars found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredGuitars.map((guitar) => (
                <button
                  key={guitar.id}
                  onClick={() => handleSelect(guitar)}
                  className={`p-4 border-2 rounded-lg text-left transition hover:shadow-lg ${
                    selectedGuitarId === guitar.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  {guitar.image_url && (
                    <img
                      src={guitar.image_url}
                      alt={guitar.name}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {guitar.name}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                      guitar.type
                    )}`}
                  >
                    {guitar.type}
                  </span>
                  {guitar.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {guitar.notes}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={handleClear}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Clear Selection
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
