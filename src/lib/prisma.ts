import 'dotenv/config';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3307,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,
});

export const prisma = new PrismaClient({
    adapter,
});