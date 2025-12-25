'use client';

import { useEffect, useState, use } from 'react';
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

interface FileRecord {
  id: number;
  song_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function SongDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    lyrics: '',
    key: '',
    guitar: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    fetchSong();
    fetchFiles();
  }, [resolvedParams.id]);

  const fetchSong = async () => {
    try {
      const response = await fetch(`/api/songs/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setSong(data);
        setFormData({
          title: data.title,
          lyrics: data.lyrics || '',
          key: data.key || '',
          guitar: data.guitar || '',
        });
      } else {
        console.error('Failed to fetch song');
      }
    } catch (error) {
      console.error('Error fetching song:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/songs/${resolvedParams.id}/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/songs/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSong(data);
        setIsEditing(false);
      } else {
        console.error('Failed to update song');
        alert('Failed to update song');
      }
    } catch (error) {
      console.error('Error updating song:', error);
      alert('Error updating song');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.zip', '.mp3', '.wav'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExt)) {
      alert('Invalid file type. Only .zip (Logic Pro), .mp3, and .wav files are allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/songs/${resolvedParams.id}/files`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadProgress('Upload complete!');
        fetchFiles();
        // Clear the input
        e.target.value = '';
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFiles();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!song) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

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

        {isEditing ? (
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
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    title: song.title,
                    lyrics: song.lyrics || '',
                    key: song.key || '',
                    guitar: song.guitar || '',
                  });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {song.title}
              </h1>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
              >
                Edit
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-4">
              {song.key && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Key
                  </h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{song.key}</p>
                </div>
              )}

              {song.guitar && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Guitar
                  </h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{song.guitar}</p>
                </div>
              )}

              {song.lyrics && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Lyrics
                  </h3>
                  <pre className="whitespace-pre-wrap text-gray-900 dark:text-white font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded">
                    {song.lyrics}
                  </pre>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p>Created: {new Date(song.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(song.updated_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Files Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Attached Files
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File
                </label>
                <input
                  type="file"
                  accept=".zip,.mp3,.wav"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Accepted formats: .zip (Logic Pro projects), .mp3, .wav
                </p>
                {uploadProgress && (
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    {uploadProgress}
                  </p>
                )}
              </div>

              {files.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No files attached yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {file.original_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {file.file_type === 'logic' ? 'Logic Pro Project' : 'Audio File'} •{' '}
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {file.file_type === 'audio' && (
                          <audio
                            controls
                            className="h-10"
                            src={`/api/files/${file.id}`}
                          />
                        )}
                        <a
                          href={`/api/files/${file.id}`}
                          download={file.original_name}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                        >
                          {file.file_type === 'logic'
                            ? 'Download & Open in Logic Pro'
                            : 'Download'}
                        </a>
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
