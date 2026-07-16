import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import {
  CreateP2PSessionDto,
  BuyEnergyDto,
  CreateOrderDto,
} from './dto/trading.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('P2P Energy Trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private readonly service: TradingService) {}

  @Post('session')
  @ApiOperation({
    summary: 'Open a P2P energy seller session (List surplus solar)',
  })
  createSession(
    @Body() dto: CreateP2PSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.createP2PSession(userId, dto);
  }

  @Post('session/:id/buy')
  @ApiOperation({ summary: 'Purchase energy from an active session' })
  purchaseSession(
    @Param('id') sessionId: string,
    @Body() dto: BuyEnergyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.purchaseP2PEnergy(sessionId, userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get active P2P energy listings' })
  getSessions(
    @Query() pagination: PaginationDto,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const active = activeOnly !== 'false';
    return this.service.listP2PSessions(pagination, active);
  }

  @Post('order')
  @ApiOperation({ summary: 'Create limit buy or sell order in the order book' })
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.service.createLimitOrder(userId, dto);
  }

  @Delete('order/:id')
  @ApiOperation({ summary: 'Cancel limit order' })
  cancelOrder(@Param('id') orderId: string, @CurrentUser('id') userId: string) {
    return this.service.cancelLimitOrder(orderId, userId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get standard open orders book' })
  getOrderBook(@Query() pagination: PaginationDto) {
    return this.service.getOrderBook(pagination);
  }
}
