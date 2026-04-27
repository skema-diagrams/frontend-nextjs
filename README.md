# Skema.io - Visual Diagram & ERD Generator

A modern, feature-rich web application for creating and editing diagrams and Entity-Relationship Diagrams (ERD) with an intuitive visual interface. Built with Next.js, React Flow, and TypeScript.

## Features

### 🎨 Draw Module

- **Interactive Drawing Canvas** - Create custom diagrams with an intuitive drag-and-drop interface
- **Draw.io Integration** - Seamless integration with Draw.io editor for professional diagram creation
- **Real-time Editing** - Live updates as you create and modify diagrams
- **Export Capabilities** - Export diagrams in multiple formats

### 📊 ERD (Entity-Relationship Diagram) Module

- **Visual ERD Designer** - Create database schemas visually with crow's foot notation
- **DSL Support** - Define entities and relationships using a custom Domain-Specific Language (DSL)
- **Auto-Layout** - Automatic graph layout using ELK.js for optimal diagram arrangement
- **Syntax Highlighting** - Built-in syntax help and validation for DSL definitions
- **Theme Support** - Light and dark theme options for comfortable viewing

### 🎯 Core Capabilities

- **Responsive Design** - Works seamlessly on desktop and tablet devices
- **Dark/Light Theme Toggle** - Switch between themes with persistent preferences
- **Real-time Rendering** - Instant visual feedback for all changes
- **Export to Image** - Convert diagrams to PNG/JPG using html-to-image

## Tech Stack

- **Framework**: [Next.js 16.2.2](https://nextjs.org) - React framework with App Router
- **UI Library**: [React 19.2.4](https://react.dev) - Modern React with concurrent features
- **Diagram Rendering**: [React Flow 11.11.4](https://reactflow.dev) - Interactive node-based UI library
- **Graph Layout**: [ELK.js 0.11.1](https://www.eclipse.org/elk/) - Automatic graph layout engine
- **State Management**: [Zustand 5.0.12](https://github.com/pmndrs/zustand) - Lightweight state management
- **Data Fetching**: [TanStack Query 5.97.0](https://tanstack.com/query) - Server state management
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) - Utility-first CSS framework
- **Language**: [TypeScript 5](https://www.typescriptlang.org) - Type-safe JavaScript
- **Image Export**: [html-to-image 1.11.11](https://github.com/bubkoo/html-to-image) - DOM to image conversion

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── draw/                     # Draw module
│   │   ├── page.jsx             # Draw page entry point
│   │   └── DrawClient.tsx        # Draw client component
│   ├── erd/                      # ERD module
│   │   └── page.tsx             # ERD page entry point
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # Reusable React components
│   ├── draw/                    # Draw module components
│   │   └── DrawIOEditor.tsx     # Draw.io editor wrapper
│   └── erd/                     # ERD module components
│       ├── ERDCanvas.tsx        # Main ERD canvas
│       ├── TableNode.tsx        # Entity/table node component
│       ├── TitleNode.tsx        # Title node component
│       ├── CrowFootEdge.tsx     # Crow's foot relationship edge
│       ├── DSLPanel.tsx         # DSL input panel
│       ├── SyntaxHelpModal.tsx  # Syntax help modal
│       ├── ThemeToggle.tsx      # Theme switcher
│       ├── flowConfig.ts        # React Flow configuration
│       └── theme.ts             # Theme definitions
├── lib/                         # Utility libraries
│   └── erd/                     # ERD-specific utilities
│       ├── lexer.ts             # DSL lexer
│       ├── parser.ts            # DSL parser
│       ├── layout.ts            # Graph layout logic
│       ├── theme.ts             # Theme utilities
│       ├── types.ts             # Type definitions
│       └── sample.dsl.ts        # Sample DSL templates
├── providers/                   # React context providers
│   └── ThemeProvider.tsx        # Theme context provider
├── utils/                       # Utility functions
│   └── themeUtils.ts            # Theme utility functions
└── types/                       # TypeScript type definitions
    └── theme-types.ts           # Theme type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd 04-diagram.io
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The app will auto-reload as you edit files. Start by modifying [`src/app/page.tsx`](src/app/page.tsx).

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Usage

### Draw Module

Navigate to `/draw` to access the drawing canvas. Use the Draw.io editor to create custom diagrams with full drawing capabilities.

### ERD Module

Navigate to `/erd` to create Entity-Relationship Diagrams:

1. **Define Entities**: Use the DSL panel to define your database schema
2. **View Diagram**: The canvas automatically renders your entities and relationships
3. **Customize**: Adjust layout, colors, and styling using the theme toggle
4. **Export**: Export your diagram as an image

#### ERD DSL Syntax

Define entities and relationships using the custom DSL:

```
entity User {
  id: INT [PK]
  name: VARCHAR(255)
  email: VARCHAR(255) [UNIQUE]
}

entity Post {
  id: INT [PK]
  title: VARCHAR(255)
  user_id: INT [FK]
}

relationship User 1--* Post
```

## Key Components

### [`DrawIOEditor.tsx`](src/components/draw/DrawIOEditor.tsx)

Wrapper component for integrating Draw.io editor into the application.

### [`ERDCanvas.tsx`](src/components/erd/ERDCanvas.tsx)

Main canvas component for rendering ERD diagrams using React Flow.

### [`DSLPanel.tsx`](src/components/erd/DSLPanel.tsx)

Input panel for writing and validating ERD DSL definitions.

### [`ThemeProvider.tsx`](src/providers/ThemeProvider.tsx)

Context provider for managing application-wide theme state.

## Theme System

The application supports light and dark themes with persistent user preferences:

- **Light Theme**: Clean, bright interface optimized for daytime use
- **Dark Theme**: Eye-friendly dark interface for reduced eye strain

Toggle themes using the theme switcher in the UI or programmatically via the ThemeProvider context.

## Performance Optimizations

- **React Flow**: Efficient rendering of large diagrams with virtualization
- **ELK.js**: Fast automatic layout calculation for complex graphs
- **Zustand**: Minimal re-renders with fine-grained state management
- **TanStack Query**: Smart caching and background synchronization
- **Tailwind CSS**: Optimized CSS with tree-shaking and purging

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [React Flow Documentation](https://reactflow.dev) - Interactive node-based UI library
- [ELK.js Documentation](https://www.eclipse.org/elk/) - Graph layout engine
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Type-safe JavaScript

## Support

For issues, questions, or suggestions, please open an issue in the repository.
