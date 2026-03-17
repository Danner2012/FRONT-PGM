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
      <div class="login-card fade-in">
        <div class="d-flex flex-column flex-md-row">
          
          <!-- LADO IZQUIERDO: LOGO GRANDE -->
          <div class="logo-section d-flex align-items-center justify-content-center p-5">
            <div class="logo-container">
              <img src="logo2.png" alt="Logo" class="img-fluid main-logo">
            </div>
          </div>

          <!-- LADO DERECHO: USUARIO Y CONTRASEÑA -->
          <div class="form-section p-5 flex-grow-1 border-start-md">
            <div class="form-header mb-4">
              <h3 class="fw-bold text-dark m-0">Acceso al Sistema</h3>
              <p class="text-muted small">Ingresa tus credenciales de administrador</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <!-- Usuario -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">USUARIO</label>
                <div class="input-group-pro">
                  <i class="bi bi-person"></i>
                  <input type="text" formControlName="username" class="form-control pro-input" placeholder="Nombre de usuario">
                </div>
              </div>
              
              <!-- Contraseña -->
              <div class="mb-4">
                <label class="form-label small fw-bold text-muted">CONTRASEÑA</label>
                <div class="input-group-pro">
                  <i class="bi bi-lock"></i>
                  <input type="password" formControlName="password" class="form-control pro-input" placeholder="••••••••">
                </div>
              </div>

              <!-- Alerta de Error -->
              <div *ngIf="errorMessage()" class="alert-pro mb-4 slide-up">
                <i class="bi bi-x-circle-fill me-2"></i> {{ errorMessage() }}
              </div>

              <!-- BOTÓN ENTRAR ABAJO -->
              <button type="submit" class="btn btn-entrar w-100 py-3" [disabled]="loginForm.invalid || isLoading()">
                <span *ngIf="!isLoading()" class="fw-bold tracking-widest">ENTRAR</span>
                <div *ngIf="isLoading()" class="spinner-border spinner-border-sm text-white" role="status"></div>
              </button>
            </form>
          </div>

        </div>
      </div>
      
      <div class="footer-text mt-4 text-muted small">
        © 2026 Celucentro IT • Gestión Profesional
      </div>
    </div>
  `,
  styles: [`
    :host { --brand: #4f46e5; --brand-dark: #3730a3; }

    .login-screen {
      min-height: 100vh;
      background-color: #f3f4f6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      padding: 20px;
    }

    /* Tarjeta Principal Horizontal */
    .login-card {
      width: 100%;
      max-width: 850px; /* Más ancha para el diseño logo + form */
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    /* Sección del Logo */
    .logo-section {
      background-color: #fbfbfb;
      min-width: 350px;
      display: flex;
    }
    .logo-container {
      width: 240px; /* Logo grande */
      transition: transform 0.3s ease;
    }
    .main-logo { filter: drop-shadow(0 10px 15px rgba(0,0,0,0.05)); }

    /* Sección del Formulario */
    .form-section { background: white; }
    
    @media (min-width: 768px) {
      .border-start-md { border-left: 1px solid #f1f5f9; }
    }

    /* Inputs Estilizados */
    .input-group-pro { position: relative; }
    .input-group-pro i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 1.1rem; }
    
    .pro-input {
      padding: 12px 15px 12px 45px;
      border: 2px solid #f3f4f6;
      border-radius: 12px;
      background: #f9fafb;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .pro-input:focus {
      background: #fff;
      border-color: var(--brand);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
      outline: none;
    }

    /* Botón ENTRAR */
    .btn-entrar {
      background-color: var(--brand);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 800;
      letter-spacing: 2px;
      transition: all 0.3s;
    }
    .btn-entrar:hover {
      background-color: var(--brand-dark);
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
    }
    .btn-entrar:disabled { opacity: 0.6; transform: none; }

    .alert-pro {
      background: #fff1f2;
      color: #b91c1c;
      border-radius: 12px;
      padding: 10px 15px;
      font-size: 0.85rem;
      border: 1px solid #fecdd3;
    }

    .fade-in { animation: fadeIn 0.7s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    .tracking-widest { letter-spacing: 0.15em; }
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
