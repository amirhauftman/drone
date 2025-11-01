import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TelemetryService } from './telemetry.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private telemetryService: TelemetryService) {
        console.log('TelemetryGateway initialized');
        this.startBroadcast();
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        this.telemetryService.start();
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        if (this.server.engine.clientsCount === 0) {
            console.log('No clients connected, stopping telemetry');
            this.telemetryService.stop();
        }
    }

    private startBroadcast() {
        setInterval(() => {
            const data = this.telemetryService.getCurrent();
            this.server.emit('telemetry', data);
        }, 100);
    }
}