'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Song {
  id: number;
  title: string;
  lyrics?: string;
  key?: string;
  guitar?: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/songs?q=${encodeURIComponent(query)}`
        : '/api/songs';
      const response = await fetch(url);
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSongs(searchQuery);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this song? This will also delete all attached files.')) {
      try {
        await fetch(`/api/songs/${id}`, { method: 'DELETE' });
        fetchSongs(searchQuery);
      } catch (error) {
        console.error('Error deleting song:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Guitar Harmony
          </h1>
          <Link
            href="/songs/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
          >
            Create Song
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
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
                  setSearchQuery('');
                  fetchSongs('');
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
            Loading songs...
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'No songs found matching your search.' : 'No songs yet. Create your first song!'}
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
                className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate flex-1">
                    {song.title}
                  </h2>
                  <button
                    onClick={(e) => handleDelete(song.id, e)}
                    className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {song.key && (
                    <p>
                      <span className="font-medium">Key:</span> {song.key}
                    </p>
                  )}
                  {song.guitar && (
                    <p>
                      <span className="font-medium">Guitar:</span> {song.guitar}
                    </p>
                  )}
                  {song.lyrics && (
                    <p className="line-clamp-3">
                      {song.lyrics.substring(0, 100)}
                      {song.lyrics.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                  Updated: {new Date(song.updated_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
