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
    <div class="login-screen">
      <!-- Background decoration blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      
      <div class="login-card fade-in">
        <div class="row g-0">
          
          <!-- LADO IZQUIERDO: LOGO GRANDE -->
          <div class="col-md-5 logo-section d-flex align-items-center justify-content-center">
            <div class="logo-wrapper">
              <img src="logo2.png" alt="Logo" class="main-logo">
            </div>
          </div>

          <!-- LADO DERECHO: USUARIO Y CONTRASEÑA -->
          <div class="col-md-7 form-section p-4 p-lg-5">
            <div class="form-header mb-4">
              <h3 class="fw-bold text-dark m-0">Acceso al Sistema</h3>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <!-- Usuario -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase letter-spacing-1">Usuario</label>
                <div class="input-container">
                  <i class="bi bi-person icon-field"></i>
                  <input type="text" formControlName="username" class="form-control pro-input" placeholder="">
                </div>
              </div>
              
              <!-- Contraseña -->
              <div class="mb-4">
                <label class="form-label small fw-bold text-muted text-uppercase letter-spacing-1">Contraseña</label>
                <div class="input-container">
                  <i class="bi bi-lock icon-field"></i>
                  <input type="password" formControlName="password" class="form-control pro-input" placeholder="">
                </div>
              </div>

              <!-- Alerta de Error -->
              <div *ngIf="errorMessage()" class="alert-pro mb-4">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ errorMessage() }}
              </div>

              <!-- BOTÓN ENTRAR -->
              <button type="submit" class="btn btn-entrar w-100 py-3" [disabled]="loginForm.invalid || isLoading()">
                <div *ngIf="!isLoading()" class="d-flex align-items-center justify-content-center">
                  <span class="fw-bold me-2">INICIAR SESIÓN</span>
                  <i class="bi bi-arrow-right-short fs-4"></i>
                </div>
                <div *ngIf="isLoading()" class="spinner-border spinner-border-sm text-white" role="status"></div>
              </button>
            </form>
          </div>

        </div>
      </div>
      

    </div>
  `,
  styles: [`
    :host { 
      --primary: #2563eb; 
      --primary-hover: #1d4ed8;
      --bg-dark: #0f172a;
      --text-main: #1e293b;
      --input-bg: #f8fafc;
      --input-border: #e2e8f0;
      --font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .login-screen {
      min-height: 100vh;
      background-color: var(--bg-dark);
      background-image: radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.1) 0, transparent 50%), 
                        radial-gradient(at 50% 0%, rgba(30, 41, 59, 0.1) 0, transparent 50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: var(--font-family);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    /* Background blobs for premium look */
    .blob {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0) 70%);
      border-radius: 50%;
      z-index: 0;
    }
    .blob-1 { top: -100px; left: -100px; }
    .blob-2 { bottom: -100px; right: -100px; }

    /* Tarjeta Principal */
    .login-card {
      width: 100%;
      max-width: 900px;
      background: #ffffff;
      border-radius: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 1;
    }

    /* Sección del Logo */
    .logo-section {
      background: #f8fafc;
      border-right: 1px solid #f1f5f9;
      padding: 3rem;
    }
    .logo-wrapper {
      width: 100%;
      max-width: 480px;
      filter: drop-shadow(0 10px 15px rgba(0,0,0,0.05));
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .main-logo { width: 100%; height: auto; object-fit: contain; }
    .login-card:hover .logo-wrapper { transform: scale(1.02); }

    /* Sección del Formulario */
    .form-section { background: #ffffff; }
    
    .letter-spacing-1 { letter-spacing: 0.05em; }

    /* Inputs Estilizados */
    .input-container { position: relative; }
    .icon-field { 
      position: absolute; 
      left: 16px; 
      top: 50%; 
      transform: translateY(-50%); 
      color: #94a3b8; 
      font-size: 1.1rem; 
      transition: color 0.2s;
    }
    
    .pro-input {
      padding: 14px 16px 14px 48px;
      border: 2px solid var(--input-border);
      border-radius: 14px;
      background: var(--input-bg);
      font-size: 0.95rem;
      color: var(--text-main);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pro-input::placeholder { color: #cbd5e1; }
    .pro-input:focus {
      background: #fff;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
      outline: none;
    }
    .input-container:focus-within .icon-field { color: var(--primary); }

    /* Botón ENTRAR */
    .btn-entrar {
      background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
      color: white;
      border: none;
      border-radius: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .btn-entrar:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
      filter: brightness(1.1);
    }
    .btn-entrar:active:not(:disabled) { transform: translateY(0); }
    .btn-entrar:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Alerta de Error */
    .alert-pro {
      background: #fff1f2;
      color: #e11d48;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 0.875rem;
      border: 1px solid #ffe4e6;
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    @media (max-width: 767px) {
      .logo-section { border-right: none; border-bottom: 1px solid #f1f5f9; padding: 2rem; }
      .logo-wrapper { max-width: 180px; }
    }
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
          }, 600);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Credenciales no válidas');
        }
      });
    }
  }
}
