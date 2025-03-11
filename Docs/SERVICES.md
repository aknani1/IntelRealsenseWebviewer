# Angular Services Documentation

## WebSocketService
Handles real-time communication with the backend.

**Properties:**
```typescript
private socket: Socket;
private connectionStatus: BehaviorSubject<boolean>;
private disconnectReason: BehaviorSubject<string>;
```

**Key Methods:**
```typescript
initSocket(): void
// Initializes WebSocket connection with error handling and reconnection logic.

startStream(): void
// Sends the 'start_stream' event to request frame streaming.

stopStreamServerSide(): void
// Sends the 'stop_stream' event to request the server stops streaming.

getVideoStream(): Observable<FrameData>
// Returns an observable that emits frame data (color, depth, D3, metadata).

getConnectionStatus(): Observable<boolean>
// Provides an observable for the current connection status.

getDisconnectReason(): Observable<string>
// Provides an observable for any disconnection reason.

forceDisconnect(): void
// Forces the WebSocket connection to close and performs cleanup.
```

---

## HttpConfigService
Manages HTTP-based configuration and control of the camera.

**Key Methods:**
```typescript
updateConfiguration(module: string, resolution: string, frameRate: string): Observable<any>
// Sends a POST request to update the stream configuration.

updateExposure(module: string, exposureValue: number): Observable<any>
// Sends a POST request to change the exposure settings.

setMetadata(module: string, state: boolean): Observable<any>
// Sends a POST request to toggle metadata overlay on/off.

getCameraInfo(): Observable<any>
// Retrieves camera information from the server.

hardReset(): Observable<any>
// Sends a POST request to perform a full hardware reset.

show3D(show3D: boolean): Observable<any>
// Sends a POST request to toggle 3D visualization.
```

