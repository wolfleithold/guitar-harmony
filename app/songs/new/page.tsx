'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSong() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    lyrics: '',
    key: '',
    guitar: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/songs/${data.id}`);
      } else {
        console.error('Failed to create song');
        alert('Failed to create song');
      }
    } catch (error) {
      console.error('Error creating song:', error);
      alert('Error creating song');
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
            <label
              htmlFor="guitar"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Guitar
            </label>
            <input
              type="text"
              id="guitar"
              value={formData.guitar}
              onChange={(e) =>
                setFormData({ ...formData, guitar: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Acoustic, Electric, Standard Tuning"
            />
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
              {saving ? 'Creating...' : 'Create Song'}
            </button>
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
