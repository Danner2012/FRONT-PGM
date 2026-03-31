import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 container-fluid fade-in">
      <div class="welcome-header mb-4">
        <h2 class="fw-bold m-0 mt-2">¡Hola, {{ user()?.nombre_completo || user()?.correo }}! </h2>
        <p class="text-secondary m-0">Bienvenido al panel central de Celucentro. Tu rol es: <strong class="text-primary text-capitalize">{{ userRole() }}</strong></p>
      </div>

      <!-- Estadísticas Rápidas -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="stat-card p-4 shadow-hover">
            <div class="icon-box bg-indigo-light text-indigo mb-3"><i class="bi bi-cash-stack fs-4"></i></div>
            <h6 class="text-secondary mb-1">Ingresos Hoy</h6>
            <h3 class="fw-bold m-0">$4,250</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-4 shadow-hover">
            <div class="icon-box bg-emerald-light text-emerald mb-3"><i class="bi bi-people fs-4"></i></div>
            <h6 class="text-secondary mb-1">Clientes</h6>
            <h3 class="fw-bold m-0">48</h3>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; transition: 0.3s; }
    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 20px -5px rgba(0,0,0,0.05); }
    .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .bg-indigo-light { background: #eef2ff; } .text-indigo { color: #3b82f6; }
    .bg-emerald-light { background: #ecfdf5; } .text-emerald { color: #10b981; }
    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardHomeComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;
  userRole = this.authService.userRole;
}
