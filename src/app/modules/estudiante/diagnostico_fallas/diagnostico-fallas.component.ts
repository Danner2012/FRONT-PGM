import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-diagnostico-fallas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid fade-in p-4">
      <div class="welcome-header mb-4">
        <h2 class="fw-bold m-0 mt-2 text-uppercase" style="font-family: 'Orbitron', sans-serif; letter-spacing: 2px;">
          <i class="bi bi-activity text-primary me-2"></i>Diagnóstico de Fallas
        </h2>
        <p class="text-secondary m-0">Asistente Técnico IA - Módulo de Estudiante</p>
      </div>

      <div class="row g-4">
        <div class="col-md-12">
          <div class="card-custom p-5 text-center">
            <div class="icon-box-large mb-4">
              <i class="bi bi-robot fs-1 text-primary"></i>
            </div>
            <h3 class="fw-bold text-white mb-3">Diagnóstico MLP</h3>
            <p class="text-muted mx-auto" style="max-width: 600px;">
              Este es el espacio centralizado para el diagnóstico de fallas mediante Inteligencia Artificial. 
              Módulo ubicado en: modules/estudiante/diagnostico_fallas
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-custom {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .icon-box-large {
      width: 80px; height: 80px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto; border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DiagnosticoFallasComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;
}
