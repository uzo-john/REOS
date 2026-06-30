import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { GridService } from './grid.service';
import { ConfigureGridDto } from './dto/configure-grid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('grid')
@UseGuards(JwtAuthGuard)
export class GridController {
  constructor(private readonly gridService: GridService) {}

  @Post('configure')
  @HttpCode(HttpStatus.OK)
  configureGrid(@GetUser('id') userId: string, @Body() dto: ConfigureGridDto) {
    return this.gridService.configureGrid(userId, dto);
  }

  @Post('billing')
  @HttpCode(HttpStatus.OK)
  calculateBilling(
    @GetUser('id') userId: string,
    @Body() body: {
      projectId: string;
      importedKwh: number;
      exportedKwh: number;
      importRate: number;
      exportRate: number;
    }
  ) {
    return this.gridService.calculateBilling(
      userId,
      body.projectId,
      body.importedKwh,
      body.exportedKwh,
      body.importRate,
      body.exportRate
    );
  }
}
