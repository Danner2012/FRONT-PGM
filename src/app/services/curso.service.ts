import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/';

  // Tipos de Curso
  getTiposCurso(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}tipos-curso/`);
  }
  createTipoCurso(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}tipos-curso/`, data);
  }
  updateTipoCurso(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}tipos-curso/${id}/`, data);
  }
  deleteTipoCurso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}tipos-curso/${id}/`);
  }

  // Horarios (Maestros)
  getHorarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}horarios/`);
  }
  createHorario(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}horarios/`, data);
  }
  updateHorario(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}horarios/${id}/`, data);
  }
  deleteHorario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}horarios/${id}/`);
  }

  // Días (Solo lectura)
  getDias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}dias/`);
  }

  // Cursos
  getCursos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}cursos/`);
  }
  getCursosPorTecnico(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}cursos/mis-cursos-tecnico/`);
  }
  createCurso(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}cursos/`, data);
  }
  updateCurso(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}cursos/${id}/`, data);
  }
  deleteCurso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}cursos/${id}/`);
  }

  // Asignación de Horarios a Cursos
  asignarHorario(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}curso-horarios/`, data);
  }
  quitarHorario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}curso-horarios/${id}/`);
  }

  // Asignación de Técnicos a Cursos
  asignarTecnico(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}curso-tecnicos/`, data);
  }
  quitarTecnico(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}curso-tecnicos/${id}/`);
  }

  // Inscripciones
  getInscripciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}inscripciones/`);
  }
}
