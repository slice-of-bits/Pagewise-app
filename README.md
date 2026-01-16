# Pagewise Frontend Application

This is the frontend application for the Pagewise document management system built with SvelteKit.

## Know problems
https://www.npmjs.com/package/marked#usage

## Features

- **Document Management**: Upload, view, and organize PDF documents
- **Bucket Organization**: Group documents into buckets for better organization  
- **Page-Level Search**: Search within documents at the page level
- **OCR Text Editing**: Edit extracted OCR text for better accuracy
- **Progress Tracking**: Real-time progress monitoring for document processing
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **SvelteKit**: Frontend framework with Svelte 5
- **TailwindCSS v4**: Utility-first CSS framework
- **TanStack Query**: Data fetching and state management
- **Lucide Icons**: Beautiful icon set
- **TypeScript**: Type safety and better development experience

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Pagewise Core backend running on `http://127.0.0.1:8000`

## Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your API URL and file size limits:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:8000
   
   # File Upload Configuration (in MB)
   VITE_MAX_FILE_SIZE_MB=1024
   
   # Development Configuration
   VITE_DEV_MODE=true
   ```

4. Generate the API client from the backend:
   ```bash
   pnpm run generate-api
   ```

5. Start the development server:
   ```bash
   pnpm run dev
   ```

6. Open your browser to `http://localhost:5173`

## API Integration

The frontend uses auto-generated API client from the backend OpenAPI specification. The API client is generated using `@hey-api/openapi-ts` and provides type-safe functions for all backend endpoints.

### Key API Functions Used:

- `bucketApiListBuckets()` - List all buckets
- `bucketApiCreateBucket()` - Create a new bucket
- `documentsApiListDocuments()` - List all documents
- `documentsApiUploadDocument()` - Upload a new document
- `documentsApiSearchPages()` - Search within document pages

## Project Structure

```
src/
├── lib/
│   ├── api/                 # Auto-generated API client
│   │   ├── sdk.gen.ts      # Generated SDK functions
│   │   └── types.gen.ts    # Generated TypeScript types
│   └── components/         # Reusable Svelte components
│       ├── Header.svelte   # Main navigation header
│       ├── DocumentCard.svelte
│       ├── SearchFilters.svelte
│       └── ...
├── routes/                 # SvelteKit routes
│   ├── +layout.svelte     # Root layout with TanStack Query
│   ├── +page.svelte       # Home page - documents by bucket
│   ├── buckets/           # Bucket management
│   ├── documents/         # Document management  
│   ├── search/            # Search functionality
│   └── upload/            # Document upload
└── app.html               # HTML template
```

## Key Pages

- **Home (`/`)**: Dashboard showing documents grouped by buckets
- **Buckets (`/buckets`)**: Manage document buckets (CRUD operations)
- **Documents (`/documents`)**: List and manage all documents
- **Search (`/search`)**: Search across documents and pages
- **Upload (`/upload`)**: Upload new documents with bucket assignment
- **Document Detail (`/documents/[id]`)**: View document pages with OCR editing

## Features Overview

### Document Upload
- Drag & drop PDF upload
- Configurable file size limits (default: 1GB)
- Automatic title generation from filename
- Bucket assignment during upload
- File size validation with user feedback
- Progress tracking during processing

### Search Functionality  
- Global search across all documents
- Document-specific search
- Search filters by bucket and document
- Page-level search results with highlighting

### Bucket Management
- Create, edit, delete buckets
- Organize documents by topic/project
- Bucket-specific document views

### Document Management
- View document thumbnails and metadata
- Edit OCR-extracted text
- Download original files
- Processing status tracking

## Development

### Code Style
- TypeScript strict mode enabled
- Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- TanStack Query for server state management
- Tailwind for styling

### API Client Generation
The API client is automatically generated from the backend's OpenAPI specification:

```bash
# Regenerate API client when backend changes
pnpm run generate-api
```

### Type Safety
The application uses generated TypeScript types from the backend API, ensuring type safety across the entire data flow.

## Backend Integration

This frontend is designed to work with the Pagewise Core backend. Configure the backend URL in your `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

**Important**: All API calls now use the full backend URL from the environment variable. This ensures proper routing during development when the frontend and backend run on different ports.

For different environments:
- **Development**: `http://localhost:8000` (backend) + `http://localhost:5173` (frontend)
- **Production**: `https://your-api-domain.com`
- **Docker**: `http://pagewise-backend:8000`

The backend provides:
- Document storage and processing
- OCR text extraction using Docling
- Page-level search functionality  
- Progress tracking for async tasks
- RESTful API with OpenAPI documentation
- File upload handling up to 1GB+ files

### API Routing

The application uses generated SDK functions that automatically route to the correct backend URL:
- ✅ All search operations: `${API_BASE_URL}/api/search/`
- ✅ Document operations: `${API_BASE_URL}/api/documents/`  
- ✅ File uploads: `${API_BASE_URL}/api/documents/upload/`
- ✅ Page operations: `${API_BASE_URL}/api/pages/`
- ✅ Bucket operations: `${API_BASE_URL}/api/buckets/`
- ✅ File downloads: `${API_BASE_URL}/api/documents/{id}/download`

## Deployment

For production deployment:

1. Build the application:
   ```bash
   pnpm run build
   ```

2. Preview the production build:
   ```bash
   pnpm run preview
   ```

3. Deploy the `build/` directory to your hosting provider

## Configuration

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_MAX_FILE_SIZE_MB` | Maximum file upload size in MB | `1024` (1GB) |
| `VITE_DEV_MODE` | Development mode flag | `true` |

### API Client Generation

The API client is automatically generated from the backend's OpenAPI specification:

```bash
# Regenerate API client when backend changes
pnpm run generate-api
```

The `generate-api` command uses the `VITE_API_URL` environment variable to fetch the OpenAPI specification.

## Backend Integration

### Common Issues

1. **API Client Errors**: Regenerate the API client if the backend schema changes
2. **CORS Issues**: Ensure the backend allows requests from the frontend origin
3. **TypeScript Errors**: Check that all dependencies are properly installed

### Development Server Issues

If the dev server doesn't start:
1. Clear node_modules and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
2. Check that ports 5173 and 4173 are available
3. Try using npm instead of pnpm if issues persist

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Test functionality with the backend running
4. Update this README if adding new features

## License

This project is part of the Pagewise document management system.
