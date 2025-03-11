import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '../../app-routing.module';
import { CamViewerComponent } from '../cam-viewer/cam-viewer.component';
import { HttpConfigService } from '../../services/http-config.service';
import { WebSocketService } from '../../services/web-socket.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sidebar-controls',
  templateUrl: './sidebar-controls.component.html',
  styleUrls: ['./sidebar-controls.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    MatSlideToggleModule,
    BrowserAnimationsModule,
    FormsModule,
    MatIconModule,
    MatSidenavModule,
    MatExpansionModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatButtonModule,]
})
export class SidebarControlsComponent implements OnInit {
  deviceProfileCollapsed = true;
  // Module toggles
  depthModuleEnabled = false;
  rgbCameraEnabled = false;

  // Metadata toggles
  depthMetadataEnabled = false;
  rgbMetadataEnabled = false;

  // Resolutions
  selectedDepthResolution = '640x360';
  selectedDepthFrameRate = '30';
  selectedRGBResolution = '640x360';
  selectedRGBFrameRate = '30';

  // Exposures
  depthExposureValue = 1000;
  rgbExposureValue = 1000;

  // Camera info variables
  cameraName: string = '';
  cameraSerial: string = '';
  cameraFirmware: string = '';
  cameraUsb: string = '';

  show3D = false;

  // Outputs for toggles
  @Output() depthToggleChange = new EventEmitter<boolean>();
  @Output() rgbToggleChange = new EventEmitter<boolean>();
  @Output() depthResolutionChange = new EventEmitter<{ resolution: string; frameRate: string }>();
  @Output() rgbResolutionChange = new EventEmitter<{ resolution: string; frameRate: string }>();
  @Output() depthExposureChange = new EventEmitter<number>();
  @Output() rgbExposureChange = new EventEmitter<number>();
  // NEW events for metadata
  @Output() depthMetadataToggle = new EventEmitter<boolean>();
  @Output() rgbMetadataToggle = new EventEmitter<boolean>();
  @Output() threeDToggleChange = new EventEmitter<boolean>();

  constructor(
    private httpConfigService: HttpConfigService, private webSocketService: WebSocketService, private http: HttpClient
  ) { }

  startViewer() {
    this.http.post('/api/start_viewer', {}).subscribe(
      response => {
        console.log("Viewer started successfully:", response);
      },
      error => {
        console.error("Error starting viewer:", error);
      }
    );
  }

  ngOnInit() {
    this.loadDefaultsFromServer();
    this.loadCameraInfo();
  }

  private loadDefaultsFromServer() {
    this.httpConfigService.getDefaults().subscribe({
      next: (defaults) => {
        // E.g., store them in a local variable if needed
        // Or you can set your UI to these defaults immediately
        console.log('[SidebarControls] Received defaults:', defaults);

        this.selectedDepthResolution = `${defaults.depth.width}x${defaults.depth.height}`;
        this.selectedDepthFrameRate = defaults.depth.fps.toString();
        this.selectedRGBResolution = `${defaults.color.width}x${defaults.color.height}`;
        this.selectedRGBFrameRate = defaults.color.fps.toString();

        this.depthExposureValue = defaults.depth.exposure;
        this.rgbExposureValue = defaults.color.exposure;

        // ...any other UI toggles you want to set...
      },
      error: err => console.error('Error loading defaults:', err)
    });
  }

  loadCameraInfo() {
    this.httpConfigService.getCameraInfo().subscribe({
      next: (info) => {
        this.cameraName = info.name || '';
        this.cameraSerial = info.serial_number || '';
        this.cameraFirmware = info.firmware_version || '';
        this.cameraUsb = info.usb_type_descriptor || '';
      },
      error: (err) => {
        console.error('Error fetching camera info:', err);
      }
    });
  }

  // Depth module toggled
  onDepthToggle(newValue: boolean) {
    console.log('Depth Module toggled to:', newValue);
    this.depthToggleChange.emit(newValue);

    // If turned OFF, also turn OFF depth metadata if it's on
    if (!newValue && this.depthMetadataEnabled) {
      this.depthMetadataEnabled = false; // visually set toggle to off
      this.depthMetadataToggle.emit(false); // notify the parent
    }
  }
  // RGB module toggled
  onRgbToggle(newValue: boolean) {
    console.log('RGB Camera toggled to:', newValue);
    this.rgbToggleChange.emit(newValue);

    // If turned OFF, also turn OFF rgb metadata if it's on
    if (!newValue && this.rgbMetadataEnabled) {
      this.rgbMetadataEnabled = false;            // visually set toggle to off
      this.rgbMetadataToggle.emit(false);         // notify the parent
    }
  }
  // 3D Viewer toggled
  on3DToggle(newValue: boolean) {
    console.log('3D Viewer toggled to:', newValue);
    this.threeDToggleChange.emit(newValue);
    this.show3D = newValue;
  }

  toggleDeviceProfile() {
    this.deviceProfileCollapsed = !this.deviceProfileCollapsed;
    this.loadCameraInfo();
  }
  onDepthMetadataToggle(newValue: boolean) {
    this.httpConfigService.setMetadata('depth', newValue).subscribe({
      next: () => this.depthMetadataToggle.emit(newValue),
      error: (err) => console.error('Failed to set depth metadata', err)
    });
  }

  onRgbMetadataToggle(newValue: boolean) {
    this.httpConfigService.setMetadata('rgb', newValue).subscribe({
      next: () => this.rgbMetadataToggle.emit(newValue),
      error: (err) => console.error('Failed to set RGB metadata', err)
    });
  }

  // Depth resolution/fps
  onDepthResolutionChange() {
    this.depthResolutionChange.emit({
      resolution: this.selectedDepthResolution,
      frameRate: this.selectedDepthFrameRate
    });
  }

  // RGB resolution/fps
  onRgbResolutionChange() {
    this.rgbResolutionChange.emit({
      resolution: this.selectedRGBResolution,
      frameRate: this.selectedRGBFrameRate
    });
  }

  // Depth exposure
  onDepthExposureChange() {
    this.depthExposureChange.emit(this.depthExposureValue);
  }

  // RGB exposure
  onRgbExposureChange() {
    this.rgbExposureChange.emit(this.rgbExposureValue);
  }

  // sidebar-controls.component.ts (excerpt)
  // Update onHardReset() method
  // Update onHardReset
  onHardReset() {
    if (!confirm('Hard reset will restore all defaults. Continue?')) return;

    // Force full disconnection
    // this.webSocketService.forceDisconnect();
    // this.httpConfigService.setMetadata('depth', false).subscribe();
    // this.httpConfigService.setMetadata('rgb', false).subscribe();
    // Reset all UI components
    this.depthModuleEnabled = false;
    this.rgbCameraEnabled = false;
    this.depthMetadataEnabled = false;
    this.rgbMetadataEnabled = false;
    this.deviceProfileCollapsed = true;
    // Emit changes
    this.depthToggleChange.emit(false);
    this.rgbToggleChange.emit(false);
    this.depthMetadataToggle.emit(false);
    this.rgbMetadataToggle.emit(false);

    // Server-side reset with delay
    this.httpConfigService.hardReset().subscribe({
      next: () => {
        this.loadDefaultsFromServer();
        this.loadCameraInfo();
        this.webSocketService.startStream();
      },
      error: (err) => console.error('Hard reset failed:', err)
    });
  }

}
