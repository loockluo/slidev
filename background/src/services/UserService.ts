import type { Repository } from 'typeorm'
import bcrypt from 'bcryptjs'
import { AppDataSource } from '@/config/database'
import { User } from '@/entities/User'

export class UserService {
  private userRepository: Repository<User>

  constructor() {
    this.userRepository = AppDataSource.getRepository(User)
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'avatarUrl', 'createdAt', 'updatedAt'],
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    })
  }

  async create(data: {
    username: string
    email: string
    password: string
  }): Promise<User> {
    const existingUser = await this.findByEmail(data.email)
    if (existingUser) {
      throw new Error('用户已存在')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = this.userRepository.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    })

    return this.userRepository.save(user)
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }

    return user
  }

  async updateProfile(id: string, data: {
    username?: string
    avatarUrl?: string
  }): Promise<void> {
    await this.userRepository.update(id, data)
  }
}
