import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry/telemetry.service';
import { TelemetryGateway } from './telemetry/telemetry.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [TelemetryService, TelemetryGateway],
})
export class AppModule { }