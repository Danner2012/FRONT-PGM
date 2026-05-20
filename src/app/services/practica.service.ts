import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PracticaService {
  private apiUrl = 'http://localhost:8000/api/';

  constructor(private http: HttpClient) { }

  // Prácticas
  getPracticas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}practicas/`);
  }

  getMisPracticas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}practicas/mis_practicas/`);
  }

  getPractica(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}practicas/${id}/`);
  }

  createPractica(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}practicas/`, data);
  }

  updatePractica(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}practicas/${id}/`, data);
  }

  deletePractica(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}practicas/${id}/`);
  }

  toggleStatus(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}practicas/${id}/toggle_status/`, {});
  }

  // Recursos de Práctica
  getTiposRecurso(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}tipos-recurso/`);
  }

  getTiposPractica(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}tipos-practica/`);
  }

  createTipoPractica(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}tipos-practica/`, data);
  }

  deleteTipoPractica(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}tipos-practica/${id}/`);
  }

  createTipoRecurso(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}tipos-recurso/`, data);
  }

  deleteTipoRecurso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}tipos-recurso/${id}/`);
  }

  createRecurso(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}recursos-practica/`, data);
  }

  updateRecurso(id: number, data: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}recursos-practica/${id}/`, data);
  }

  deleteRecurso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}recursos-practica/${id}/`);
  }

  // Herramientas de Práctica
  createPracticaHerramienta(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}practica-herramientas/`, data);
  }

  updatePracticaHerramienta(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}practica-herramientas/${id}/`, data);
  }

  deletePracticaHerramienta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}practica-herramientas/${id}/`);
  }

  getHerramientasPorPractica(practicaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}practicas/${practicaId}/herramientas/`);
  }

  // Préstamos y Devoluciones
  getPrestamos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}prestamos/`);
  }

  createPrestamo(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}prestamos/`, data);
  }

  deletePrestamo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}prestamos/${id}/`);
  }

  createDevolucion(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}devoluciones-herramientas/`, data);
  }

  // --- ENTREGABLES Y SEGUIMIENTO (ESTUDIANTE) ---
  getEstadoPracticaEstudiante(idPractica: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}practicas-estudiante/mi_estado_practica/`, {
      params: { id_practica: idPractica.toString() }
    });
  }

  finalizarEntrega(idPracticaEstudiante: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}practicas-estudiante/${idPracticaEstudiante}/finalizar_entrega/`, {});
  }

  subirEvidencia(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}evidencias-practica/`, data);
  }

  deleteEvidencia(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}evidencias-practica/${id}/`);
  }

  // --- REVISIÓN (TÉCNICO) ---
  getEntregasParaTecnico(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}practicas-estudiante/`);
  }

  calificarPractica(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}practicas-estudiante/${id}/calificar/`, data);
  }
}
