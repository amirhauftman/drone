import { Injectable } from '@nestjs/common';

export interface Telemetry {
    yaw: number;
    x: number;
    y: number;
    altitude: number;
    batteryVoltage: number;
    timestamp: number;
    isCritical: boolean;
}

@Injectable()
export class TelemetryService {
    private state: Telemetry = {
        yaw: 0,
        x: 0,
        y: 0,
        altitude: 0,
        batteryVoltage: 100,
        timestamp: Date.now(),
        isCritical: false,
    };

    private targets = { ...this.state };
    private interval: NodeJS.Timeout;

    start(intervalMs = 100) {
        this.chooseNewTargets();
        this.interval = setInterval(() => {
            this.updateState(intervalMs / 1000);
            this.state.timestamp = Date.now();
        }, intervalMs);
    }

    stop() {
        clearInterval(this.interval);
    }

    getCurrent() {
        return this.state;
    }

    restartBattery() {
        this.state.batteryVoltage = 100;
        this.state.isCritical = false;
        console.log('Battery restarted to 100%');
    }

    private chooseNewTargets() {
        this.targets.yaw = randomInRange(-180, 180);
        this.targets.x = randomInRange(-7.5, 12);
        this.targets.y = randomInRange(-12, 9);
        this.targets.altitude = randomInRange(0, 20);
    }

    private updateState(dt: number) {
        if (this.state.isCritical) return;

        this.state.yaw = moveTowards(this.state.yaw, this.targets.yaw, 1 * dt);
        this.state.x = moveTowards(this.state.x, this.targets.x, 1 * dt);
        this.state.y = moveTowards(this.state.y, this.targets.y, 1 * dt);
        this.state.altitude = moveTowards(this.state.altitude, this.targets.altitude, 0.8 * dt);

        this.state.batteryVoltage = Math.max(0, this.state.batteryVoltage - 1 * dt);

        if (this.state.batteryVoltage <= 1) {
            this.state.isCritical = true;
            console.log('BATTERY CRITICAL: 1% reached. Simulation paused.');
        }

        if (
            Math.abs(this.state.yaw - this.targets.yaw) < 0.1 &&
            Math.abs(this.state.x - this.targets.x) < 0.1 &&
            Math.abs(this.state.y - this.targets.y) < 0.1 &&
            Math.abs(this.state.altitude - this.targets.altitude) < 0.1
        ) {
            this.chooseNewTargets();
        }

        if (Math.random() < 0.05) {
            this.state.yaw += gaussianNoise(0, 15);
            this.state.x += gaussianNoise(0, 3);
            this.state.y += gaussianNoise(0, 3);
            this.state.altitude += gaussianNoise(0, 5);
            this.state.yaw = clamp(this.state.yaw, -180, 180);
            this.state.x = clamp(this.state.x, -7.5, 12);
            this.state.y = clamp(this.state.y, -12, 9);
            this.state.altitude = clamp(this.state.altitude, 0, 20);
            console.log('Noisy data injected & clamped');
        }
    }
}

function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
function moveTowards(current: number, target: number, maxDelta: number) {
    const diff = target - current;
    if (Math.abs(diff) <= maxDelta) return target;
    return current + Math.sign(diff) * maxDelta;
}
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
function gaussianNoise(mean: number, stdDev: number) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * stdDev + mean;
}