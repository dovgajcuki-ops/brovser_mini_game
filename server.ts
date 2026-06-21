import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  // Game Rooms logic
  const rooms: Record<string, { players: string[], state: any }> = {};

  io.on("connection", (socket) => {
    socket.on("join-game", ({ gameId, roomId }) => {
      socket.join(roomId);
      if (!rooms[roomId]) {
        rooms[roomId] = { players: [], state: null };
      }
      if (!rooms[roomId].players.includes(socket.id)) {
         rooms[roomId].players.push(socket.id);
      }
      const playerIndex = rooms[roomId].players.indexOf(socket.id);
      socket.emit("player-joined", { playerIndex, roomId });
      
      if (rooms[roomId].players.length >= 2) {
          io.to(roomId).emit("game-ready", { message: "Гравці приєдналися!" });
      }
    });

    socket.on("game-action", ({ roomId, action }) => {
       // Broadcast action to everyone in the room
       socket.to(roomId).emit("game-action", action);
    });

    socket.on("game-state-update", ({ roomId, state }) => {
       rooms[roomId].state = state;
       socket.to(roomId).emit("game-state-update", state);
    });

    socket.on("disconnect", () => {
      // Very basic disconnect handling
      for (const roomId in rooms) {
         const idx = rooms[roomId].players.indexOf(socket.id);
         if (idx !== -1) {
            rooms[roomId].players.splice(idx, 1);
            io.to(roomId).emit("player-disconnected");
         }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
