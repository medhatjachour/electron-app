 # SalesElectron - Professional POS Desktop Application

An Electron-based Point of Sale system built with React, TypeScript, Prisma, and SQLite. Features modular architecture, comprehensive product management, multi-store support, and professional code organization.

## ✨ Features

- 🛒 **Point of Sale (POS)** - Fast checkout with barcode scanning, cart management, and payment processing
- 📦 **Product Management** - Full product lifecycle with variants, images, and stock tracking
- 📊 **Finance Dashboard** - Revenue analytics, profit tracking, and financial reports
- 🏪 **Multi-Store Support** - Manage multiple store locations
- 👥 **Customer & Employee Management** - CRM and staff management
- 📈 **Real-time Analytics** - Sales metrics, KPIs, and performance charts
- 🎨 **Dark Mode** - Beautiful UI with light/dark theme support
- 🌐 **Internationalization** - Multi-language support (English, Arabic)
- 💾 **SQLite Database** - Fast, reliable local database with Prisma ORM

## 🏗️ Architecture

This application follows professional software engineering practices with:

- **Modular Design** - Feature-based folder structure
- **Custom Hooks Pattern** - Business logic separation
- **Component Composition** - Small, focused components
- **Type Safety** - Comprehensive TypeScript coverage
- **IPC Handler Registry** - Domain-specific backend handlers
- **Lazy Loading** - Optimized code splitting

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 📁 Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts          # Entry point
│   └── ipc/              # IPC communication
│       ├── handlers.ts   # Handler entry
│       └── handlers/     # Domain handlers (10 files)
│
├── preload/              # Preload scripts
│   └── index.ts
│
└── renderer/             # React application
    └── src/
        ├── App.tsx       # Main app with routing
        ├── contexts/     # React contexts (Auth, Theme, Language)
        ├── pages/        # Feature modules
        │   ├── Dashboard.tsx
        │   ├── Finance/      # 6 files, 686 lines
        │   ├── Products/     # 6 files, 773 lines
        │   ├── Settings/     # 5 files, 634 lines
        │   └── POS/          # 8 files, ~700 lines
        ├── components/   # Shared components
        ├── hooks/        # Custom hooks
        └── utils/        # Utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/electron-app.git
cd electron-app

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (creates demo user: 0000/0000)
npx prisma db seed
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

**Demo Login:**
- Username: `0000`
- Password: `0000`

### Building

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons

### Backend
- **Electron.js** - Desktop framework
- **Prisma ORM** - Database toolkit
- **SQLite** - Local database
- **bcryptjs** - Password hashing

### Build Tools
- **Vite** - Build tool and dev server
- **electron-vite** - Electron-specific Vite config
- **electron-builder** - App packaging

## 📊 Code Quality

### Refactoring Achievements

- **13% overall code reduction** (3,837 → 3,343 lines)
- **35 modular files** instead of 5 monolithic files
- **14 unused files removed** (cleanup)
- **Custom hooks** for business logic separation
- **Comprehensive TypeScript** coverage

### Module Breakdown

| Module | Before | After | Files | Reduction |
|--------|--------|-------|-------|-----------|
| Finance | 930 lines | 686 lines | 6 | 26% |
| Products | 895 lines | 773 lines | 6 | 14% |
| Settings | 805 lines | 634 lines | 5 | 21% |
| POS | 689 lines | ~700 lines | 8 | Modularized |
| IPC Handlers | 518 lines | ~550 lines | 10 | Split |

## 🎯 Key Features Detail

### Point of Sale (POS)
- Real-time product search with barcode scanning
- Shopping cart with stock validation
- Customer selection (search or manual entry)
- Multiple payment methods (Cash, Card)
- Transaction success feedback
- Automatic stock updates

### Product Management
- Product variants (colors, sizes)
- Multiple product images
- Inventory tracking per variant
- Category organization
- Advanced filtering (category, color, size, store)
- Bulk import/export

### Finance Dashboard
- Revenue and profit tracking
- Order analytics
- Top-selling products
- Performance radar chart
- Date range filtering
- Export reports

### Settings
- Theme customization (Light, Dark, System)
- Language selection
- Store configuration
- Currency and timezone settings
- Tax receipt settings (placeholder)
- Payment method management (placeholder)

## 🔒 Security

- **Password Hashing** - bcrypt with 10 rounds
- **Context Isolation** - Electron security best practices
- **IPC Bridge** - Secure preload script
- **No Node.js in Renderer** - Sandboxed renderer process
- **Prepared Statements** - SQL injection prevention (Prisma)

## 🧪 Testing (Planned)

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📝 Development Guidelines

### Adding a New Feature Module

1. Create folder: `src/renderer/src/pages/FeatureName/`
2. Create files:
   ```
   FeatureName/
   ├── index.tsx      # Main component
   ├── types.ts       # Type definitions
   ├── useFeature.ts  # Business logic hook
   └── Component.tsx  # Sub-components
   ```
3. Add lazy import in `App.tsx`
4. Add route in `App.tsx`

### Adding IPC Handlers

1. Create: `src/main/ipc/handlers/domain.handlers.ts`
2. Export `registerDomainHandlers(prisma)` function
3. Register in `handlers/index.ts`

## 🐛 Known Issues

- Settings page has 6 placeholder tabs (implementation pending)
- Some TypeScript strict mode violations (legacy code)
- Performance optimization pending for large datasets

## 🔮 Roadmap

- [ ] Add Zod validation for all forms and DTOs
- [ ] Implement remaining Settings panels
- [ ] Add React.memo for expensive components
- [ ] Virtualize long product/sales lists
- [ ] Set up Jest + React Testing Library
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Implement Repository pattern for data access
- [ ] Add PWA support for web version

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Comprehensive architecture documentation
- [Prisma Schema](./prisma/schema.prisma) - Database schema
- [IPC Handlers](./src/main/ipc/handlers/) - Backend API documentation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Lead Developer** - Architecture and refactoring
- **UI/UX** - Modern, accessible design
- **Database** - Prisma schema and migrations

## 🙏 Acknowledgments

- Electron.js community
- React and TypeScript teams
- Prisma team for amazing ORM
- TailwindCSS for beautiful styling
- All open-source contributors

---

**Built with ❤️ using Electron + React + TypeScript**

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
