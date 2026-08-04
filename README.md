# Boardroom — Collaborative Whiteboard (MERN + Socket.IO)

A real-time collaborative whiteboard: MongoDB, Express, React, Node, and
Socket.IO, with drawing powered by [fabric.js](http://fabricjs.com/).

## Features implemented

- **Auth** — register/login (JWT), logout, edit profile (name/email)
- **Whiteboards** — create, list, rename, delete, share by email
- **Drawing tools** — pen, eraser, line, rectangle, circle, text, color picker, brush size
- **Canvas** — zoom in/out (buttons + scroll), pan tool, clear board, large pannable/zoomable canvas
- **Object editing** — select, move, resize, delete (select tool + Delete/Backspace key)
- **Real-time collaboration** — shared board rooms, simultaneous drawing, live collaborator cursors, active-collaborator avatars
- **Undo/redo** — per-tab history stack (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- **Autosave** — debounced save to MongoDB; reopening a board restores the last saved state
- **Export** — PNG and PDF, rendering the full board content (not just the visible viewport)

## Project layout

```
backend/    Express API + Socket.IO server + MongoDB models
frontend/   React app (Create React App)
```

## Running locally

### 1. MongoDB
Have a MongoDB instance running (local `mongod`, Docker, or Atlas) and note its connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env     # then fill in MONGO_URI and a strong JWT_SECRET
npm install
npm run dev               # nodemon, http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # defaults already point at localhost:5000
npm install
npm start                 # http://localhost:3000
```

Open the app in two browser windows (or two browsers) signed in as different
users, share a board between them, and draw — changes and cursors sync live.

## How the real-time sync works

- Socket.IO connections authenticate with the same JWT issued at login.
- Joining a board (`board:join`) puts the socket in a `board:<id>` room and
  broadcasts the updated collaborator/presence list.
- On any local canvas change, the client serializes the whole fabric.js
  canvas to JSON and emits `canvas:update` (throttled ~120ms); other clients
  in the room load that JSON into their own canvas.
- Cursor positions are broadcast on `cursor:move` (throttled ~60ms) in canvas
  world coordinates, then re-projected to each viewer's own screen/zoom via
  fabric's viewport transform.
- Whole-canvas JSON sync is simple and robust for a project like this, at the
  cost of some bandwidth versus a diff/operation-based CRDT approach — a
  reasonable trade-off outside of very large boards or huge concurrent
  editor counts.

## Known simplifications (things a production version should harden)

- **Eraser** is implemented as a white freehand brush stroke, not a true
  pixel/object eraser — simplest approach without pulling in an extra fabric
  add-on, but it will only look correct on a plain white background.
- **Undo/redo** is local to each tab/session (based on full-canvas snapshots)
  rather than a shared, per-user operation history — concurrent undo across
  multiple users is not conflict-free.
- **Conflict resolution** uses "last write wins" full-canvas snapshots rather
  than operational transforms/CRDTs, which is fine at small team scale but
  can drop intermediate strokes under heavy simultaneous editing.
- No automated test suite is included; see `backend` and `frontend` for
  manual test steps above.

## Tech stack

- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT, bcryptjs
- **Frontend**: React, React Router, fabric.js, socket.io-client, jsPDF, axios
