import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/';
  
  currentUser = signal<any>(null);
  userRole = signal<string | null>(localStorage.getItem('user_role'));
  isAuthenticated = signal<boolean>(!!localStorage.getItem('access_token'));

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login/`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user_role', res.rol);
        this.userRole.set(res.rol);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.isAuthenticated.set(false);
    this.userRole.set(null);
    this.currentUser.set(null);
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}user/`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  hasRole(role: string): boolean {
    return this.userRole() === role;
  }
}
