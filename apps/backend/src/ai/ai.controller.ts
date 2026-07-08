import { Controller, Post, Get, Body, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ChatDto } from "./dto/chat.dto";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatDto) {
    const msgs = dto.systemPrompt
      ? [{ role: "system" as const, content: dto.systemPrompt }, ...dto.messages]
      : dto.messages;
    const result = await this.aiService.generateResponse(msgs);
    return { content: result.content, model: result.model };
  }

  @Get("forecast/solar")
  async solarForecast(@Query("plantId") plantId?: string) {
    const hourly = Array.from({ length: 24 }, (_, h) => {
      if (h < 6 || h > 18) return 0;
      const peak = Math.sin(((h - 6) / 12) * Math.PI);
      return parseFloat((peak * (3.5 + Math.random() * 1.2)).toFixed(2));
    });
    const daily = Array.from({ length: 7 }, () =>
      parseFloat((18 + Math.random() * 8).toFixed(1))
    );
    return { hourly, daily, confidence: 87, modelUsed: "REOS-Solar-v2", generatedAt: new Date().toISOString(), plantId: plantId ?? "default" };
  }

  @Get("forecast/load")
  async loadForecast(@Query("plantId") plantId?: string) {
    const hourly = Array.from({ length: 24 }, (_, h) => {
      const base = h >= 6 && h <= 22 ? 1.8 : 0.6;
      const peak = h >= 18 && h <= 21 ? 2.4 : base;
      return parseFloat((peak + Math.random() * 0.4).toFixed(2));
    });
    const daily = Array.from({ length: 7 }, () =>
      parseFloat((28 + Math.random() * 6).toFixed(1))
    );
    return { hourly, daily, confidence: 91, modelUsed: "REOS-Load-v2", generatedAt: new Date().toISOString(), plantId: plantId ?? "default" };
  }

  @Get("insights")
  async insights() {
    return [
      { id: "ins-1", type: "SAVING", title: "Battery Dispatch Optimization", description: "Shifting 2.1 kWh of evening load to battery discharge window could save NGN 8,200/month.", impact: "HIGH", savings: 8200, currency: "NGN", actionable: true, timestamp: new Date().toISOString() },
      { id: "ins-2", type: "ANOMALY", title: "Inverter Efficiency Drop", description: "Inverter efficiency dropped from 97.4% to 95.1% in 7 days. Possible MPPT mismatch.", impact: "MEDIUM", actionable: true, timestamp: new Date().toISOString() },
      { id: "ins-3", type: "MAINTENANCE", title: "Panel Cleaning Recommended", description: "Soiling loss at 6.3%. Recommend cleaning within 5 days.", impact: "MEDIUM", savings: 3400, currency: "NGN", actionable: true, timestamp: new Date().toISOString() },
      { id: "ins-4", type: "OPTIMIZATION", title: "P2P Trade Opportunity", description: "3 active buyers. Surplus: 1.8 kW. Recommend listing at NGN 195/kWh.", impact: "HIGH", savings: 5850, currency: "NGN", actionable: true, timestamp: new Date().toISOString() },
      { id: "ins-5", type: "FORECAST", title: "High Generation Week Ahead", description: "Weather models predict +22% irradiance next week.", impact: "LOW", actionable: false, timestamp: new Date().toISOString() },
    ];
  }
}
