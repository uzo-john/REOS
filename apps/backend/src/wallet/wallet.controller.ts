import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  CreateWalletDto,
  TopUpWalletDto,
  TransferFundsDto,
  BuyEnergyDto,
  VerifyEscrowDto,
  RequestWithdrawalDto,
  ProcessWithdrawalDto,
  RequestRefundDto,
  OpenDisputeDto,
  ResolveDisputeDto,
  DisputeMessageDto,
} from './dto/wallet.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Energy Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  // ── Wallet CRUD ──────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create or return an existing energy wallet' })
  create(@Body() dto: CreateWalletDto, @CurrentUser('id') userId: string) {
    if (!dto.userId && !dto.organizationId) dto.userId = userId;
    return this.service.create(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user wallets' })
  getMyWallets(@CurrentUser('id') userId: string) {
    return this.service.findByOwner(userId);
  }

  @Get('dashboard/consumer')
  @ApiOperation({
    summary: 'Consumer wallet dashboard (balance, escrow, history)',
  })
  consumerDashboard(@CurrentUser('id') userId: string) {
    return this.service.getConsumerDashboard(userId);
  }

  @Get('dashboard/plant-owner')
  @ApiOperation({
    summary:
      'Plant owner wallet dashboard (earnings, settlements, withdrawals)',
  })
  plantOwnerDashboard(@CurrentUser('id') userId: string) {
    return this.service.getPlantOwnerDashboard(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet details & balances' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/topup')
  @ApiOperation({ summary: 'Top up wallet balance (₦500 minimum)' })
  topUp(
    @Param('id') id: string,
    @Body() dto: TopUpWalletDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.topUp(id, dto, userId);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer funds between wallets' })
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

  // ── Energy Purchase (Escrow) ─────────────────────────────────────────────

  @Post('buy-energy')
  @ApiOperation({
    summary:
      'Buy energy from P2P marketplace — funds go to escrow (includes ₦500 platform fee)',
  })
  buyEnergy(@CurrentUser('id') buyerId: string, @Body() dto: BuyEnergyDto) {
    return this.service.buyEnergy(buyerId, dto);
  }

  @Post('escrow/:escrowId/verify')
  @ApiOperation({
    summary: 'Verify energy delivery and release escrow to seller',
  })
  verifyEscrow(
    @Param('escrowId') escrowId: string,
    @Body() dto: VerifyEscrowDto,
  ) {
    return this.service.verifyAndRelease(escrowId, dto);
  }

  @Get('escrow/all')
  @ApiOperation({ summary: 'Admin: list all escrow transactions' })
  @ApiQuery({ name: 'status', required: false })
  getAllEscrow(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.service.getAllEscrow(pagination, status);
  }

  // ── Refunds ──────────────────────────────────────────────────────────────

  @Post('escrow/:escrowId/refund')
  @ApiOperation({ summary: 'Request a refund for an escrow transaction' })
  requestRefund(
    @Param('escrowId') escrowId: string,
    @CurrentUser('id') buyerId: string,
    @Body() dto: RequestRefundDto,
  ) {
    return this.service.requestRefund(escrowId, buyerId, dto);
  }

  @Post('refunds/:refundId/process')
  @ApiOperation({ summary: 'Admin: approve or reject a refund' })
  processRefund(
    @Param('refundId') refundId: string,
    @CurrentUser('id') adminId: string,
    @Query('approve') approve: string,
  ) {
    return this.service.processRefund(refundId, adminId, approve === 'true');
  }

  // ── Withdrawals ──────────────────────────────────────────────────────────

  @Post('withdraw')
  @ApiOperation({ summary: 'Request a withdrawal (plant owners)' })
  requestWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.service.requestWithdrawal(userId, dto);
  }

  @Post('withdrawals/:id/process')
  @ApiOperation({ summary: 'Admin: approve or reject a withdrawal' })
  processWithdrawal(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    return this.service.processWithdrawal(id, adminId, dto);
  }

  @Get('withdrawals/all')
  @ApiOperation({ summary: 'Admin: list all withdrawals' })
  @ApiQuery({ name: 'status', required: false })
  getAllWithdrawals(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.service.getAllWithdrawals(pagination, status);
  }

  // ── Disputes ─────────────────────────────────────────────────────────────

  @Post('escrow/:escrowId/dispute')
  @ApiOperation({ summary: 'Open a dispute for an escrow transaction' })
  openDispute(
    @Param('escrowId') escrowId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.service.openDispute(escrowId, userId, dto);
  }

  @Post('disputes/:disputeId/message')
  @ApiOperation({ summary: 'Add a message to a dispute thread' })
  addDisputeMessage(
    @Param('disputeId') disputeId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: DisputeMessageDto,
  ) {
    return this.service.addDisputeMessage(disputeId, userId, dto);
  }

  @Post('disputes/:disputeId/resolve')
  @ApiOperation({ summary: 'Admin: resolve a dispute' })
  resolveDispute(
    @Param('disputeId') disputeId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.service.resolveDispute(disputeId, adminId, dto);
  }

  @Get('disputes/all')
  @ApiOperation({ summary: 'Admin: list all disputes' })
  @ApiQuery({ name: 'status', required: false })
  getAllDisputes(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.service.getAllDisputes(pagination, status);
  }

  // ── Admin Finance Overview ───────────────────────────────────────────────

  @Get('admin/finance')
  @ApiOperation({ summary: 'Admin: complete finance overview dashboard' })
  adminFinanceOverview() {
    return this.service.getAdminFinanceOverview();
  }
}
