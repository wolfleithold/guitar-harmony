# Guitar Harmony

A local-first web application for managing your music writing projects. Built with Next.js, SQLite, and Tailwind CSS.

## Features

- **Song Management**: Create, edit, and organize your songs with title, lyrics, key, and guitar information
- **Search**: Full-text search across all song fields (title, lyrics, key, guitar)
- **File Attachments**: 
  - Upload Logic Pro projects as .zip files
  - Upload audio demos (.mp3, .wav) with in-browser playback
  - Download files with one click
- **Local Storage**: All data stored locally in SQLite database and /uploads folder
- **Responsive UI**: Clean, modern interface with dark mode support

## Tech Stack

- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **File Storage**: Local filesystem (/uploads directory)
- **API**: Next.js API routes

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/wolfleithold/guitar-harmony.git
cd guitar-harmony
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Usage

### Creating a Song

1. Click the "Create Song" button on the home page
2. Fill in the song details:
   - **Title** (required): Name of your song
   - **Key**: Musical key (e.g., C Major, Am, G)
   - **Guitar**: Guitar type/tuning info (e.g., Acoustic, Standard Tuning)
   - **Lyrics**: Song lyrics or notes
3. Click "Create Song" to save

### Editing a Song

1. Click on a song from the list to view details
2. Click the "Edit" button
3. Update the fields as needed
4. Click "Save Changes"

### Attaching Files

On a song's detail page:

1. **Logic Pro Projects**: 
   - Compress your .logicx file as a .zip first
   - Click "Choose File" and select the .zip
   - The file will upload automatically
   - Use "Download & Open in Logic Pro" to download

2. **Audio Files**:
   - Upload .mp3 or .wav files directly
   - Audio files will have a built-in player for preview
   - Click "Download" to save the file

### Searching Songs

1. Enter search terms in the search bar (searches title, lyrics, key, and guitar fields)
2. Click "Search"
3. Click "Clear" to show all songs again

### Deleting

- **Songs**: Click the "Delete" button on a song card (this also deletes all attached files)
- **Files**: Click the "Delete" button next to a file in the song detail page

## File Structure

```
guitar-harmony/
├── app/
│   ├── api/              # API routes
│   │   ├── songs/        # Song CRUD endpoints
│   │   └── files/        # File download endpoints
│   ├── songs/            # Song pages
│   │   ├── [id]/         # Song detail/edit page
│   │   └── new/          # Create song page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (song list)
├── lib/
│   └── db.ts             # Database utilities and schema
├── uploads/              # Uploaded files (gitignored)
├── guitar-harmony.db     # SQLite database (gitignored)
└── package.json
```

## Database Schema

### Songs Table
- `id`: Primary key
- `title`: Song title
- `lyrics`: Song lyrics
- `key`: Musical key
- `guitar`: Guitar information
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Files Table
- `id`: Primary key
- `song_id`: Foreign key to songs
- `filename`: Unique filename on disk
- `original_name`: Original upload filename
- `file_type`: 'logic' or 'audio'
- `file_path`: Full path to file
- `file_size`: File size in bytes
- `created_at`: Timestamp

## Windows Compatibility

This application runs on Windows. Make sure you have:
- Node.js installed from [nodejs.org](https://nodejs.org/)
- A terminal (Command Prompt, PowerShell, or Git Bash)

The SQLite database and file storage work natively on Windows.

## Development

### Adding New Features

- API routes are in `app/api/`
- Database functions are in `lib/db.ts`
- UI components are in `app/` directory

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Data Persistence

All data is stored locally:
- **Database**: `guitar-harmony.db` (SQLite)
- **Files**: `uploads/` directory

These files are gitignored to prevent committing user data.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
