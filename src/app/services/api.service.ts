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

  // Métodos para Estudiantes
  getEstudiantes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}estudiantes/`);
  }

  getEstudiante(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}estudiantes/${id}/`);
  }

  createEstudiante(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}estudiantes/`, data);
  }

  updateEstudiante(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}estudiantes/${id}/`, data);
  }

  toggleEstudianteStatus(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}estudiantes/${id}/toggle-status/`, {});
  }

  getStudentStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}student-stats/`);
  }

  // Métodos para Cursos
  getCursos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}cursos/`);
  }

  getCursoHorarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}curso-horarios/`);
  }

  // Métodos para Inscripciones
  getInscripciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}inscripciones/`);
  }

  getMisCursos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}inscripciones/mis-cursos/`);
  }

  createInscripcion(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}inscripciones/`, data);
  }

  updateInscripcion(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}inscripciones/${id}/`, data);
  }

  deleteInscripcion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}inscripciones/${id}/`);
  }
}
