# Poker Chip Tracker

A multiplayer web application for tracking poker chips in live Texas Hold'em games with real-time synchronization across all players.

## Features

- **Real-time Multiplayer Sync**: All players see updates instantly
- **Table Management**: Create tables with customizable players, buy-ins, and blinds
- **Betting Flow**: Complete betting round management (Check, Call, Raise, Fold)
- **Round Tracking**: Automatic tracking of Pre-Flop, Flop, Turn, and River
- **Hand Resolution**: Select winners and distribute pots (supports split pots)
- **Player Stats**: Track buy-ins and total investment per player
- **Auto-expiration**: Tables expire after 24 hours

## Setup

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database
3. Copy your Firebase configuration
4. Update `firebase-config.js` with your credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Firebase Security Rules

Set up your Realtime Database security rules to allow read/write access (since there's no authentication):

```json
{
  "rules": {
    "tables": {
      ".read": true,
      ".write": true,
      ".indexOn": ["expiresAt"]
    }
  }
}
```

**Note**: For production, consider adding expiration-based rules or using Firebase Functions to clean up expired tables.

### 3. Deploy to Netlify

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Netlify
3. Set build command: (leave empty or use `echo 'No build step'`)
4. Set publish directory: `.` (root)
5. Deploy!

Or use Netlify CLI:

```bash
netlify deploy --prod
```

## Usage

1. **Create a Table**: Click "Create New Table" and configure:
   - Number of players (2-10)
   - Buy-in amount ($10-$1000)
   - Small blind (automatically sets big blind to 2×)
   - Player names and colors
   - Drag and drop to arrange player positions

2. **Share the Link**: Copy the generated table URL and share it with other players

3. **Start Playing**:
   - Select the dealer
   - Blinds are automatically posted
   - Players take turns betting
   - Rounds advance automatically (Pre-Flop → Flop → Turn → River)
   - Select winner(s) and distribute the pot
   - Start the next hand (dealer button moves automatically)

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (ES6 modules)
- **Real-time Sync**: Firebase Realtime Database
- **Deployment**: Netlify (static hosting)
- **No Backend**: All logic runs client-side
- **No Authentication**: Tables are accessible via shareable links
- **Storage**: Game state stored in Firebase, not localStorage

## Browser Support

Works in all modern browsers that support:
- ES6 modules
- Firebase SDK v10+
- CSS Grid and Flexbox

## Limitations

- Tables expire after 24 hours (configurable in code)
- No persistent hand history
- No user accounts or authentication
- No anti-cheat mechanisms
- Requires active internet connection for real-time sync

## License

MIT License - feel free to use and modify as needed.
