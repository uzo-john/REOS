import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CalculateRoiDto } from './dto/calculate-roi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('roi')
  @HttpCode(HttpStatus.OK)
  calculateRoi(@GetUser('id') userId: string, @Body() dto: CalculateRoiDto) {
    return this.financialService.calculateAndSaveRoi(userId, dto);
  }
}
