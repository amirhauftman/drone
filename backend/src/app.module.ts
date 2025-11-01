import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatusController } from './status/status.controller';
import { TelemetryService } from './telemetry/telemetry.service';
import { TelemetryGateway } from './telemetry/telemetry.gateway';

@Module({
  imports: [],
  controllers: [AppController, StatusController],
  providers: [AppService, TelemetryService, TelemetryGateway],
})
export class AppModule {}