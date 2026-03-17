import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/';
  
  // Usamos signals para un manejo de estado moderno y reactivo
  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(!!localStorage.getItem('access_token'));

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login/`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('access_token');
    return this.http.get<any>(`${this.apiUrl}user/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => this.currentUser.set(user))
    );
  }
}
