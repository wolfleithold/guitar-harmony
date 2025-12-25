import { NextRequest, NextResponse } from 'next/server';
import { getAllSongs, searchSongs, createSong, Song } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    let songs: Song[];
    if (query) {
      songs = searchSongs(query);
    } else {
      songs = getAllSongs();
    }

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const song: Song = {
      title: body.title || 'Untitled',
      lyrics: body.lyrics || '',
      key: body.key || '',
      guitar: body.guitar || '',
    };

    const id = createSong(song);
    return NextResponse.json({ id, ...song }, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json(
      { error: 'Failed to create song' },
      { status: 500 }
    );
  }
}
