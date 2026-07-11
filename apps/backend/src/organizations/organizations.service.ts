import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
} from './dto/organization.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery, buildSearchFilter } from '../common/utils/pagination.util';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, createdBy: string) {
    const code = `ORG-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.organization.create({
      data: { ...dto, code, createdBy },
    });
  }

  async findAll(pagination: PaginationDto, type?: string) {
    const query = buildPaginationQuery(pagination);
    const searchFilter = buildSearchFilter(['name', 'email', 'code'], pagination.search);

    const where: any = {
      deletedAt: null,
      ...(type && { type: type as any }),
      ...(searchFilter ?? {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        ...query,
        include: { _count: { select: { members: true, plants: true } } },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        },
        plants: { where: { deletedAt: null } },
        _count: { select: { members: true, plants: true, apiKeys: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DECOMMISSIONED' },
    });
  }

  async addMember(orgId: string, dto: AddMemberDto) {
    const org = await this.findOne(orgId);
    const existing = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: dto.userId } },
    });
    if (existing) throw new ConflictException('User is already a member of this organization');
    return this.prisma.organizationMember.create({
      data: { organizationId: orgId, userId: dto.userId, role: dto.role ?? 'MEMBER' },
    });
  }

  async removeMember(orgId: string, userId: string, requesterId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.userId === requesterId) throw new ForbiddenException('Cannot remove yourself');
    return this.prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }

  async getUserOrganizations(userId: string) {
    return this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: { id: true, name: true, type: true, status: true, code: true, logoUrl: true },
        },
      },
    });
  }
}
