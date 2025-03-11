import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/web-socket.service';
import { HttpConfigService } from '../../services/http-config.service';
import { SidebarControlsComponent } from '../sidebar-controls/sidebar-controls.component';
import { CamStreamsComponent } from '../cam-streams/cam-streams.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';

import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '../../app-routing.module';
import { ConnectionStatusComponent } from '../connection-status/connection-status.component';
import { distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-cam-viewer',
  templateUrl: './cam-viewer.component.html',
  styleUrls: ['./cam-viewer.component.scss'],
  standalone: true,
  imports: [SidebarControlsComponent,CamStreamsComponent,ConnectionStatusComponent,    BrowserModule,
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
      MatButtonModule,
      MatToolbarModule,
      ]
})
export class CamViewerComponent implements OnInit, OnDestroy{
  // Stream toggles
  showDepth = false;
  showRGB = false;
  show3D = false;

  sidePanelOpen = true;
  isReconfiguring = false;
  public rgbMetadataLines: string[] = [];
  public depthMetadataLines: string[] = [];
  // Streamed images
  depthImageUrl: string = '';
  colorImageUrl: string = '';
  openglImageUrl: string = '';  // Store OpenGL frames
  Url3D: string = '';

  // Local copies of metadata booleans
  depthMetadataOn = false;
  rgbMetadataOn = false;
  private activeSubscriptions = new Subscription();
  private connectionSub: Subscription | null = null;

  activeButton: string = 'button1';


  constructor(
    private webSocketService: WebSocketService,
    private httpConfigService: HttpConfigService
  ) {}
  ngOnInit(): void {
    this.connectionSub = this.webSocketService.getConnectionStatus().pipe(
      distinctUntilChanged()
    ).subscribe(connected => {
      if (connected) {
        this.startStreaming();
        this.webSocketService.startStream();
      } else {
        this.stopStreaming();
        this.resetUIState();
      }
    });
  }

  ngOnDestroy() {
    this.activeSubscriptions.unsubscribe();
    if (this.connectionSub) {
        this.connectionSub.unsubscribe();
    }
  }

  private startStreaming() {
    const videoSubscription = this.webSocketService.getVideoStream().subscribe({
      next: frame => {
        // Clear previous metadata if streams are off
        this.rgbMetadataLines = frame.metadata?.rgb || [];
        this.depthMetadataLines = frame.metadata?.depth || [];

        // Update frames and metadata
        if (this.showRGB) {
          this.colorImageUrl = 'data:image/jpeg;base64,' + frame.color;
          this.rgbMetadataLines = frame.metadata?.rgb || [];
        }
        if (this.showDepth) {
          this.depthImageUrl = 'data:image/jpeg;base64,' + frame.depth;
          this.depthMetadataLines = frame.metadata?.depth || [];
        }

        if (this.show3D) {
            this.Url3D = 'data:image/jpeg;base64,' + frame.D3;
        }
      }
    });

    // Store subscription to clean up later
    this.activeSubscriptions.add(videoSubscription);
  }
  private stopStreaming() {
    this.activeSubscriptions.unsubscribe();
    this.activeSubscriptions = new Subscription();

    this.depthImageUrl = '';
    this.colorImageUrl = '';
    this.openglImageUrl = '';
    this.rgbMetadataLines = [];
    this.depthMetadataLines = [];
    this.showDepth = false;
    this.showRGB = false;
    this.show3D = false;
  }
  private resetUIState() {
    this.depthMetadataOn = false;
    this.rgbMetadataOn = false;
    this.isReconfiguring = false;
  }
  // Toggling the depth module on/off should NOT trigger reconfig overlay
  onDepthToggle(newValue: boolean) {
    this.showDepth = newValue;
    console.log('Depth Module:', newValue ? 'Enabled' : 'Disabled');
  }

  // Toggling the RGB module on/off should NOT trigger reconfig overlay
  onRgbToggle(newValue: boolean) {
    this.showRGB = newValue;
    console.log('RGB Module:', newValue ? 'Enabled' : 'Disabled');
  }

  // Update Depth configuration: this is an actual reconfig → show overlay
  updateDepthConfig(event: { resolution: string; frameRate: string }) {
    this.isReconfiguring = true;

    this.httpConfigService.updateConfiguration('depth', event.resolution, event.frameRate)
      .subscribe({
        next: () => {
          // Optionally restart the stream
          this.webSocketService.startStream();

          // Give the pipeline a second to restart, then hide overlay
          setTimeout(() => { this.isReconfiguring = false; }, 1000);
        },
        error: error => {
          this.isReconfiguring = false;
          console.error('Error updating Depth config', error);
        }
      });
  }

  // Update RGB configuration: this is an actual reconfig → show overlay
  updateRGBConfig(event: { resolution: string; frameRate: string }) {
    this.isReconfiguring = true;

    this.httpConfigService.updateConfiguration('rgb', event.resolution, event.frameRate)
      .subscribe({
        next: () => {
          this.webSocketService.startStream();
          // Hide overlay
          this.isReconfiguring = false;
        },
        error: error => {
          this.isReconfiguring = false;
          console.error('Error updating RGB config', error);
        }
      });
  }

  // Helper method to send configuration updates to the server
  private sendConfigurationUpdate(module: string, resolution: string, frameRate: string): void {
    this.httpConfigService.updateConfiguration(module, resolution, frameRate).subscribe(
      (response) => {
        console.log(`${module} Module Updated Successfully`, response);
        alert(`${module} Module Updated Successfully:\nResolution: ${resolution}\nFrame Rate: ${frameRate}`);
        this.webSocketService.startStream();
      },
      (error) => {
        console.error(`Error updating ${module} Module`, error);
        alert(`Error updating ${module} Module:\n${error.message}`);
      }
    );
  }
  updateDepthExposure(value: number) {
    console.log('Updating Depth Exposure:', value);
    this.httpConfigService.updateExposure('depth', value).subscribe(
      response => console.log(response),
      error => console.error(error)
    );
  }
  updateRGBExposure(value: number) {
    console.log('Updating RGB Exposure:', value);
    this.httpConfigService.updateExposure('rgb', value).subscribe(
      response => console.log(response),
      error => console.error(error)
    );
  }
  // Called when depth metadata toggle changes
  onDepthMetadataToggle(newValue: boolean) {
    this.depthMetadataOn = newValue;
    console.log('Depth Metadata toggled to:', newValue);
    if (!newValue) this.depthMetadataLines = [];

  }

  // Called when rgb metadata toggle changes
  onRgbMetadataToggle(newValue: boolean) {
    this.rgbMetadataOn = newValue;
    console.log('RGB Metadata toggled to:', newValue);
    // Call server to toggle metadata
    if (!newValue) this.rgbMetadataLines = [];
  }
  toggleSidePanel() {
    this.sidePanelOpen = !this.sidePanelOpen;
  }
  stopStreamingServerSide() {
    // Tell server to stop streaming for this app
    this.webSocketService.stopStreamServerSide();

    // Then also unsubscribe locally

  }
  setActiveButton(button: string) {
    this.activeButton = button;
    if(button =='button2'){
      this.show3D = true;
    }else{
      this.show3D = false;
    }
    this.httpConfigService.show3D(this.show3D).subscribe(
      response => console.log(response),
      error => console.error(error)
    );
    // Add your button click logic here
  }
}
