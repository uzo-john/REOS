import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/api-key.dto';
import { generateApiKey, hashApiKey } from '../common/utils/api-key.util';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApiKeyDto, userId: string) {
    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        keyHash,
        keyPrefix,
        userId,
        organizationId: dto.organizationId,
        scopes: dto.scopes || ['read:devices'],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        status: 'ACTIVE',
      },
    });

    // We return the rawKey ONLY once on creation.
    return {
      ...apiKey,
      rawKey,
    };
  }

  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async validateKey(rawKey: string): Promise<any> {
    const hash = hashApiKey(rawKey);
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      include: {
        user: { select: { id: true, email: true, role: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!key || key.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    if (key.expiresAt && key.expiresAt.getTime() < Date.now()) {
      await this.prisma.apiKey.update({
        where: { id: key.id },
        data: { status: 'EXPIRED' },
      });
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      userId: key.userId,
      organizationId: key.organizationId,
      scopes: key.scopes,
      user: key.user,
    };
  }

  async revoke(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
    if (!key) throw new NotFoundException('API Key not found');

    return this.prisma.apiKey.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
