# Competitor Inspiration Library

An internal tool for GTM teams to collect, view, and synthesize competitor landing pages with screenshots, copy extraction, tech stack detection, and weekly "Steal / Adapt / Avoid" insights.

## Features

### 🏢 Competitor Management
- Add and organize competitors by industry
- Track multiple competitors with detailed profiles
- Link landing pages to specific competitors

### 📸 Landing Page Capture
- Automated screenshot capture (desktop & mobile)
- Text content extraction using intelligent parsing
- Tech stack detection (React, Stripe, Analytics tools, etc.)
- Full-page or viewport-only screenshots

### 💡 Insights System
- **Steal**: Copy this approach directly
- **Adapt**: Modify for our use case  
- **Avoid**: Learn what not to do
- Confidence rating (1-5 stars)
- Rich filtering and search capabilities

### 📊 Weekly Reports
- Curated insights organized by week
- Steal/Adapt/Avoid categorization
- Export functionality for sharing
- Summary generation

### 🎨 Beautiful Dashboard
- Modern, responsive design with Tailwind CSS
- Real-time statistics and activity feed
- Advanced search and filtering
- Mobile-optimized interface

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: SQLite with Prisma ORM
- **Capture Engine**: Puppeteer for screenshots and content extraction
- **Parsing**: Cheerio for HTML content extraction
- **Icons**: Heroicons
- **Forms**: React Hook Form with Zod validation

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies**
   \`\`\`bash
   git clone <repository-url>
   cd competitor-inspiration-library
   npm install
   \`\`\`

2. **Set up the database**
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   \`\`\`

3. **Create environment file**
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   \`\`\`

4. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Adding Competitors
1. Go to "Competitors" in the navigation
2. Click "Add Competitor"
3. Fill in company details (name, website, industry, description)
4. Save to start tracking

### Capturing Landing Pages
1. Click "Capture Page" from dashboard or competitors page
2. Enter the URL you want to analyze
3. Choose device type (desktop/mobile) and screenshot options
4. The system will automatically:
   - Take a screenshot
   - Extract text content
   - Detect tech stack
   - Save all data

### Creating Insights
1. View captured landing pages
2. Click "Add Insight" on any page
3. Choose category (Steal/Adapt/Avoid)
4. Add title, description, and confidence rating
5. Link to specific landing page elements

### Generating Weekly Reports
1. Go to "Weekly Reports"
2. Click "Create Report" 
3. Select date range
4. Choose insights to include
5. Add summary and generate report
6. Export as needed for sharing

## Project Structure

\`\`\`
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── competitors/     # Competitor management pages
│   │   ├── landing-pages/   # Landing page gallery
│   │   ├── insights/        # Insights management
│   │   ├── reports/         # Weekly reports
│   │   ├── capture/         # Page capture interface
│   │   └── analytics/       # Analytics dashboard
│   ├── components/          # Reusable React components
│   │   ├── Layout/          # Navigation and page layouts
│   │   ├── Competitors/     # Competitor-specific components
│   │   ├── LandingPages/    # Landing page components
│   │   ├── Insights/        # Insight components
│   │   └── Reports/         # Report components
│   ├── lib/                 # Utility libraries
│   │   ├── prisma.ts        # Database client
│   │   └── capture.ts       # Page capture logic
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
│   └── screenshots/         # Captured screenshots
└── package.json
\`\`\`

## Environment Variables

Create a \`.env.local\` file with:

\`\`\`env
# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Optional: External services
OPENAI_API_KEY="your-openai-key"     # For AI-powered insights
BROWSERLESS_TOKEN="your-token"        # For cloud-based capture
\`\`\`

## Development

### Database Schema Changes
\`\`\`bash
# After modifying prisma/schema.prisma
npx prisma generate
npx prisma db push
\`\`\`

### Type Checking
\`\`\`bash
npm run type-check
\`\`\`

### Linting
\`\`\`bash
npm run lint
\`\`\`

## Deployment

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database in Production
- For production, consider upgrading to PostgreSQL
- Update DATABASE_URL in production environment
- Run migrations: \`npx prisma migrate deploy\`

## Roadmap

### Phase 1 (Current)
- ✅ Basic competitor management
- ✅ Landing page capture
- ✅ Insights system
- ✅ Weekly reports
- ✅ Dashboard interface

### Phase 2 (Planned)
- [ ] AI-powered insight generation
- [ ] Advanced analytics and trends
- [ ] Team collaboration features
- [ ] Slack/email notifications
- [ ] API for external integrations

### Phase 3 (Future)
- [ ] A/B testing recommendations
- [ ] Competitive analysis automation
- [ ] Industry benchmarking
- [ ] Advanced export formats
- [ ] Custom reporting templates

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Make changes and commit: \`git commit -am 'Add feature'\`
4. Push to branch: \`git push origin feature-name\`
5. Submit a pull request

## Support

For questions or issues:
1. Check the documentation above
2. Search existing GitHub issues
3. Create a new issue with detailed description
4. Contact the development team

## License

This project is proprietary software for internal use only.

kill server
pkill -f "npm run dev" && pkill -f "next" && pkill -f "node"

instatnt kill and restart
pkill -f "npm run dev" && pkill -f "next" && pkill -f "node" && sleep 2 && npm run dev


----
there are a couple of issues here 
1, When I click any card in the left side selecting a particular page, I believe it runs semantic anlaysis on all the pages, Correct me if I am wrong. 
2, The card has certain visual elements, like "Analaysis Complete" 