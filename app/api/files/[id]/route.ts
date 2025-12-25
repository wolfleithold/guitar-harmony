import { NextRequest, NextResponse } from 'next/server';
import { getFile, deleteFile } from '@/lib/db';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);
    const file = getFile(fileId);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(file.file_path);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (file.file_type === 'logic' || file.original_name.endsWith('.zip')) {
      contentType = 'application/zip';
    } else if (file.original_name.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (file.original_name.endsWith('.wav')) {
      contentType = 'audio/wav';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.original_name}"`,
        'Content-Length': file.file_size.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);
    deleteFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
