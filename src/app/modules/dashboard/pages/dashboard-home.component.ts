import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { CursoService } from '../../../services/curso.service';
import { HerramientaService } from '../../../services/herramienta.service';
import { ApiService } from '../../../services/api.service';
import { PracticaService } from '../../../services/practica.service';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
      <!-- VISTA PARA TÉCNICOS -->
      <!-- ============================================================ -->
      <ng-container *ngIf="userRole() === 'técnico' || userRole() === 'tecnico'">
        <div class="hero-section mb-4 p-4 rounded-4 shadow-sm text-white">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h2 class="fw-bold mb-1">Panel del Técnico, {{ getFullName() }}</h2>
              <p class="small opacity-75 mb-3">Gestiona tus prácticas y revisa el progreso de tus alumnos.</p>
              <div class="d-flex gap-2">
                <a routerLink="/dashboard/mis-practicas-tecnico" class="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm">Mis Prácticas</a>
                <a routerLink="/dashboard/practicas/revision" class="btn btn-outline-secondary text-white btn-sm rounded-pill px-3 fw-bold border-2">Revisar Alumnos</a>
              </div>
            </div>
            <div class="col-md-4 d-none d-md-block text-end pe-5">
              <i class="bi bi-person-workspace display-6 opacity-25 floating"></i>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <div class="card-glass p-4 shadow-sm border-0 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">CURSOS ASIGNADOS</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ tecnicoStats().cursos }}</h2>
                </div>
                <div class="icon-circle bg-primary-soft text-primary">
                  <i class="bi bi-journal-text fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card-glass p-4 shadow-sm border-0 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">PRÁCTICAS ACTIVAS</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ tecnicoStats().practicas }}</h2>
                </div>
                <div class="icon-circle bg-warning-soft text-warning">
                  <i class="bi bi-wrench-adjustable fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card-glass p-4 shadow-sm border-0 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">PENDIENTES DE REVISIÓN</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ tecnicoStats().pendientes }}</h2>
                </div>
                <div class="icon-circle bg-danger-soft text-danger" style="background: #fef2f2; color: #dc2626;">
                  <i class="bi bi-clock-history fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-8">
            <div class="p-4 rounded-4 bg-white shadow-sm border h-100">
              <h5 class="fw-bold mb-4">Atajos Rápidos</h5>
              <div class="row g-3">
                <div class="col-6 col-md-4">
                  <a routerLink="/dashboard/gestion-prestamos" class="quick-link-box p-3 rounded-4 border text-center text-decoration-none d-block">
                    <i class="bi bi-box-arrow-right fs-3 mb-2 d-block text-primary"></i>
                    <span class="small fw-bold text-dark">Gestionar Préstamos</span>
                  </a>
                </div>
                <div class="col-6 col-md-4">
                  <a routerLink="/dashboard/mis-practicas-tecnico" class="quick-link-box p-3 rounded-4 border text-center text-decoration-none d-block">
                    <i class="bi bi-plus-circle fs-3 mb-2 d-block text-success"></i>
                    <span class="small fw-bold text-dark">Nueva Guía Técnica</span>
                  </a>
                </div>
                <div class="col-6 col-md-4">
                  <a routerLink="/dashboard/practicas/revision" class="quick-link-box p-3 rounded-4 border text-center text-decoration-none d-block">
                    <i class="bi bi-clipboard-check fs-3 mb-2 d-block text-info"></i>
                    <span class="small fw-bold text-dark">Calificar Prácticas</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-4 rounded-4 bg-dark text-white shadow-lg h-100 position-relative overflow-hidden">
               <h5 class="fw-bold mb-3">Asistencia en Aula</h5>
               <p class="small opacity-75 mb-0">Recuerda que puedes gestionar las herramientas físicas desde el módulo de préstamos para agilizar las prácticas presenciales.</p>
               <i class="bi bi-shield-check position-absolute bottom-0 end-0 opacity-10 fs-1 m-3"></i>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================ -->
      <!-- VISTA PARA ESTUDIANTES -->
      <!-- ============================================================ -->
      <ng-container *ngIf="userRole() === 'estudiante'">
        <div class="hero-section mb-4 p-4 rounded-4 shadow-sm text-white">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h2 class="fw-bold mb-1">Bienvenido, {{ getFullName() }}</h2>
              <p class="small opacity-75 mb-3">Revisa tu progreso y continúa con tus prácticas.</p>
              <div class="d-flex gap-2">
                <a routerLink="/dashboard/mis-cursos" class="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm">Cursos</a>
                <a routerLink="/dashboard/mis-practicas" class="btn btn-outline-secondary text-white btn-sm rounded-pill px-3 fw-bold border-2">Prácticas</a>
              </div>
            </div>
            <div class="col-md-4 d-none d-md-block text-end pe-5">
              <i class="bi bi-mortarboard display-6 opacity-25 floating"></i>
            </div>
          </div>
        </div>

        <h5 class="fw-bold mb-4 px-2 text-dark opacity-75">
          Mi Progreso Académico
        </h5>

        <div class="row g-4 mb-5">
          <div class="col-md-3">
            <div class="card-glass p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">CURSOS</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ studentStats().resumen.cursos_activos }}</h2>
                </div>
                <div class="icon-circle bg-primary-soft text-primary">
                  <i class="bi bi-journal-text fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card-glass p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">PENDIENTES</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ studentStats().resumen.practicas_pendientes }}</h2>
                </div>
                <div class="icon-circle bg-warning-soft text-warning">
                  <i class="bi bi-clock-history fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card-glass p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">APROBADAS</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ studentStats().resumen.practicas_aprobadas }}</h2>
                </div>
                <div class="icon-circle bg-success-soft text-success">
                  <i class="bi bi-check-circle-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card-glass p-4 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted fw-bold mb-1">PROMEDIO</h6>
                  <h2 class="fw-bold m-0 text-dark">{{ studentStats().resumen.promedio_general }}</h2>
                </div>
                <div class="icon-circle bg-info-soft text-info">
                  <i class="bi bi-star-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-5">
          <div class="col-md-8">
            <div class="p-4 rounded-4 bg-white shadow-sm border h-100">
              <h5 class="fw-bold mb-4 text-dark opacity-75">
                Rendimiento por Curso
              </h5>
              <div class="chart-container" style="position: relative; height:300px;">
                <canvas #rendimientoChart></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-4 rounded-4 bg-white shadow-sm border h-100">
              <h5 class="fw-bold mb-4 text-dark opacity-75">
                Estado de Prácticas
              </h5>
              <div class="chart-container" style="position: relative; height:300px;">
                <canvas #estadoChart></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6">
            <div class="p-4 rounded-4 bg-dark text-white shadow-lg h-100 position-relative overflow-hidden">
              <h5 class="fw-bold mb-3">Laboratorio Virtual 3D</h5>
              <p class="small opacity-75 mb-4">Explora herramientas y componentes en 3D para mejorar tu aprendizaje práctico.</p>
              <button routerLink="/dashboard/herramientas" class="btn btn-outline-light btn-sm rounded-pill px-4 fw-bold">Ir al Catálogo 3D</button>
              <i class="bi bi-unity position-absolute bottom-0 end-0 opacity-25 fs-1 m-3"></i>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-4 rounded-4 bg-white shadow-sm border h-100">
              <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-robot text-primary"></i> Asistente IA
              </h5>
              <p class="small text-muted mb-4">¿Tienes dudas con una falla? Nuestro asistente inteligente te ayuda a diagnosticar.</p>
              <button routerLink="/dashboard/diagnostico-fallas" class="btn btn-primary btn-sm rounded-pill px-4 fw-bold">Consultar IA</button>
            </div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .bg-main { background-color: #f8fafc; min-height: 100vh; padding-top: 2rem !important; }
    
    .hero-section { 
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      position: relative; overflow: hidden;
      border-radius: 30px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    .hero-section::before {
      content: ''; position: absolute; top: -50%; right: -10%;
      width: 400px; height: 400px; background: rgba(255,255,255,0.03);
      border-radius: 50%;
    }
    
    .card-glass {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.5) !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    .card-glass:hover { 
      transform: translateY(-10px); 
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
      border-color: var(--primary) !important;
    }

    .icon-circle {
      width: 56px; height: 56px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    
    .card-glass:hover .icon-circle { transform: scale(1.1) rotate(5deg); }
    
    .bg-primary-soft { background: #eff6ff; color: #3b82f6; }
    .bg-info-soft { background: #ecfeff; color: #0891b2; }
    .bg-warning-soft { background: #fffbeb; color: #d97706; }
    .bg-success-soft { background: #f0fdf4; color: #16a34a; }

    .quick-link-box { 
      background: #ffffff; 
      transition: all 0.3s;
      border: 1px solid #f1f5f9 !important;
    }
    .quick-link-box:hover { 
      background: #f8fafc; 
      border-color: var(--primary) !important; 
      transform: translateY(-5px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }

    .floating { animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(5deg); } }
    
    .fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .chart-container { 
      border-radius: 20px;
      overflow: hidden;
    }
  `]
})
export class DashboardHomeComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private cursoService = inject(CursoService);
  private herramientaService = inject(HerramientaService);
  private apiService = inject(ApiService);
  private practicaService = inject(PracticaService);

  user = this.authService.currentUser;
  userRole = this.authService.userRole;

  @ViewChild('rendimientoChart') rendimientoCanvas!: ElementRef;
  @ViewChild('estadoChart') estadoCanvas!: ElementRef;

  adminStats = signal({
    cursos: 0,
    herramientas: 0,
    modelos: 0
  });

  studentStats = signal({
    resumen: {
      cursos_activos: 0,
      practicas_pendientes: 0,
      practicas_aprobadas: 0,
      promedio_general: 0
    },
    grafica_rendimiento: { labels: [], data: [] },
    grafica_estados: { labels: [], data: [] }
  });

  tecnicoStats = signal({
    cursos: 0,
    practicas: 0,
    pendientes: 0
  });

  ngOnInit(): void {
    if (this.userRole() === 'administrador' || this.userRole() === 'superadministrador') {
      this.loadAdminStats();
    } else if (this.userRole() === 'estudiante') {
      this.loadStudentStats();
    } else if (this.userRole() === 'técnico' || this.userRole() === 'tecnico') {
      this.loadTecnicoStats();
    }
  }

  ngAfterViewInit(): void {
    // Los charts se inicializan después de cargar los datos
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

  loadStudentStats(): void {
    this.apiService.getStudentStats().subscribe(data => {
      this.studentStats.set(data);
      setTimeout(() => {
        this.initCharts();
      }, 0);
    });
  }

  loadTecnicoStats(): void {
    this.cursoService.getCursosPorTecnico().subscribe(cursos => {
      this.tecnicoStats.update(s => ({ ...s, cursos: cursos.length }));
      
      this.practicaService.getPracticas().subscribe(practicas => {
        const cursoIds = cursos.map((c: any) => c.id);
        const misPracticas = practicas.filter(p => cursoIds.includes(p.id_curso));
        this.tecnicoStats.update(s => ({ ...s, practicas: misPracticas.length }));
      });
    });

    this.practicaService.getEntregasParaTecnico().subscribe(entregas => {
      const pendientes = entregas.filter(e => e.estado === 'entregada').length;
      this.tecnicoStats.update(s => ({ ...s, pendientes: pendientes }));
    });
  }

  initCharts(): void {
    if (this.rendimientoCanvas) {
      const ctx = this.rendimientoCanvas.nativeElement.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(2, 158, 164, 0.85)');
      gradient.addColorStop(1, 'rgba(2, 158, 164, 0.1)');

      new Chart(this.rendimientoCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.studentStats().grafica_rendimiento.labels,
          datasets: [{
            label: 'Promedio de Calificación',
            data: this.studentStats().grafica_rendimiento.data,
            backgroundColor: gradient,
            borderColor: '#029ea4',
            borderWidth: 2,
            borderRadius: 12,
            hoverBackgroundColor: '#017a7f'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              max: 100,
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    if (this.estadoCanvas) {
      new Chart(this.estadoCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.studentStats().grafica_estados.labels,
          datasets: [{
            data: this.studentStats().grafica_estados.data,
            backgroundColor: [
              '#f59e0b', // Pendiente
              '#10b981', // Entregada / Aprobada
              '#ef4444', // Reprobada
              '#029ea4'  // Otros
            ],
            hoverOffset: 15,
            borderWidth: 0,
            spacing: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: { size: 12, weight: 600 }
              }
            }
          },
          cutout: '70%'
        }
      });
    }
  }

  getFullName(): string {
    const u = this.user();
    if (!u) return 'Usuario';
    return u.nombre_completo || u.correo || 'Usuario';
  }
}
