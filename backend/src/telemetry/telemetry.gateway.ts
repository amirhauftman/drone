import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TelemetryService } from './telemetry.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger = new Logger('TelemetryGateway');
    public connections = 0;

    constructor(private readonly telemetry: TelemetryService) { }

    handleConnection(client: Socket) {
        this.connections++;
        this.logger.log(`Client connected: ${client.id} (total: ${this.connections})`);
        this.broadcastConnectionCount();
        if (this.connections === 1) {
            this.telemetry.start(100); // 10ms bonus
            this.startBroadcast();
        }
    }

    handleDisconnect(client: Socket) {
        this.connections--;
        this.logger.log(`Client disconnected: ${client.id} (remaining: ${this.connections})`);
        this.broadcastConnectionCount();
        if (this.connections === 0) {
            this.telemetry.stop();
        }
    }

    @SubscribeMessage('restartBattery')
    handleRestartBattery() {
        this.telemetry.restartBattery();
        this.server.emit('telemetryUpdate', this.telemetry.getCurrent());
    }

    private broadcastConnectionCount() {
        this.server.emit('connectionCount', this.connections);
    }

    private startBroadcast() {
        const interval = setInterval(() => {
            if (this.connections === 0) { // server stay alive but stops the simulation
                clearInterval(interval);
                return;
            }
            const data = this.telemetry.getCurrent();
            this.server.emit('telemetryUpdate', data); // send data to the client
            if (data.isCritical) {
                this.server.emit('batteryCritical');
            }
        }, 100); // 10ms bonus
    }
}