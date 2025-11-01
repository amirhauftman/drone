import { Controller, Get } from '@nestjs/common';
import { TelemetryService } from '../telemetry/telemetry.service';

@Controller('status')
export class StatusController {
    constructor(private telemetryService: TelemetryService) {}

    @Get()
    getStatus() {
        return this.telemetryService.getCurrent();
    }
}