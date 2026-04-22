import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { CursoService } from '../../../services/curso.service';
import { HerramientaService } from '../../../services/herramienta.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-4 container-fluid fade-in bg-main">
      
      <!-- ============================================================ -->
      <!-- VISTA PARA ADMINISTRADORES -->
      <!-- ============================================================ -->
      <ng-container *ngIf="userRole() === 'administrador' || userRole() === 'superadministrador'">
        <div class="hero-section mb-5 p-5 rounded-5 shadow-sm text-white">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h1 class="display-5 fw-bold mb-2">Bienvenido, {{ getFullName() }}</h1>
              <p class="lead opacity-75 mb-4">Gestiona tus cursos, estudiantes y el catálogo 3D de Celucentro desde un solo lugar.</p>
              <div class="d-flex gap-3">
                <a routerLink="/dashboard/cursos" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Ver Cursos</a>
                <a routerLink="/dashboard/herramientas" class="btn btn-outline-secondary text-white rounded-pill px-4 fw-bold border-2">Catálogo 3D</a>
              </div>
            </div>
            <div class="col-md-4 d-none d-md-block text-center">
              <i class="bi bi-cpu display-1 opacity-10 floating"></i>
            </div>
          </div>
        </div>

        <h5 class="fw-bold mb-4 px-2 d-flex align-items-center gap-2 text-dark opacity-75">
          <i class="bi bi-graph-up text-primary"></i> Resumen de Actividad
        </h5>
        <div class="row g-4 mb-5">
          <div class="col-md-4">
            <div class="card-glass h-100 p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted fw-bold mb-1">CURSOS ACTIVOS</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ adminStats().cursos }}</h2>
                </div>
                <div class="icon-circle bg-primary-soft text-primary">
                  <i class="bi bi-mortarboard-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card-glass h-100 p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted fw-bold mb-1">CATÁLOGO 3D</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ adminStats().herramientas }}</h2>
                </div>
                <div class="icon-circle bg-info-soft text-info">
                  <i class="bi bi-box-seam-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card-glass h-100 p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="text-muted fw-bold mb-1">MODELOS 3D</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ adminStats().modelos }}</h2>
                </div>
                <div class="icon-circle bg-warning-soft text-warning">
                  <i class="bi bi-unity fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-8">
            <div class="p-4 rounded-4 bg-white shadow-sm h-100 border">
              <h5 class="fw-bold mb-4">Gestión Rápida</h5>
              <div class="row g-3">
                <div class="col-6 col-md-4">
                  <a routerLink="/dashboard/inscripciones" class="quick-link-box p-3 rounded-4 border text-center text-decoration-none d-block">
                    <i class="bi bi-journal-check fs-3 mb-2 d-block text-primary"></i>
                    <span class="small fw-bold text-dark">Nueva Inscripción</span>
                  </a>
                </div>
                <div class="col-6 col-md-4">
                  <a routerLink="/dashboard/tecnicos" class="quick-link-box p-3 rounded-4 border text-center text-decoration-none d-block">
                    <i class="bi bi-person-badge fs-3 mb-2 d-block text-success"></i>
                    <span class="small fw-bold text-dark">Gestionar Técnicos</span>
                  </a>
                </div>
                <div class="col-6 col-md-4">
                  <a routerLink="/dashboard/estudiantes" class="quick-link-box p-3 rounded-4 border text-center text-decoration-none d-block">
                    <i class="bi bi-person-plus fs-3 mb-2 d-block text-info"></i>
                    <span class="small fw-bold text-dark">Registrar Alumno</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-4 rounded-4 bg-dark shadow-lg h-100 text-white position-relative overflow-hidden">
               <h5 class="fw-bold mb-3">Panel de Control</h5>
               <p class="small opacity-75 mb-0">Como administrador, tienes acceso total a la configuración del sistema y la supervisión de técnicos.</p>
               <i class="bi bi-shield-lock position-absolute bottom-0 end-0 opacity-10 fs-1 m-3"></i>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================ -->
      <!-- VISTA PARA ESTUDIANTES (Mismo Tema Oscuro) -->
      <!-- ============================================================ -->
      <ng-container *ngIf="userRole() === 'estudiante'">
        <div class="hero-section mb-5 p-5 rounded-5 shadow-sm text-white">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h1 class="display-5 fw-bold mb-2">Bienvenido, {{ getFullName() }}</h1>
              <p class="lead opacity-75 mb-4">Es un buen día para aprender. Continúa con tus cursos o explora las herramientas 3D.</p>
              <div class="d-flex gap-3">
                <a routerLink="/dashboard/mis-cursos" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Ir a mis cursos</a>
                <a routerLink="/dashboard/diagnostico-fallas" class="btn btn-outline-secondary text-white rounded-pill px-4 fw-bold border-2">Diagnóstico IA</a>
              </div>
            </div>
            <div class="col-md-4 d-none d-md-block text-center">
              <i class="bi bi-mortarboard display-1 opacity-10 floating"></i>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <div class="p-4 rounded-4 bg-white shadow-sm border h-100">
               <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
                 <i class="bi bi-lightning-charge text-warning"></i> Atajos de Aprendizaje
               </h5>
               <div class="list-group list-group-flush">
                 <a routerLink="/dashboard/mis-cursos" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex justify-content-between align-items-center">
                   <div class="d-flex align-items-center gap-3">
                     <div class="icon-sm bg-light rounded-3 p-2 text-primary"><i class="bi bi-book"></i></div>
                     <span class="fw-bold">Ver mi progreso</span>
                   </div>
                   <i class="bi bi-chevron-right small text-muted"></i>
                 </a>
                 <a routerLink="/dashboard/diagnostico-fallas" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex justify-content-between align-items-center">
                   <div class="d-flex align-items-center gap-3">
                     <div class="icon-sm bg-light rounded-3 p-2 text-info"><i class="bi bi-robot"></i></div>
                     <span class="fw-bold">Asistente de fallas (IA)</span>
                   </div>
                   <i class="bi bi-chevron-right small text-muted"></i>
                 </a>
               </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-4 rounded-4 bg-dark text-white shadow-lg h-100 position-relative overflow-hidden">
               <h5 class="fw-bold mb-3">Laboratorio Virtual</h5>
               <p class="small opacity-75 mb-4">Practica con nuestros modelos 3D de alta precisión y mejora tus habilidades técnicas.</p>
               <button routerLink="/dashboard/herramientas" class="btn btn-outline-light btn-sm rounded-pill px-4 fw-bold">Explorar Modelos</button>
               <i class="bi bi-unity position-absolute bottom-0 end-0 opacity-25 fs-1 m-3"></i>
            </div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .bg-main { background-color: #f8fafc; min-height: 100vh; }
    .hero-section { 
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      position: relative; overflow: hidden;
    }
    
    .hero-section::before {
      content: ''; position: absolute; top: -50%; right: -10%;
      width: 400px; height: 400px; background: rgba(255,255,255,0.03);
      border-radius: 50%;
    }
    
    .card-glass {
      background: #ffffff;
      border-radius: 24px;
      transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #f1f5f9 !important;
    }
    .card-glass:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05) !important; }

    .icon-circle {
      width: 56px; height: 56px;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
    }
    .bg-primary-soft { background: #eff6ff; }
    .bg-info-soft { background: #ecfeff; }
    .bg-warning-soft { background: #fffbeb; }

    .quick-link-box { background: #ffffff; transition: 0.2s; }
    .quick-link-box:hover { background: #f8fafc; border-color: #cbd5e1 !important; }

    .icon-sm { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }

    .floating { animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    .fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private authService = inject(AuthService);
  private cursoService = inject(CursoService);
  private herramientaService = inject(HerramientaService);

  user = this.authService.currentUser;
  userRole = this.authService.userRole;

  adminStats = signal({
    cursos: 0,
    herramientas: 0,
    modelos: 0
  });

  ngOnInit(): void {
    if (this.userRole() === 'administrador' || this.userRole() === 'superadministrador') {
      this.loadAdminStats();
    }
  }

  loadAdminStats(): void {
    this.cursoService.getCursos().subscribe(data => {
      this.adminStats.update(s => ({ ...s, cursos: data.length }));
    });
    this.herramientaService.getHerramientas().subscribe(data => {
      let totalModelos = 0;
      data.forEach((h: any) => totalModelos += (h.modelos_3d?.length || 0));
      this.adminStats.update(s => ({ ...s, herramientas: data.length, modelos: totalModelos }));
    });
  }

  getFullName(): string {
    const u = this.user();
    if (!u) return 'Usuario';
    return u.nombre_completo || u.correo || 'Usuario';
  }
}
