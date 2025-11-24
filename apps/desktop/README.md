# @my-ai/desktop

Desktop application for My AI platform, built with Electron and Next.js using Nextron.

## Overview

This is the desktop version of the My AI platform that provides a native application experience for managing AI agents. It wraps the Next.js frontend in an Electron shell, offering features like:

- Native desktop application with system integration
- Offline capabilities (planned)
- System tray support (planned)
- Auto-updates (planned)
- Better performance for local operations

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Run in development mode
cd apps/desktop
pnpm dev

# Or from repo root
pnpm --filter @my-ai/desktop dev
```

The development server will start with hot-reload enabled for both the Electron main process and Next.js renderer.

## Building

```bash
# Build for production
pnpm build

# The packaged app will be in the dist folder
```

## Project Structure

```
apps/desktop/
├── main/                  # Electron main process
│   ├── background.ts      # Main entry point
│   ├── preload.ts         # Preload script (IPC bridge)
│   └── helpers/           # Helper utilities
├── renderer/              # Next.js renderer (React app)
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utility functions and auth
│   └── types/             # TypeScript type definitions
└── resources/             # App icons and assets
```

## Security

This application follows Electron security best practices:

- **Context Isolation**: Enabled to separate Electron and web content contexts
- **Node Integration**: Disabled in renderer to prevent XSS attacks
- **Sandbox**: Enabled for renderer processes
- **Preload Scripts**: Secure IPC bridge using `contextBridge`
- **Content Security Policy**: Applied for additional protection

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="your-postgres-url"

# NextAuth.js
AUTH_SECRET="your-auth-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
AUTH_URL="http://localhost:3000"  # For Electron, may need custom scheme
```

## OAuth in Electron

Authentication with OAuth providers like Google requires special handling in Electron:

1. You may need to register a custom URL scheme for OAuth callbacks
2. Consider using deep linking or a local server approach
3. Test the OAuth flow thoroughly in both development and production

## Packaging

The app uses `electron-builder` for packaging. Configuration is in `electron-builder.yml`.

To build for specific platforms:

```bash
# macOS
pnpm build  # Default on macOS

# Windows (from macOS, requires Wine)
pnpm build --win

# Linux
pnpm build --linux
```

## Differences from Web App

The desktop app shares most code with the web app but has some key differences:

- Static export mode (`output: 'export'` in Next.js config)
- No server-side rendering (all client-side)
- Unoptimized images (Electron doesn't need Next.js image optimization)
- Custom routing for Electron's file protocol
- IPC communication available via `window.ipc`

## Troubleshooting

### Hot-reload not working
- Make sure you're running `pnpm dev` and not `pnpm build`
- Check that both the main and renderer processes are restarting

### OAuth redirect issues
- Verify your OAuth redirect URLs include the Electron app's custom scheme
- Check that AUTH_URL is set correctly for desktop environment

### Build errors
- Run `pnpm clean` and reinstall dependencies
- Ensure you're using the correct Node.js version (22.x or higher)

## License

Private - All Rights Reserved
