import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateWalletDto, TopUpWalletDto, TransferFundsDto } from './dto/wallet.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Energy Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create or return an existing energy wallet' })
  create(@Body() dto: CreateWalletDto, @CurrentUser('id') userId: string) {
    if (!dto.userId && !dto.organizationId) {
      dto.userId = userId;
    }
    return this.service.create(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user wallets' })
  getMyWallets(@CurrentUser('id') userId: string) {
    return this.service.findByOwner(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet details & balances' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/topup')
  @ApiOperation({ summary: 'Top up wallet balance' })
  topUp(
    @Param('id') id: string,
    @Body() dto: TopUpWalletDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.topUp(id, dto, userId);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer funds to another wallet (P2P/Utility bill pay)' })
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferFundsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.transfer(id, dto, userId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  getTransactions(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.service.getTransactions(id, pagination);
  }
}
