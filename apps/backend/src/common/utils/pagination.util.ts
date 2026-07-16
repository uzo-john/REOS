import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';

export function buildPaginationQuery(dto: PaginationDto) {
  return {
    skip: dto.skip,
    take: dto.limit ?? 20,
    orderBy: {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder ?? 'desc',
    },
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResponseDto<T> {
  return new PaginatedResponseDto<T>(
    data,
    total,
    dto.page ?? 1,
    dto.limit ?? 20,
  );
}

export function buildSearchFilter(
  fields: string[],
  search?: string,
): object | undefined {
  if (!search) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    })),
  };
}
