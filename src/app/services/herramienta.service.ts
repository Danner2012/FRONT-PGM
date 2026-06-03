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
    // Si es FormData se envía tal cual, si no, se asume JSON
    return this.http.patch<any>(`${this.apiUrl}/modelos-3d/${modeloId}/`, config);
  }

  deleteModelo3D(modeloId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/modelos-3d/${modeloId}/`);
  }

  // Reportes
  exportHerramientasPDF(filtros: any): Observable<Blob> {
    let params: any = {};
    if (filtros.search) params.search = filtros.search;
    if (filtros.categoria && filtros.categoria !== 'todos') params.categoria = filtros.categoria;
    if (filtros.stock_status && filtros.stock_status !== 'todos') params.stock_status = filtros.stock_status;

    return this.http.get(`${this.apiUrl}/herramientas/export-pdf/`, {
      params,
      responseType: 'blob'
    });
  }
}
