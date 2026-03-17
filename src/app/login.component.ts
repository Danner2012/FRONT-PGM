import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="bg-decoration">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>

      <div class="container d-flex align-items-center justify-content-center min-vh-100">
        <div class="login-card shadow-2xl fade-in">
          <div class="card-body p-5">
            <div class="text-center mb-5">
              <div class="brand-icon bg-primary-gradient mb-3 shadow-lg">
                <i class="bi bi-cpu-fill text-white fs-2"></i>
              </div>
              <h2 class="fw-bold text-dark m-0">Celucentro</h2>
              <p class="text-secondary small mt-1">Gestión Inteligente de Reparaciones</p>
            </div>

            <h4 class="fw-bold mb-4 text-center">Bienvenido de nuevo</h4>
            
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-4">
              <div class="form-floating mb-3">
                <input type="text" formControlName="username" class="form-control custom-input" id="username" placeholder="Usuario">
                <label for="username" class="text-muted small"><i class="bi bi-person me-2"></i>Nombre de usuario</label>
              </div>
              
              <div class="form-floating mb-3">
                <input type="password" formControlName="password" class="form-control custom-input" id="password" placeholder="Contraseña">
                <label for="password" class="text-muted small"><i class="bi bi-lock me-2"></i>Contraseña</label>
              </div>

              <div *ngIf="errorMessage()" class="alert alert-danger-custom d-flex align-items-center mb-4 slide-up">
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                <span class="small">{{ errorMessage() }}</span>
              </div>

              <button type="submit" class="btn btn-login w-100 py-3 rounded-3 shadow-lg mb-4" [disabled]="loginForm.invalid || isLoading()">
                <span *ngIf="!isLoading()">Iniciar Sesión</span>
                <div *ngIf="isLoading()" class="spinner-border spinner-border-sm text-white" role="status"></div>
              </button>

              <div class="text-center mt-2">
                <p class="text-muted small">¿No tienes acceso? <a href="#" class="text-primary fw-bold text-decoration-none">Soporte IT</a></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --primary: #6366f1; --secondary: #a855f7; }
    .login-page { position: relative; min-height: 100vh; background-color: #f8fafc; overflow: hidden; font-family: 'Inter', sans-serif; }
    .bg-decoration { position: absolute; width: 100%; height: 100%; z-index: 0; }
    .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: move 20s infinite alternate; }
    .blob-1 { width: 500px; height: 500px; background: #6366f1; top: -100px; left: -100px; }
    .blob-2 { width: 400px; height: 400px; background: #a855f7; bottom: -50px; right: -50px; }
    .blob-3 { width: 300px; height: 300px; background: #3b82f6; top: 40%; left: 60%; }
    @keyframes move { from { transform: translate(0, 0) scale(1); } to { transform: translate(50px, 50px) scale(1.1); } }
    .login-card { position: relative; z-index: 1; width: 100%; max-width: 480px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 32px; }
    .brand-icon { width: 64px; height: 64px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; }
    .bg-primary-gradient { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); }
    .custom-input { border: 2px solid #e2e8f0; border-radius: 16px; padding: 1rem 1rem; transition: all 0.3s ease; background: rgba(255, 255, 255, 0.5); }
    .custom-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); background: #fff; }
    .btn-login { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; border: none; font-weight: 700; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn-login:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); opacity: 0.9; }
    .alert-danger-custom { background: #fef2f2; color: #b91c1c; border-left: 4px solid #ef4444; padding: 0.75rem 1rem; border-radius: 12px; }
    .fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .slide-up { animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          setTimeout(() => {
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          }, 800);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Usuario o contraseña incorrectos');
        }
      });
    }
  }
}
