import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RequestReportDto } from './dto/reports.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytical Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request analytical report compilation' })
  request(@Body() dto: RequestReportDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List generated reports' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('orgId') orgId?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.findAll(pagination, userId, orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single report generation status and URL' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a report entry' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
