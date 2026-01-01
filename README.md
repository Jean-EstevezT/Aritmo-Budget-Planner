# Aritmo Budget Planner

A powerful, privacy-focused desktop application for personal finance management. Built with modern web technologies and wrapped in Electron, Aritmo runs locally on your machine, ensuring your financial data remains secure and private.

## Features

- **Interactive Dashboard**: Visual overview of your financial health with dynamic charts.
- **Transaction Management**: Easily record and categorize income and expenses.
- **Bill Tracking**: Keep track of recurring bills, due dates, and payment status.
- **Budget Planning**: Set monthly limits for different categories to control your spending.
- **Savings Goals**: Create and track progress towards your financial goals.
- **Debt Manager**: Monitor and plan your debt payoffs effectively.
- **Currency Converter**: Real-time currency conversion tools.
- **Multi-language Support**: Interface available in multiple languages.
- **Offline First**: Works without internet connection using local JSON storage.
- **Cloud Sync**: Automatically synchronizes data with Supabase when online.
- **Modern UI**: Clean, responsive interface styled with Tailwind CSS and Lucide icons.

## Screenshots

![Aritmo Budget Planner](screenTest/test.jpg)

## Stack

- **Runtime**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/) (v19)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) + Local JSON Storage
- **Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## External APIs

The application uses the following public APIs for real-time data:

- **Currency Exchange Rates**: [FloatRates](http://www.floatrates.com/) - Provides daily exchange rates for major currencies.
- **Dolar Vzla Rates**: [DolarAPI](https://dolarapi.com/) - Provides specific exchange rates for the database in Venezuela.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Jean-EstevezT/Aritmo-Budget-Planner.git
    cd Aritmo-Budget-Planner
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Create a `.env` file in the root directory:
    ```bash
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

4.  **Setup Database**
    Run the SQL commands from `supabase_schema.sql` in your Supabase SQL Editor to create the required tables with the necessary columns (including `updated_at`).

5.  **Run the application (Development)**
    ```bash
    npm run dev:electron
    ```
    This command runs both the Vite dev server and the Electron application concurrently.

6.  **Build for Production**
    ```bash
    npm run electron:dist
    ```

## Developer

**Jean Estevez**
- GitHub: [Jean-EstevezT](https://github.com/Jean-EstevezT)
- Email: ctarriba9@gmail.com

---

## License

This project is licensed under the [GNU GPLv3 License](LICENSE).
