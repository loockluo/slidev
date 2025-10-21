import dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import { Document } from '@/entities/Document'
import { User } from '@/entities/User'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_DATABASE || './database.sqlite',
  entities: [Document, User],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
  // TypeORM 会自动使用 better-sqlite3 如果它被安装
  // better-sqlite3 通常会自动替代 sqlite3
})
