import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private http = inject(HttpClient);
  // URL de tu API de Flask
  private apiUrl = 'http://localhost:5000';

  diagnosticar(sintomas: string[]): Observable<any> {
    // El backend espera: {"sintomas": ["sintoma1", "sintoma2"]}
    return this.http.post(`${this.apiUrl}/diagnostico`, { sintomas });
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
