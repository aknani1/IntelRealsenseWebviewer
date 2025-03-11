// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// Angular Material modules...
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { CamViewerComponent } from './components/cam-viewer/cam-viewer.component';
import { SidebarControlsComponent } from './components/sidebar-controls/sidebar-controls.component';
import { CamStreamsComponent } from './components/cam-streams/cam-streams.component';
import { ConnectionStatusComponent } from './components/connection-status/connection-status.component';
import { SnackbarComponent } from './components/snackbar/snackbar.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorInterceptor } from './services/http-error.interceptor';

@NgModule({
  // Put all non-standalone components here
  declarations: [
    AppComponent,
  ],
  imports: [
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
    MatButtonModule,
    CamViewerComponent,
    SnackbarComponent,
    ConnectionStatusComponent
    ],
  providers: [
    provideHttpClient(),  {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }