
  # OncoQuery Frontend

React + Vite + Tailwind CSS + shadcn/ui component library for bio-research assistant chat interface.

## Prerequisites

- Node.js 18+
- npm or pnpm

## Setup

Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and will automatically reload when you make changes.

## Build

Create an optimized production build:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   └── components/          # Reusable components
│   │       └── ChatMessage.tsx  # Chat message display with MCP tool tracking
│   ├── styles/
│   │   └── tailwind.css         # Tailwind CSS imports
│   ├── hooks/                   # React hooks
│   └── main.tsx                 # React app entry point
├── index.html                   # HTML template
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
└── package.json                 # Dependencies and scripts
```

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Composable React components
- **TypeScript** - Type-safe JavaScript

## API Integration

The frontend communicates with the backend API (`http://localhost:8080`) via:

- `/status` - Get active MCP servers (UniProt, PDB, AlphaFold)
- `/chat` - Send messages and receive streaming responses with tool usage tracking

## Features

- Real-time chat streaming with SSE (Server-Sent Events)
- MCP tool call visualization (showing which tools are being used)
- Markdown rendering for AI responses
- Responsive design with Tailwind CSS
- Type-safe components with TypeScript
  