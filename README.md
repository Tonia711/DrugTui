# ASP.NET Core + React User Authentication Demo

This project demonstrates a simple **admin-managed user authentication system** using:

- 🔧 **Backend**: C# with ASP.NET Core Web API
- 🎨 **Frontend**: React (Vite + Axios)
- 🔐 **Authentication**: JSON Web Token (JWT)
- 💾 **Database**: SQLite (via Entity Framework Core)

---

## 🚀 Features

- **Admin-managed user creation**
- User **Login**
- **JWT-based Authentication**
- Get current logged-in user (`/me`)
- Edit / Delete user profile
- Frontend + backend fully integrated

---

## 📁 Project Structure

### 🔹 Frontend: `user-auth-frontend/` (React + Vite)

- `public/` — Static public assets
- `src/` — Main application source code
  - `assets/` — Images and icons
  - `components/` — Reusable components (e.g., Navbar, Layout, ProtectedRoute)
  - `hooks/` — Custom React hooks (e.g., `useAxios`)
  - `pages/` — Page-level components (Login, Register, Home, Aboutme)
  - `styles/` — Modular CSS styles (`.module.css` files)
  - `util/` — Utility functions (e.g., API request logic)
  - `App.jsx` — Root component
  - `main.jsx` — React entry point
  - `index.css` — Global CSS
- `vite.config.js` — Vite configuration file
- `package.json` — Frontend dependencies and scripts

---

### 🔹 Backend: `UserAuthApi/` (ASP.NET Core Web API)

- `Controllers/` — API controllers (e.g., `UsersController.cs`)
- `Data/` — Entity Framework Core context (`AppDbContext.cs`) and SQLite DB files
- `Models/` — Data models and DTOs (e.g., `User.cs`, `LoginDto.cs`)
- `Migrations/` — EF Core database migration files
- `UserAuthApi.csproj` — ASP.NET Core project configuration file

---

## 🔧 Getting Started

Follow the instructions below to set up and run the project on your local machine.

---

### 1. Clone the Repository

```bash
git clone https://github.com/UOA-CS732-S1-2025/cs732-assignment-Tonia711
cd tech-demo
```

---

### 2. Set Up the Backend (ASP.NET Core API)

#### Prerequisites

- [.NET SDK 8.0 or later](https://dotnet.microsoft.com/en-us/download) — required to run the backend
- SQLite (used via EF Core; CLI tool like `sqlite3` is optional but useful for DB inspection)

#### Steps

```bash
cd UserAuthApi
dotnet restore                 # Restore project dependencies
dotnet ef database update     # Apply EF Core migrations
dotnet run                    # Start the backend server
```

By default, the backend runs at `http://localhost:5147`, as defined in the `Properties/launchSettings.json` file.

Once running, Swagger UI is available at:

👉 http://localhost:5147/swagger

You can use Swagger to test the API endpoints (/register, /login, /me) directly from your browser.

---

#### 📘 API Overview (via Swagger)

The backend provides the following API endpoints under the `/Users` route:

| Method | Endpoint          | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| POST   | `/Users/register` | Create a new user _(Admin token required)_   |
| POST   | `/Users/login`    | Log in and receive JWT                       |
| GET    | `/Users/me`       | Fetch current user profile _(Auth required)_ |
| PUT    | `/Users/me`       | Update user information _(Auth required)_    |
| DELETE | `/Users/me`       | Delete user account _(Auth required)_        |

You can test these endpoints via Swagger UI:

👉 [http://localhost:5147/swagger](http://localhost:5147/swagger)

All authenticated routes require a valid Bearer token in the `Authorization` header.

#### 🧪 Default Admin Credentials

An admin account is seeded automatically at startup (if not already present):

```json
{
  "email": "admin@drugtui.local",
  "password": "Admin123!"
}
```

#### 🧪 Example User Login Credentials

```json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

#### 🔐 Authentication

To access protected routes (e.g., `GET /Users/me`, `PUT /Users/me`, `DELETE /Users/me`), you must include a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer <your_token>
```

You can obtain the token by sending a POST request to /Users/login with valid credentials.

🧪 Swagger Authentication
You can test protected endpoints in Swagger:

1.Click the green "Authorize" button in the top-right corner

2.Enter your token in the format: Bearer your_token_here

3.Submit requests — the token will be included automatically

If you are logged in through the frontend, you can also copy the token from your browser's localStorage.

#### 📦 How to View the JWT Token in localStorage

After logging in from the frontend, the JWT token is automatically stored in the browser's localStorage.

To view the token:

1. Open the site (e.g., `http://localhost:5173`) in your browser
2. Right-click and choose **Inspect**, or press `F12` / `Cmd + Option + I`
3. Go to the **Application** tab
4. In the left sidebar, expand **Local Storage**
5. Click your site (e.g., `http://localhost:5173`)
6. Look for a key named `token` — this contains the JWT

You can copy this token and paste it into Swagger's "Authorize" dialog or use it in API testing tools like Postman.

### 3. Set Up the Frontend (React with Vite)

#### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18+ recommended)

```bash
cd user-auth-frontend
npm install
npm run dev
```

The frontend should be available at:  
👉 `http://localhost:5173`

---

### 4. Testing the Flow

1. Log in as admin at `/Users/login`
2. Use admin token to call `POST /Users/register` and create a user
3. Log in with the new user's credentials at `/login`
4. The JWT token is automatically stored in `localStorage`
5. Access `/me` to view your user profile
6. You can edit your profile via the **Edit Profile** button (sends a `PUT /Users/me` request)
7. You can delete your account via the **Delete Account** button (sends a `DELETE /Users/me` request)

---

## 🔐 Authentication Flow

- Register and log in through the frontend or Swagger
- The backend returns a JWT token upon login
- The frontend stores this token in `localStorage`
- Subsequent API requests include the token via the `Authorization: Bearer` header
- Protected endpoints (like `/me`) validate the token on the server

This flow is fully implemented and tested in both the frontend and Swagger UI.

---

## 🔍 Comparison with Node.js / Express

| Feature              | ASP.NET Core          | Node.js / Express       |
| -------------------- | --------------------- | ----------------------- |
| Language             | C#                    | JavaScript / TypeScript |
| Routing Style        | Attribute-based       | Middleware-style        |
| Static Typing        | Strongly typed        | Weak/optional (TS)      |
| ORM Support          | Entity Framework Core | Mongoose / Prisma       |
| Dependency Injection | Built-in              | Manual or third-party   |
| Performance          | Very high             | High                    |

---

## 📩 Contact

**Tonia**  
xtao093@aucklanduni.ac.nz  
University of Auckland  
GitHub: [@Tonia711](https://github.com/Tonia711)

## 🏁 Summary

This project showcases how ASP.NET Core can serve as a modern backend alternative to Node.js, offering better tooling, type safety, and integration with React through a simple but functional authentication demo.
