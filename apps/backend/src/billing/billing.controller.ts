import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { GenerateBillDto, PayBillDto } from './dto/billing.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Billing & Invoicing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post('invoice')
  @ApiOperation({
    summary: 'Generate a new utility/microgrid bill for a user (Admin/Utility)',
  })
  @Roles('ADMIN', 'SUPER_ADMIN', 'UTILITY_PROVIDER')
  generateInvoice(
    @Body() dto: GenerateBillDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.generateBill(dto, userId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get list of bills with filters' })
  getInvoices(
    @Query() pagination: PaginationDto,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getBills(pagination, userId, status);
  }

  @Get('invoices/my')
  @ApiOperation({ summary: 'Get current user bills' })
  getMyInvoices(
    @Query() pagination: PaginationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.getBills(pagination, userId);
  }

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Get detailed invoice metadata' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('invoice/:id/pay/wallet')
  @ApiOperation({
    summary: 'Pay utility invoice instantly using energy wallet balance',
  })
  payWithWallet(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.payBillWithWallet(id, userId);
  }

  @Post('invoice/:id/pay/gateway')
  @ApiOperation({
    summary: 'Log external gateway payment confirmation (Paystack/Flutterwave)',
  })
  payWithGateway(
    @Param('id') id: string,
    @Body() dto: PayBillDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.recordGatewayPayment(id, userId, dto);
  }
}
