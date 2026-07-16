import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('consumer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @Post('invite')
  @Roles(
    UserRole.SYSTEM_OWNER,
    UserRole.ENGINEER,
    UserRole.ADMIN,
    UserRole.CUSTOMER,
  ) // Keep CUSTOMER for backward compatibility
  createInvitation(
    @GetUser('id') supplierId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.consumerService.createInvitation(supplierId, dto);
  }

  @Get('invitation/:code')
  @Roles(
    UserRole.SYSTEM_OWNER,
    UserRole.CONSUMER,
    UserRole.CUSTOMER,
    UserRole.ENGINEER,
    UserRole.ADMIN,
  )
  getInvitation(@Param('code') code: string) {
    return this.consumerService.getInvitation(code);
  }

  @Post('accept')
  @Roles(UserRole.CONSUMER, UserRole.CUSTOMER)
  acceptInvitation(
    @GetUser('id') consumerId: string,
    @Body('invitationCode') code: string,
  ) {
    return this.consumerService.acceptInvitation(consumerId, code);
  }

  @Get('contract')
  getActiveContract(@GetUser('id') userId: string) {
    return this.consumerService.getActiveContract(userId);
  }

  @Get('billing')
  @Roles(UserRole.CONSUMER, UserRole.CUSTOMER)
  getBillingSummary(@GetUser('id') consumerId: string) {
    return this.consumerService.getBillingSummary(consumerId);
  }

  @Post('topup')
  @Roles(UserRole.CONSUMER, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  topUpWallet(
    @GetUser('id') consumerId: string,
    @Body('amount') amount: number,
    @Body('paymentGateway') gateway: string,
  ) {
    return this.consumerService.topUpWallet(
      consumerId,
      amount,
      gateway || 'PAYSTACK',
    );
  }

  @Post('pay-invoice/:invoiceId')
  @Roles(UserRole.CONSUMER, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  payInvoice(
    @GetUser('id') consumerId: string,
    @Param('invoiceId') invoiceId: string,
    @Body('paymentGateway') gateway: string,
  ) {
    return this.consumerService.payInvoice(
      consumerId,
      invoiceId,
      gateway || 'PAYSTACK',
    );
  }

  @Get('notifications')
  getNotifications(@GetUser('id') userId: string) {
    return this.consumerService.getNotifications(userId);
  }

  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  readNotification(@Param('id') id: string) {
    return this.consumerService.acknowledgeNotification(id);
  }
}
