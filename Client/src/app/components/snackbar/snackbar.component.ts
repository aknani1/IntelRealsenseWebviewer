import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss'
})
export class SnackbarComponent {
  constructor(
    private snackBar: MatSnackBar,
    private errorService: ErrorService
  ) {
    this.errorService.getErrors().subscribe(message => {
      this.showError(message);
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['custom-snackbar']
    });
  }
}