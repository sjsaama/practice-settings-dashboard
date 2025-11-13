# Practice Settings Dashboard

A complete React application for managing healthcare practice settings and user permissions.

## Features

- ✅ Complete Settings System (24+ settings across 5 modules)
- ✅ User Management (Doctors and Secondary Accounts)
- ✅ Global Permissions Management
- ✅ Account Suspension and PIN Reset
- ✅ Link Management between Doctors and Staff
- ✅ Professional UI with Tailwind CSS

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Download the project files** to your computer

2. **Open terminal/command prompt** and navigate to the project folder:
   ```bash
   cd practice-settings-dashboard
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
practice-settings-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   ├── index.css
│   └── PracticeSettingsDashboard.jsx
├── package.json
└── README.md
```

## Dependencies

- React 18.2.0
- Lucide React (for icons)
- Tailwind CSS (for styling)
- React Scripts (for build tools)

## Usage

1. **Settings Management**: Click "Settings Setup" to configure practice-wide settings
2. **User Management**: Click "User Management" to manage doctors and secondary accounts
3. **Global Permissions**: Select secondary accounts to configure their permissions
4. **Account Actions**: Use "Manage Access" tab to suspend accounts or reset PINs

## Troubleshooting

If you encounter any issues:

1. Make sure Node.js is installed: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
4. Check that port 3000 is available

## Development

The app is built with Create React App and uses:
- Functional components with React Hooks
- Tailwind CSS for styling
- Lucide React for icons
- Modern JavaScript (ES6+)
