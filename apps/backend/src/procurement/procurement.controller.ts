import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('products')
  getProducts() {
    return this.procurementService.getProducts();
  }

  @Get('installers')
  getInstallers() {
    return this.procurementService.getInstallers();
  }

  @Post('quotation')
  @HttpCode(HttpStatus.OK)
  generateQuotation(
    @GetUser('id') userId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.procurementService.generateQuotation(userId, dto);
  }
}
