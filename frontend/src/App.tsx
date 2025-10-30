import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

interface Telemetry {
  yaw: number;
  x: number;
  y: number;
  altitude: number;
  batteryVoltage: number;
  timestamp: number;
  isCritical: boolean;
}

const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
});

function App() {
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<Telemetry | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [connectionCount, setConnectionCount] = useState<number>(1);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('telemetryUpdate', (payload: Telemetry) => {
      setData(payload);
      setLatency(Date.now() - payload.timestamp);
    });
    socket.on('batteryCritical', () => {
      setShowAlert(true);
    });
    socket.on('connectionCount', (count: number) => {
      setConnectionCount(count);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetryUpdate');
      socket.off('batteryCritical');
      socket.off('connectionCount');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Drone Telemetry Dashboard</h1>
        <div className={`inline-block px-3 py-1 rounded mt-2 ${connected ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {connected ? 'Connected' : 'Disconnected – reconnecting…'}
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Connected Clients: <span className="font-bold text-green-400">{connectionCount}</span>
        </div>
      </header>

      {data && (
        <main className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Card title="Yaw" value={`${data.yaw.toFixed(2)}°`} />
          <Card title="X" value={`${data.x.toFixed(2)} m`} />
          <Card title="Y" value={`${data.y.toFixed(2)} m`} />
          <Card title="Altitude" value={`${data.altitude.toFixed(2)} m`} />
          <div className="md:col-span-2">
            <Card title="Battery" value={`${data.batteryVoltage.toFixed(1)} %`}>
              <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${data.batteryVoltage > 50
                      ? 'bg-green-500'
                      : data.batteryVoltage > 20
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  style={{ width: `${data.batteryVoltage}%` }}
                />
              </div>
            </Card>
          </div>
        </main>
      )}

      {latency !== null && (
        <footer className="mt-8 text-sm text-gray-400">
          Latency: {latency} ms
        </footer>
      )}

      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-red-800 p-6 rounded-lg text-center max-w-sm">
            <h2 className="text-2xl mb-4">BATTERY CRITICAL!</h2>
            <p className="mb-4">Battery at 1%. Simulation paused.</p>
            <button
              onClick={() => {
                socket.emit('restartBattery');
                setShowAlert(false);
              }}
              className="bg-green-600 px-6 py-2 rounded hover:bg-green-700"
            >
              Restart Battery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Card: React.FC<{ title: string; value: string; children?: React.ReactNode }> = ({
  title,
  value,
  children,
}) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-gray-300">{title}</h2>
    <p className="text-2xl">{value}</p>
    {children}
  </div>
);

export default App;