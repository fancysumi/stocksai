# StockGenie - AI Trading Assistant

A modern, mobile-first stock recommendation system with advanced financial tracking and AI-powered investment guidance. Built with React, TypeScript, and PostgreSQL, leveraging Claude AI and Polygon.io for intelligent portfolio management.

## 🚀 Features

### 📊 Portfolio Management
- **Multi-Portfolio Support**: Manage up to 3 portfolios (Main, Growth, Dividend)
- **Real-time P&L Tracking**: Live profit/loss calculations with current market data
- **Bulk Import**: Import existing positions via CSV, space-separated, or tab-separated formats
- **Cash Balance Management**: Track available funds and buying power
- **Position Management**: Add, edit, and remove individual positions

### 🤖 AI-Powered Recommendations
- **Claude AI Integration**: Sophisticated investment analysis and recommendations
- **Daily Market Analysis**: Automated recommendations at NYSE open (9 AM EST) and close (4:30 PM EST)
- **Multiple Recommendation Types**: Watchlist suggestions, portfolio optimization, and stock discovery
- **Confidence Scoring**: AI-generated confidence levels for each recommendation

### 📱 Mobile-First Design
- **Responsive Interface**: Optimized for mobile trading
- **Touch-Friendly Controls**: Large touch targets and intuitive navigation
- **Pull-to-Refresh**: Native mobile interactions
- **Bottom Navigation**: Easy access to all features

### 📈 Real-Time Market Data
- **Polygon.io Integration**: Live stock prices and market data
- **Market Indices Tracking**: Monitor SPY, QQQ, DIA performance
- **Real-time Updates**: Automatic data refresh throughout trading hours
- **Volume and Market Cap**: Comprehensive stock metrics

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **Shadcn/ui** component library with Tailwind CSS
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Node-cron** for scheduled tasks
- **WebSocket** support for real-time updates

### External Services
- **Anthropic Claude API** for AI-powered analysis
- **Polygon.io API** for real-time market data
- **Neon Database** for PostgreSQL hosting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Anthropic API key
- Polygon.io API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/stockgenie-ai-trading-assistant.git
cd stockgenie-ai-trading-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
ANTHROPIC_API_KEY=your_anthropic_api_key
POLYGON_API_KEY=your_polygon_api_key
```

4. **Initialize the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📊 Database Schema

The application uses a normalized PostgreSQL schema with the following main entities:

- **Users**: User authentication and profiles
- **Portfolios**: Multiple portfolio support with cash balances
- **Stocks**: Stock information with real-time pricing
- **Portfolio Items**: Individual stock positions with quantities and average prices
- **Watchlist**: User's watched stocks by portfolio
- **Recommendations**: AI-generated trading suggestions
- **Market Data**: General market indicators and indices

## 🔄 Data Flow

1. **Market Data Updates**: Scheduled service fetches real-time data from Polygon.io
2. **AI Analysis**: Claude service analyzes market conditions and generates recommendations
3. **User Interactions**: Frontend components interact with backend APIs using React Query
4. **Database Operations**: Drizzle ORM handles all database interactions with type safety
5. **Real-time Updates**: Polling-based updates for market data and recommendations

## 📱 Usage

### Adding Portfolio Positions

**Individual Positions:**
1. Navigate to Portfolio page
2. Click "Add" button
3. Enter stock symbol, shares, and average price
4. Select target portfolio

**Bulk Import:**
1. Click "Import" button on Portfolio page
2. Select target portfolio
3. Paste data in supported formats:
   - CSV: `AAPL,100,150.25`
   - Space-separated: `AAPL 100 150.25`
   - Tab-separated (Excel copy/paste)
4. Preview and validate positions
5. Import all valid positions

### Managing Cash Balances
- View available cash on portfolio selector
- Deposit/withdraw funds from portfolio pages
- AI recommendations consider available cash

### AI Recommendations
- Automatic generation twice daily (9 AM and 4:30 PM EST)
- View recommendations on Home page
- Get detailed analysis and confidence scores
- Filter by recommendation type (Watchlist, Portfolio, Discovery)

## 🏗 Architecture

### Frontend Architecture
- **Component-based**: Modular React components with TypeScript
- **State Management**: TanStack Query for server state, React Context for app state
- **Styling**: Tailwind CSS with custom design system
- **Mobile-first**: Responsive design optimized for touch interfaces

### Backend Architecture
- **RESTful API**: Clean endpoint structure with proper HTTP status codes
- **Database Layer**: Drizzle ORM with type-safe queries
- **Background Services**: Scheduled tasks for market data and AI analysis
- **Error Handling**: Comprehensive error middleware

### Key Design Decisions

- **PostgreSQL**: Chosen for ACID compliance and decimal precision for financial data
- **Drizzle ORM**: Type-safe database operations with minimal runtime overhead
- **Claude AI**: Superior reasoning capabilities for financial analysis
- **Mobile-first**: Bottom navigation and touch-optimized interface
- **Multi-portfolio**: Supports different investment strategies

## 🔒 Security

- Environment variables for sensitive API keys
- Input validation using Zod schemas
- SQL injection protection via parameterized queries
- HTTPS enforcement for production deployments

## 📈 Performance

- **Database Indexing**: Optimized queries for portfolio and stock data
- **Caching**: React Query provides intelligent caching
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: Immediate UI feedback for user actions

## 🚀 Deployment

### Replit Deployment (Recommended)
1. Connect your GitHub repository to Replit
2. Set environment variables in Replit Secrets
3. Use Replit's built-in PostgreSQL database
4. Deploy with one click

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Run database migrations: `npm run db:push`
5. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI API
- [Polygon.io](https://polygon.io) for market data
- [Shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team) for type-safe database operations

## 📞 Support

For support, questions, or feature requests, please open an issue on GitHub.

---

Built with ❤️ for intelligent investing