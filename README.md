# Multiplayer Minecraft Game

A multiplayer voxel-based game built with Three.js and Node.js, featuring real-time synchronization and procedurally generated terrain.

## Features

- Real-time multiplayer with WebSocket synchronization
- Procedurally generated terrain with hills and trees
- First-person controls with physics
- Block placing and breaking
- 5 different block types
- Player models with smooth interpolation
- Auto-reconnection on disconnect

## Local Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

4. Open multiple browser tabs/windows to test multiplayer functionality

## Controls

- **WASD** - Move around
- **Mouse** - Look around
- **Space** - Jump
- **Left Click** - Break block
- **Right Click** - Place block
- **1-5** - Select block type (Grass, Dirt, Stone, Wood, Sand)

## Deployment

### Deploy to Heroku

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create your-minecraft-game
```

4. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

5. Open your app:
```bash
heroku open
```

### Deploy to Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and deploy:
```bash
railway init
railway up
```

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your Git repository
3. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Deploy

### Deploy to DigitalOcean App Platform

1. Create a new App on [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Connect your Git repository
3. DigitalOcean will auto-detect the Node.js app
4. Deploy

### Deploy to AWS EC2

1. Launch an EC2 instance (Ubuntu recommended)
2. SSH into your instance
3. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Clone your repository and install dependencies:
```bash
git clone <your-repo-url>
cd minecraft-multiplayer
npm install
```

5. Install PM2 to keep the server running:
```bash
sudo npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

6. Configure your security group to allow traffic on port 3000

## Environment Variables

The server uses the following environment variables:

- `PORT` - Server port (default: 3000)

Set these in your deployment platform or create a `.env` file for local development.

## File Structure

```
minecraft-multiplayer/
├── server.js          # Node.js WebSocket server
├── game.js            # Client-side game logic
├── index.html         # Main HTML page
├── package.json       # Dependencies and scripts
├── Procfile          # Heroku deployment config
└── README.md         # This file
```

## Technical Details

- **Frontend**: Three.js for 3D rendering, WebSocket for real-time communication
- **Backend**: Node.js with Express and ws (WebSocket library)
- **World Size**: 32x32 blocks with dynamic height
- **Synchronization**: 20 updates per second for player positions
- **Physics**: Custom collision detection and gravity system

## Troubleshooting

### WebSocket connection fails
- Ensure the server is running
- Check that firewalls allow WebSocket connections
- For HTTPS sites, ensure WSS (secure WebSocket) is used

### Players not seeing each other
- Verify both clients are connected to the same server
- Check browser console for connection errors

### Poor performance
- Reduce render distance in game.js (RENDER_DISTANCE constant)
- Lower shadow quality or disable shadows
- Use fewer players simultaneously

## License

MIT
