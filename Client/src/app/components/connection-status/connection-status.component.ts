// connection-status.component.ts
import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/web-socket.service';

@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss'],
  standalone: true
})
export class ConnectionStatusComponent implements OnInit {
  deviceConnected = false;
  reason = '';

  constructor(private wsService: WebSocketService) {}

  ngOnInit() {
    this.wsService.getConnectionStatus().subscribe(connected => {
      this.deviceConnected = connected;
    });
    this.wsService.getDisconnectReason().subscribe(reason => {
      this.reason = reason;
    });
  }

  getStatusText(): string {
    if (this.deviceConnected) {
      return 'Connected';
    }

    // Handle different reason messages
    switch (this.reason) {
      case 'camera_disconnected':
        return 'Camera Disconnected';
      case 'transport close':
      case 'ping timeout':
      case 'Server unreachable':
        return 'Server Unreachable';
      default:
        return 'Disconnected';
    }
  }
}
