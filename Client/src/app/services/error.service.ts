import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private errors = new Subject<string>();

  getErrors(): Observable<string> {
    return this.errors.asObservable();
  }

  addError(message: string): void {
    this.errors.next(message);
  }
}