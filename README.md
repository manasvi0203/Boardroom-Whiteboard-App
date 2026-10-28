# BoardRoom - Real-Time Collaborative Whiteboard

A full-stack collaborative whiteboard application that enables multiple users to draw, edit, and collaborate in real time. Built using the MERN stack, Socket.IO, and Fabric.js, BoardRoom provides a smooth and interactive whiteboard experience with secure authentication and persistent storage.

---

## Features

- Real-time collaborative drawing using Socket.IO
- Freehand drawing
- Shapes (Rectangle, Circle, Line, Arrow)
- Text tool
- Color picker & brush size customization
- Eraser tool
- Undo / Redo functionality
- Automatic board saving
- JWT-based Authentication
- Multi-user collaboration
- Responsive interface

---

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Fabric.js
- Axios

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt.js

---

## Project Structure

```
WHITEBOARD-APP
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── sockets
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── public
│   ├── src
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/boardroom-collaborative-whiteboard.git

cd boardroom-collaborative-whiteboard
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Visit:

```
http://localhost:5173
```

---

## Future Enhancements

- Video & Voice Collaboration
- Sticky Notes
- Image Upload
- Infinite Canvas
- Board Sharing via Invite Links
- Export as PNG/PDF
- Version History
- Cursor Presence Indicators

---

## Learning Highlights

This project demonstrates:

- Real-time communication with Socket.IO
- Canvas manipulation using Fabric.js
- REST API development with Express.js
- JWT Authentication & Authorization
- MongoDB database integration
- State management in React
- Full-stack application architecture

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Add feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## Author

**Manasvi Arora**

---

## 📄 License

This project is licensed under the MIT License.
