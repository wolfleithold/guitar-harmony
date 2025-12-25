import { NextRequest, NextResponse } from 'next/server';
import { addFile, getFilesBySongId, ensureUploadsDir } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id);
    const files = getFilesBySongId(songId);
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id);
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/zip',
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/x-wav'
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.endsWith('.zip') && 
        !file.name.endsWith('.mp3') && 
        !file.name.endsWith('.wav')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .zip, .mp3, and .wav files are allowed.' },
        { status: 400 }
      );
    }

    const uploadsDir = ensureUploadsDir();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Determine file type
    let fileType = 'audio';
    if (file.name.endsWith('.zip')) {
      fileType = 'logic';
    }

    // Add file record to database
    const fileId = addFile({
      song_id: songId,
      filename: filename,
      original_name: file.name,
      file_type: fileType,
      file_path: filePath,
      file_size: buffer.length,
    });

    return NextResponse.json({
      id: fileId,
      filename: filename,
      original_name: file.name,
      file_type: fileType,
      file_size: buffer.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
