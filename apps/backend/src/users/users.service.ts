import {
  Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];
const PROTECTED_ROLES: UserRole[] = ['SUPER_ADMIN']; // cannot be deleted or demoted by ADMIN

@Injectable()
export class UsersService {
  private static mockUsers: User[] = [];

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CRUD (existing)
  // ─────────────────────────────────────────────────────────────────────────

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
      if (existing) throw new ConflictException('User with this email already exists');
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
      return newUser;
    }

    const existing = await this.prisma.user.findUnique({ where: { email: lowercaseEmail } });
    if (existing) throw new ConflictException('User with this email already exists');

    return this.prisma.user.create({ data: { ...data, email: lowercaseEmail } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const lowercaseEmail = email.toLowerCase();
    if (!this.prisma.isConnected) {
      return UsersService.mockUsers.find(u => u.email === lowercaseEmail) || null;
    }
    return this.prisma.user.findUnique({ where: { email: lowercaseEmail } });
  }

  async findById(id: string): Promise<User> {
    if (!this.prisma.isConnected) {
      const user = UsersService.mockUsers.find(u => u.id === id);
      if (!user) throw new NotFoundException('User not found');
      return user;
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    let hashedToken: string | null = null;
    if (token) hashedToken = await bcrypt.hash(token, 10);

    if (!this.prisma.isConnected) {
      const idx = UsersService.mockUsers.findIndex(u => u.id === userId);
      if (idx !== -1) {
        UsersService.mockUsers[idx] = { ...UsersService.mockUsers[idx], refreshToken: hashedToken, updatedAt: new Date() };
      }
      return;
    }
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashedToken } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN USER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /** List all users — paginated, searchable, filterable by role/status */
  async adminListUsers(opts: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: string;
  }) {
    const page = opts.page || 1;
    const limit = Math.min(opts.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(opts.role && { role: opts.role }),
      ...(opts.status && { status: opts.status }),
      ...(opts.search && {
        OR: [
          { email: { contains: opts.search, mode: 'insensitive' } },
          { firstName: { contains: opts.search, mode: 'insensitive' } },
          { lastName: { contains: opts.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          phone: true,
          avatarUrl: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Promote or change a user's role */
  async changeUserRole(targetUserId: string, newRole: UserRole, requestingUserId: string) {
    const [requestor, target] = await Promise.all([
      this.findById(requestingUserId),
      this.findById(targetUserId),
    ]);

    // Only SUPER_ADMIN can grant SUPER_ADMIN or ADMIN
    if (ADMIN_ROLES.includes(newRole) && requestor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can assign admin roles');
    }

    // Cannot change another SUPER_ADMIN unless you are also one
    if (PROTECTED_ROLES.includes(target.role) && requestor.id !== target.id) {
      throw new ForbiddenException('Cannot modify a SUPER_ADMIN account');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return updated;
  }

  /** Suspend or activate a user account */
  async setUserStatus(targetUserId: string, status: 'ACTIVE' | 'SUSPENDED', requestingUserId: string) {
    const [requestor, target] = await Promise.all([
      this.findById(requestingUserId),
      this.findById(targetUserId),
    ]);

    if (target.id === requestingUserId) {
      throw new BadRequestException('You cannot suspend your own account');
    }
    if (PROTECTED_ROLES.includes(target.role)) {
      throw new ForbiddenException('Cannot suspend a SUPER_ADMIN account');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });
  }

  /** Soft-delete a user (sets deletedAt, anonymises PII) */
  async removeUser(targetUserId: string, requestingUserId: string) {
    const [requestor, target] = await Promise.all([
      this.findById(requestingUserId),
      this.findById(targetUserId),
    ]);

    if (target.id === requestingUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    if (PROTECTED_ROLES.includes(target.role)) {
      throw new ForbiddenException('Cannot delete a SUPER_ADMIN account');
    }
    // Only SUPER_ADMIN can delete ADMIN accounts
    if (ADMIN_ROLES.includes(target.role) && requestor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can delete admin accounts');
    }

    // Soft delete — anonymise PII, keep financial audit trail
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        deletedAt: new Date(),
        status: 'SUSPENDED',
        email: `deleted_${targetUserId}@reos.deleted`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        avatarUrl: null,
        refreshToken: null,
      },
    });

    return { success: true, message: `User ${target.email} has been removed` };
  }

  /** Get summary counts for admin dashboard */
  async adminUserStats() {
    const [total, active, suspended, admins, prosumers, consumers] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { deletedAt: null, role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      this.prisma.user.count({ where: { deletedAt: null, role: 'SYSTEM_OWNER' } }),
      this.prisma.user.count({ where: { deletedAt: null, role: 'CONSUMER' } }),
    ]);

    return { total, active, suspended, admins, prosumers, consumers };
  }
}
