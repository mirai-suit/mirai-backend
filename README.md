# Node.js TypeScript Express API with Prisma

A professional boilerplate for building RESTful APIs using Node.js, TypeScript, Express, and Prisma ORM.

## Features

- **TypeScript** - Strongly typed language that builds on JavaScript
- **Express** - Fast, unopinionated, minimalist web framework for Node.js
- **Prisma ORM** - Next-generation Node.js and TypeScript ORM
- **PostgreSQL** - Powerful, open-source relational database
- **JWT Authentication** - JSON Web Token based authentication
- **Clean Architecture** - Controllers, Services, and Routes pattern
- **Error Handling** - Centralized error handling mechanism
- **Environment Variables** - Using dotenv for environment configuration
- **CORS** - Cross-Origin Resource Sharing enabled
- **Logging** - Using winston for logging
- **Hot Reloading** - Using ts-node-dev for development

## Project Structure

```
.
├── prisma/                 # Prisma schema and migrations
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── generated/          # Prisma generated client
│   ├── middlewares/        # Custom middleware
│   ├── prisma/             # Prisma client instance
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── server.ts           # Express app setup
├── .env                    # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd your-project-name
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file with your database connection string and JWT secret:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-super-secret-jwt-key"
```

5. Generate Prisma client:

```bash
npm run prisma:generate
```

6. Run database migrations:

```bash
npm run prisma:migrate
```

7. Start the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start the development server with hot-reloading
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio to manage database
- `npm run prisma:seed` - Seed the database with initial data
- `npm run prisma:format` - Format the Prisma schema file

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `POST /api/auth/verify-otp` - Verify OTP for email verification
- `POST /api/auth/resend-otp` - Resend verification OTP
- `GET /api/auth/me` - Get current user profile (authenticated)
- `POST /api/auth/refresh-token` - Refresh access token using refresh token
- `POST /api/auth/request-password-reset` - Request password reset OTP
- `POST /api/auth/verify-password-reset` - Verify password reset OTP
- `POST /api/auth/reset-password` - Reset user password



### Roles  = [ "USER" , "TRAINER" , "FIGHTER" , "ADMIN" ]

### Request/Response Examples

#### User Registration
```
POST /api/auth/signup
```

Request:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["USER"]
}
```

Response:
```json
{
  "user": {
    "id": "userId",
    "email": "user@example.com",
    "username": "username",
    "roles": ["user"],
    "isverified": false
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "refresh_token"
}
```

#### User Login
```
POST /api/auth/login
```

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "id": "userId",
    "email": "user@example.com",
    "username": "username", 
    "roles": ["USER"],
    "isVerified":true
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "refresh_token"
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
```

Request:
```json
{
  "code": "123456",
}
```

Response:
```json
{
  "verified": true,
  "message": "Email verification successful"
}
```

#### Refresh Token
```
POST /api/auth/refresh-token
```

Request:
```json
{
  "refreshToken": "refresh_token"
}
```

Response:
```json
{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_refresh_token"
}
```

#### Request Password Reset
```
POST /api/auth/request-password-reset
```

Request:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Password reset instructions have been sent to your email"
}
```

#### Reset Password
```
POST /api/auth/reset-password
```

Request:
```json
{
  "newPassword": "newPassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

## License

This project is licensed under the ISC License.