import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private disconnectReason = new BehaviorSubject<string>('');

  constructor(private errorService: ErrorService) {
    this.initSocket();
  }
  getOpenGLStream(): Observable<any> {
      return new Observable(observer => {
        this.socket.on('opengl_frame', (frame) => {
          observer.next(frame);
        });

        return () => this.socket.off('opengl_frame');
      });
    }

  stopStreamServerSide() {
    this.socket.emit('stop_stream');
  }

  private initSocket() {
    this.socket = io(environment.baseUrl, {
      reconnectionAttempts: 3,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionStatus.next(true);
      this.disconnectReason.next('');
    });

    this.socket.io.on('error', (error: any) => {
      console.log(`Connection error: ${error}`);
      this.errorService.addError('Server connection failed');
      this.connectionStatus.next(false);
      this.disconnectReason.next('Server unreachable');
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('Socket disconnected:', reason);
      this.connectionStatus.next(false);
      this.disconnectReason.next(reason);
    });

    this.socket.on('device_status', (status: { connected: boolean; reason?: string }) => {
      this.connectionStatus.next(status.connected);
      if (!status.connected && status.reason) {
        this.disconnectReason.next(status.reason);
        this.errorService.addError('Server connection failed');
      } else {
        this.disconnectReason.next('');
      }
    });
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  getDisconnectReason(): Observable<string> {
    return this.disconnectReason.asObservable();
  }

  public startStream(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.emit('start_stream');
  }

  getVideoStream(): Observable<{
    color: string;
    depth: string;
    D3: string;
    metadata?: {
      rgb?: string[];
      depth?: string[];
    };
  }> {
    return new Observable(observer => {
      this.socket.on('video_frame', (frame) => {
        observer.next(frame);
      });

      return () => {
        // This code runs on unsubscribe
      };
    });
  }

  sendConfigurationUpdate(module: string, resolution: string, frameRate: string): void {
    this.socket.emit('update_configuration', { module, resolution, frameRate });
  }

  disconnect() {
    this.socket.disconnect();
    this.socket.removeAllListeners();
  }

  public forceDisconnect() {
    this.socket.disconnect();
    this.socket.removeAllListeners();
    this.connectionStatus.next(false);
    this.disconnectReason.next('manual_reset');
  }

  start3DStream(): void {
    this.socket.emit('start_3d_stream');
  }

  stop3DStream(): void {
    this.socket.emit('stop_3d_stream');
  }
}
