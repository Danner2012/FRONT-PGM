import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private http = inject(HttpClient);
  // URL de tu API de FastAPI en PyCharm
  private apiUrl = 'http://localhost:5000';

  diagnosticar(sintomas: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/diagnostico`, { sintomas });
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  getDetecciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/detecciones`);
  }

  setFiltro(nombre: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/filtro/${nombre}`, {});
  }

  getEstado(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estado`);
  }
}

