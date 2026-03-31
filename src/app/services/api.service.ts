import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api/'; // Base API URL

  constructor(private http: HttpClient) { }

  // Métodos para Técnicos
  getTecnicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}tecnicos/`);
  }

  getTecnico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}tecnicos/${id}/`);
  }

  createTecnico(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}tecnicos/`, data);
  }

  updateTecnico(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}tecnicos/${id}/`, data);
  }

  toggleTecnicoStatus(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}tecnicos/${id}/toggle-status/`, {});
  }
}
