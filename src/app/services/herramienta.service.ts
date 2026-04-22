import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HerramientaService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  // Categorías
  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categorias-herramientas/`);
  }

  // Herramientas
  getHerramientas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/herramientas/`);
  }

  getHerramienta(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/herramientas/${id}/`);
  }

  createHerramienta(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/herramientas/`, data);
  }

  updateHerramienta(id: number, data: FormData): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/herramientas/${id}/`, data);
  }

  deleteHerramienta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/herramientas/${id}/`);
  }

  toggleStatus(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/herramientas/${id}/toggle-status/`, {});
  }

  // Modelos 3D
  subirModelo3D(herramientaId: number, data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/herramientas/${herramientaId}/agregar-modelo/`, data);
  }

  updateConfig3D(modeloId: number, config: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/modelos-3d/${modeloId}/`, config);
  }

  deleteModelo3D(modeloId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/modelos-3d/${modeloId}/`);
  }
}
