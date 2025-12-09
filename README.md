# Aritmo Budget Planner 💰

A modern, desktop-based budget planner built with Electron, React, and SQLite. Manage your finances with a privacy-focused application that keeps all your data locally on your machine.

![Aritmo Logo](resources/aritmo-icon.png)

## ✨ Features

- **Dashboard**: Get a bird's-eye view of your financial health with interactive charts and summaries.
- **Transaction Tracking**: Easily log income and expenses.
- **Budget Management**: Set monthly targets for different categories and track your progress.
- **Category Customization**: Create custom categories to match your spending habits.
- **Privacy First**: All data is stored locally in an SQLite database. No cloud, no tracking.
- **Modern UI**: Clean, light-themed interface built with React and standard CSS.
- **Data Safety**: "Danger Zone" setting to wipe data if needed.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jean-EstevezT/Aritmo-Budget-Planner.git
   cd Aritmo-Budget-Planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Rebuild native modules (Windows)**
   ```bash
   npm run rebuild
   ```

4. **Start the application**
   ```bash
   npm start
   ```

## 🛠️ Technology Stack

- **Core**: Electron 28+
- **Frontend**: React, Vite
- **Database**: SQLite (via `better-sqlite3` and `knex`)
- **Styling**: Vanilla CSS (Modern Variables)
- **Charts**: Chart.js

## 📁 Project Structure

```
Aritmo-Budget-Planner/
├── src/
│   ├── main/           # Electron main process & Database logic
│   ├── renderer/       # React frontend application
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components (Card, Button, Input)
│   │   │   ├── pages/      # Application views
│   │   │   └── services/   # API layer for IPC communication
│   └── common/         # Shared constants (IPC Channels)
├── resources/          # Static assets (Icon, Favicon)
└── package.json
```

## 👨‍💻 Developer

**Jean Estevez**
- GitHub: [Jean-EstevezT](https://github.com/Jean-EstevezT)
- Email: ctarriba9@gmail.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.