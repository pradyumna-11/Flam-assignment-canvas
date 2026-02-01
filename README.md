
# 🎨 Real-Time Collaborative Drawing Canvas

A real-time, multi-user drawing application where multiple users can draw simultaneously on a shared canvas.  
The application is built using **React**, **Node.js**, **WebSockets**, and the **raw HTML Canvas API** (no external drawing or canvas libraries).

---

## 🚀 How to Install and Run the Project

### Prerequisites
- Node.js (v16 or later recommended)
- npm

---

### Installation

From the project root directory, run:

```bash
npm install
````

---

### Running the Application

```bash
npm start
```

The server will start at:

```
http://localhost:3000
```

Open this URL in your browser to use the application.

---

## 🧪 How to Test the App with Multiple Users

1. Start the server using `npm start`
2. Open **multiple browser tabs** or **different browsers**
3. Navigate to:

   ```
   http://localhost:3000
   ```
4. Start drawing in one tab:

   * Other tabs will see the drawings **in real time**
   * Cursor positions and user indicators update instantly
5. Test:

   * Simultaneous drawing by multiple users
   * Global **Undo / Redo** from different users
   * Refreshing a tab (existing drawings are restored)

### Testing Multiple Rooms (Optional Feature)

Open different URLs:

```
http://localhost:3000/?room=alpha
http://localhost:3000/?room=beta
```

Each room has an isolated canvas, user list, and drawing history.

---

## ⚠️ Known Issues / Limitations

* No persistent storage (canvas state is stored in memory and resets when the server restarts)
* Users are identified using generated IDs (no custom usernames)
* No authentication or access control
* Mobile touch support is functional but not fully optimized for small screens
* Performance metrics such as FPS or network latency are not displayed

---

## ⏱️ Total Time Spent on the Project

**Total time spent:** **5 days**

### Approximate Time Breakdown

* Architecture design and planning: ~1 day
* Canvas drawing engine and real-time synchronization: ~2 days
* Global undo/redo and server-side state management: ~1 day
* Multi-user indicators, rooms, extra tools, bug fixing, and polishing: ~1 day

---

## 📄 Additional Documentation

For detailed system design, data flow diagrams, WebSocket protocol, undo/redo strategy, performance decisions, and conflict handling, refer to:

```
ARCHITECTURE.md
```

---

## ✅ Notes

This project intentionally avoids external drawing libraries to demonstrate strong understanding of:

* Raw HTML Canvas API
* Real-time WebSocket communication
* Distributed state synchronization
* Collaborative system architecture

