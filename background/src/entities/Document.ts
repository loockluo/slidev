import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { User } from './User'

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'varchar', length: 50 })
  userId: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string

  @Column({ type: 'varchar', length: 50, default: '1' })
  revision: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ type: 'datetime', nullable: true })
  lastOpenedAt: Date

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date

  @ManyToOne(() => User, user => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User
}
