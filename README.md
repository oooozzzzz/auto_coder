# Excel to Word Template Generator

A Next.js application that allows users to upload Excel files, create interactive templates, and generate Word documents with custom formatting.

## Features

- 📊 Excel file upload and parsing (.xlsx, .xls)
- 🎨 Interactive template designer with drag-and-drop
- 📄 Word document generation with custom templates
- 💾 Persistent template storage using IndexedDB
- ⚡ Web Workers for performance optimization
- 🎯 TypeScript for type safety

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Excel Processing**: SheetJS (xlsx)
- **Document Generation**: docx
- **Storage**: IndexedDB via Dexie.js
- **Drag & Drop**: react-dnd

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── workers/            # Web Workers for heavy processing
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking