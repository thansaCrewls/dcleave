# Discord Server Leaver

An interactive CLI tool to help you leave multiple Discord servers easily. This tool provides a user-friendly interface to select and leave multiple servers at once.

## Features

- Interactive CLI interface with arrow key navigation
- Server list pagination (10 servers per page)
- Multiple server selection
- Shows server join dates
- Alphabetically sorted server list
- Confirmation before leaving servers
- Visual feedback for successful/failed operations

## Prerequisites

- Node.js
- npm

## Installation

1. Clone this repository

```bash
git clone https://github.com/thansaCrewls/dcleave.git
cd dcleave
```

2. Install dependencies

```bash
npm install
```

3. Get your Discord token:
   - Open Discord in your web browser (https://discord.com/app)
   - Press **[Ctrl + Shift + I]** to open Developer Tools
   - Go to the "Console" tab
   - Paste this code and press Enter:

```javascript
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  (req) => {
    if (!req.c) return;
    for (const m of Object.keys(req.c)
      .map((x) => req.c[x].exports)
      .filter((x) => x)) {
      if (m.default && m.default.getToken !== undefined) {
        return copy(m.default.getToken());
      }
      if (m.getToken !== undefined) {
        return copy(m.getToken());
      }
    }
  },
]);
console.log("%cWorked!", "font-size: 50px");
console.log(`%cYou now have your token in the clipboard!`, "font-size: 16px");
```

- Your token will be automatically copied to your clipboard

4. Edit `accounts.json` file in the root directory and paste your token:

```env
TOKEN=your_discord_token_here
```

Note: make file 'serverid.txt' if you want leave by id server
