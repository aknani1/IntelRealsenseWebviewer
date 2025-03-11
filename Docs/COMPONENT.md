


# Angular Components Documentation

## CamViewerComponent
The main component that orchestrates the viewer interface.

### Properties
```typescript
showDepth: boolean;        // Controls depth stream visibility
showRGB: boolean;          // Controls RGB stream visibility
show3D: boolean;           // Controls 3D view visibility
isReconfiguring: boolean;  // Indicates if a configuration update is in progress
sidePanelOpen: boolean;    // Controls sidebar open/close state
depthImageUrl: string;     // URL (base64) for the current depth frame
colorImageUrl: string;     // URL (base64) for the current RGB frame
Url3D: string;             // URL (base64) for the current 3D view frame
```

### Methods
```typescript
onDepthToggle(newValue: boolean): void 
// Toggles the depth stream display. 
// @param newValue - the new boolean state for the depth stream.

onRgbToggle(newValue: boolean): void 
// Toggles the RGB stream display. 
// @param newValue - the new boolean state for the RGB stream.

updateDepthConfig(event: { resolution: string; frameRate: string }): void 
// Updates the depth stream configuration based on new resolution and frame rate settings. 
// @param event - contains resolution (e.g., "640x360") and frameRate (e.g., "30").

updateRGBConfig(event: { resolution: string; frameRate: string }): void 
// Updates the RGB stream configuration based on new resolution and frame rate settings. 
// @param event - contains resolution and frame rate values.

setActiveButton(button: string): void 
// Switches the active view mode between 2D and 3D.
// @param button - identifier (e.g., "button1" for 2D, "button2" for 3D)
```

---

## SidebarControlsComponent
Manages the user interface for camera controls, including toggling modules and adjusting settings.

### Properties
```typescript
depthModuleEnabled: boolean;      // Whether the depth module is enabled
rgbCameraEnabled: boolean;        // Whether the RGB module is enabled
depthMetadataEnabled: boolean;    // Whether the depth metadata overlay is active
rgbMetadataEnabled: boolean;      // Whether the RGB metadata overlay is active
selectedDepthResolution: string;  // Currently selected depth resolution (e.g., "640x360")
selectedRGBResolution: string;    // Currently selected RGB resolution (e.g., "640x360")
depthExposureValue: number;       // Current exposure value for depth module
rgbExposureValue: number;         // Current exposure value for RGB module
```

### Methods
```typescript
onDepthResolutionChange(): void 
// Called when the user selects a new depth resolution or frame rate. 
// Emits a configuration update event.

onRgbResolutionChange(): void 
// Called when the user selects a new RGB resolution or frame rate. 
// Emits a configuration update event.

onDepthExposureChange(): void 
// Called when the depth exposure slider changes. 
// Sends the new exposure value to the server.

onRgbExposureChange(): void 
// Called when the RGB exposure slider changes. 
// Sends the new exposure value to the server.

onHardReset(): void 
// Triggers a factory reset of all camera settings and UI components.

toggleDeviceProfile(): void 
// Toggles the visibility of the device profile information panel.
```

---

## CamStreamsComponent
Handles display and layout for incoming video streams and metadata overlays.

### Inputs
```typescript
@Input() showDepth: boolean;          // Determines if the depth stream should be displayed
@Input() showRGB: boolean;            // Determines if the RGB stream should be displayed
@Input() show3D: boolean;             // Determines if the 3D stream should be displayed
@Input() depthImageUrl: string;       // Base64-encoded URL for the depth stream image
@Input() colorImageUrl: string;       // Base64-encoded URL for the RGB stream image
@Input() Url3D: string;               // Base64-encoded URL for the 3D visualization image
@Input() depthMetadataLines: string[]; // Array of metadata lines for the depth stream overlay
@Input() rgbMetadataLines: string[];   // Array of metadata lines for the RGB stream overlay
```

### Description
- The **CamStreamsComponent** receives input from its parent (typically CamViewerComponent) to display real-time video streams and associated metadata.
- It decodes Base64 images and overlays metadata (e.g., FPS, resolution) as needed.
- The component adapts to different layouts based on whether one or multiple streams are active.


--------------------------------------------------

## SnackbarComponent
The SnackbarComponent is responsible for displaying application notifications (such as error messages) using Angular Material's Snackbar functionality.

### Overview
- Listens to error messages emitted by the ErrorService.
- Uses Angular Material’s MatSnackBar to show notifications with a dismiss action.
- Automatically displays errors with a default duration and custom styling.

### Properties and Dependencies
```typescript
// There are no public @Input properties for SnackbarComponent.
constructor(
  private snackBar: MatSnackBar,      // Service to open the snackbar
  private errorService: ErrorService   // Service that emits error messages
)
```

### Methods
```typescript
private showError(message: string): void
// Displays a snackbar with the provided error message.
// @param message - The error message to be displayed.
//

```



