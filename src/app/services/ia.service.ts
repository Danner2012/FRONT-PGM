import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private http = inject(HttpClient);
  
  // URL de FastAPI para detección en vivo (detector de componentes)
  private fastapiUrl = 'http://localhost:5001';
  
  // URL de Flask para diagnóstico de fallas (Asistente IA)
  private flaskUrl = 'http://localhost:5000';
  
  // URL de Django para persistencia de datos (afiches, herramientas, etc.)
  private djangoUrl = 'http://localhost:8000/api';

  diagnosticar(sintomas: string[]): Observable<any> {
    return this.http.post(`${this.flaskUrl}/diagnostico`, { sintomas });
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.flaskUrl}/health`);
  }

  getDetecciones(): Observable<any> {
    return this.http.get(`${this.fastapiUrl}/detecciones`);
  }

  setFiltro(nombre: string): Observable<any> {
    return this.http.post(`${this.fastapiUrl}/filtro/${nombre}`, {});
  }

  getEstado(): Observable<any> {
    return this.http.get(`${this.fastapiUrl}/estado`);
  }

  // --- Endpoints de Afiches (Persistencia en Django) ---

  getAfiches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.djangoUrl}/ia/afiches/`);
  }

  getAfiche(id: number): Observable<any> {
    return this.http.get<any>(`${this.djangoUrl}/ia/afiches/${id}/`);
  }

  getAfichePorClase(clase: string): Observable<any> {
    return this.http.get<any>(`${this.djangoUrl}/ia/afiches/clase/${clase.toLowerCase()}/`);
  }

  createAfiche(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.djangoUrl}/ia/afiches/`, data);
  }

  updateAfiche(id: number, data: FormData): Observable<any> {
    return this.http.patch<any>(`${this.djangoUrl}/ia/afiches/${id}/`, data);
  }

  deleteAfiche(id: number): Observable<any> {
    return this.http.delete<any>(`${this.djangoUrl}/ia/afiches/${id}/`);
  }
}


