# Codab - Collaborative IDE

## Overview

Codab is a real-time collaborative online IDE that allows multiple users to write, edit, compile, and execute code together in shared rooms. It also provides integrated chat, a collaborative drawing board, and multi-file project support.

## Features

* Real-time collaborative code editing
* Multi-user room support
* Create, rename, delete, and switch between multiple files
* Live code synchronization using Socket.IO
* Code compilation and execution
* Interactive program input/output
* Room chat
* Shared drawing board
* Copy Room ID for inviting collaborators
* Automatic file synchronization
* Mobile responsive interface
* Syntax highlighting using Monaco Editor

## Supported Languages

* C (.c)
* C++ (.cpp)
* Java (.java)
* Python (.py)
* JavaScript (.js)

## Technologies Used

Frontend

* HTML5
* CSS3
* Tailwind CSS
* JavaScript
* Monaco Editor

Backend

* Node.js
* Express.js
* Socket.IO

Compiler

* Judge0 API

## Folder Structure

```
Codab/
│
├── public/
│   ├── index.html
│   ├── room.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── server.js
├── package.json
├── README.txt
└── ...
```

## Installation

1. Install Node.js.

2. Install project dependencies:

```
npm install
```

3. Start the server:

```
npm start
```

or

```
node server.js
```

4. Open your browser:

```
http://localhost:3000
```

## How to Use

1. Open the homepage.
2. Enter your username.
3. Create a new room or join an existing room.
4. Create or open files.
5. Write code collaboratively.
6. Run the program.
7. Use Chat for communication.
8. Use Draw Board for diagrams and discussions.
9. Share the Room ID with teammates.

## Project Modules

* Home Page
* Room Management
* File Manager
* Monaco Code Editor
* Code Synchronization
* Compiler
* Output Panel
* Chat System
* Draw Board
* User Management

## Browser Compatibility

* Google Chrome
* Microsoft Edge
* Mozilla Firefox

## Requirements

* Node.js
* npm
* Internet connection (for code compilation)

## Authors

Developed by:

Pankaj Sarwa

## License

This project is developed for educational purposes.
