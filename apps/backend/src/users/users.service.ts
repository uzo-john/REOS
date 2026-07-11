import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private static mockUsers: User[] = [];

  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<User> {
    const lowercaseEmail = data.email.toLowerCase();

    if (!this.prisma.isConnected) {
      const existing = UsersService.mockUsers.find(u => u.email === lowercaseEmail);
      if (existing) {
        throw new ConflictException('User with this email already exists');
      }
      const newUser: User = {
        id: `mock-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: lowercaseEmail,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: null,
        avatarUrl: null,
        role: data.role || 'CUSTOMER',
        isEmailVerified: false,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        lastLoginAt: null,
        lastLoginIp: null,
        status: 'ACTIVE',
        metadata: null,
        deletedAt: null,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      UsersService.mockUsers.push(newUser);
      console.log('Offline mode: Created mock user in memory:', lowercaseEmail);
      return newUser;
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: lowercaseEmail },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        ...data,
        email: lowercaseEmail,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const lowercaseEmail = email.toLowerCase();
    if (!this.prisma.isConnected) {
      return UsersService.mockUsers.find(u => u.email === lowercaseEmail) || null;
    }
    return this.prisma.user.findUnique({
      where: { email: lowercaseEmail },
    });
  }

  async findById(id: string): Promise<User> {
    if (!this.prisma.isConnected) {
      const user = UsersService.mockUsers.find(u => u.id === id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    let hashedToken: string | null = null;
    if (token) {
      hashedToken = await bcrypt.hash(token, 10);
    }

    if (!this.prisma.isConnected) {
      const userIndex = UsersService.mockUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        UsersService.mockUsers[userIndex] = {
          ...UsersService.mockUsers[userIndex],
          refreshToken: hashedToken,
          updatedAt: new Date(),
        };
      }
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }
}
