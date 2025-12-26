# Chat Application

A real-time chat application built with Node.js, Express, Socket.io, and MongoDB.

## Features

- User authentication (login/signup)
- Real-time messaging with Socket.io
- Create and join chat rooms
- User profiles

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables

4. Run the application:
   ```bash
   npm start
   ```

## Project Structure

- `src/` - Server-side code
  - `Controllers/` - Route controllers
  - `Models/` - Database models
  - `Routes/` - API routes
  - `socket/` - Socket.io configuration
  - `MiddleWares/` - Authentication and validation
- `views/` - EJS templates
- `public/` - Static files (CSS)

## Technologies Used

- Node.js
- Express.js
- Socket.io
- MongoDB
- EJS
- Tailwind CSS
- Passport.js
