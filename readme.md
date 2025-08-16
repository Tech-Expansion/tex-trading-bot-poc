# Trading Bot Setup Guide

This guide will help you set up and run the Trading Bot project, including installing dependencies, running the PostgreSQL database using Docker, and initializing the database schema.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- Node.js >= 20.17 && <21 and npm installed

## Installing the Project

1. Clone this repository:

   ```sh
   git clone https://github.com/Tech-Expansion/tex-trading-bot-poc.git
   cd tex-trading-bot-poc
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

## Running the Database with Docker

1. Start the PostgreSQL database with Docker Compose:

   ```sh
   docker-compose up -d
   ```

   This will start a PostgreSQL container named `trading_bot_db` with the following credentials:

   - **User**: `admin`
   - **Password**: `admin123`
   - **Database**: `trading_bot`

2. Verify that the database is running:

   ```sh
   docker ps
   ```

   You should see a running container named `trading_bot_db`.

## Initializing the Database

To create the required tables using Prisma migrations, follow these steps:

1. Ensure the database container is running.

2. Run the following command to apply migrations:

   ```sh
   npx prisma migrate dev --name init
   ```

   This will initialize the database schema as defined in `prisma/schema.prisma`.

## Updating and Re-running Prisma Migrations

If you update the `prisma/schema.prisma` file and need to apply changes to the database, follow these steps:

1. Generate a new migration:

   ```sh
   npx prisma migrate dev --name init
   ```

2. If you need to reset the database and reapply migrations:

   ```sh
   npx prisma migrate reset
   ```

   **Warning**: This will delete all data in the database.

3. If you only want to update the Prisma Client without applying migrations, run:

   ```sh
   npx prisma generate
   ```

## Running the Project

Once the database is set up, you can start the bot.

1. Set up the environment variables:

   ```sh
   cp .env.example .env
   ```

   Update `.env` with the correct database connection string:

   ```plaintext
   DATABASE_URL=postgresql://admin:admin123@localhost:5433/trading_bot
   ```

2. Run the bot:

   ```sh
   npm run dev
   ```

## Stopping and Removing the Database

To stop the database container, run:

```sh
docker-compose down
```

This will stop and remove the container but keep the database volume.

If you want to remove all data and start fresh, remove the volume:

```sh
docker-compose down -v
```

Now your trading bot is ready to use! 🚀