import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpConfigService {
  private baseUrl = environment.baseUrl;
  private apiUrl = `${this.baseUrl}/api/configure`; // Flask server URL
  private exposureApiUrl = `${this.baseUrl}/api/exposure`; // Endpoint for exposure updates
  private setMetaDataUrl = `${this.baseUrl}/api/set_metadata`; // endpoint for metadata
  private cameraInfoUrl = `${this.baseUrl}/api/camera_info`;
  private hardResetUrl = `${this.baseUrl}/api/hard_reset`;
  private show3DUrl = `${this.baseUrl}/api/set3D`;

  constructor(private http: HttpClient, private webSocketService: WebSocketService) {}

  updateConfiguration(module: string, resolution: string, frameRate: string): Observable<any> {
    return this.http.post(this.apiUrl, { module, resolution, frame_rate: frameRate });
  }

  updateExposure(module: string, exposureValue: number): Observable<any> {
    const body = { module, exposure: exposureValue };
    return this.http.post(this.exposureApiUrl, body);
  }

  setMetadata(module: string, state: boolean): Observable<any> {
    return this.http.post(this.setMetaDataUrl, { module, state });
  }

  getCameraInfo(): Observable<any> {
    return this.http.get(this.cameraInfoUrl);
  }

  hardReset(): Observable<any> {
    return this.http.post(this.hardResetUrl, {});
  }

  getDefaults(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/defaults`);
  }
  show3D(show3D: boolean): Observable<any>{
    return this.http.post(this.show3DUrl, {show3D});
  }
}
