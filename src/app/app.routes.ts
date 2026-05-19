import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/pages/login.component';
import { DashboardComponent } from './modules/dashboard/pages/dashboard.component';
import { DashboardHomeComponent } from './modules/dashboard/pages/dashboard-home.component';
import { DiagnosticoFallasComponent } from './modules/estudiante/diagnostico_fallas/pages/diagnostico-fallas.component';
import { TecnicoManagementComponent } from './modules/administrador/gestion_tecnicos/pages/tecnico-management.component';
import { EstudianteManagementComponent } from './modules/administrador/gestion_estudiantes/pages/estudiante-management.component';
import { CursoManagementComponent } from './modules/administrador/cursos/pages/curso-management.component';
import { InscripcionManagementComponent } from './modules/administrador/inscripciones/pages/inscripcion-management.component';
import { authGuard } from './guards/auth.guard';

import { MisCursosComponent } from './modules/estudiante/cursos/pages/mis-cursos.component';
import { MisPracticasComponent } from './modules/estudiante/practicas/pages/mis-practicas.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: DashboardHomeComponent },
      { path: 'diagnostico-fallas', component: DiagnosticoFallasComponent },
      { path: 'mis-cursos', component: MisCursosComponent },
      { path: 'mis-practicas', component: MisPracticasComponent },
      { path: 'tecnicos', component: TecnicoManagementComponent },
      { path: 'estudiantes', component: EstudianteManagementComponent },
      { path: 'cursos', component: CursoManagementComponent },
      { path: 'inscripciones', component: InscripcionManagementComponent },
      { 
        path: 'gestion-prestamos', 
        loadComponent: () => import('./modules/tecnico/prestamos/pages/prestamo-management.component').then(m => m.PrestamoManagementComponent) 
      },
      { 
        path: 'mis-prestamos', 
        loadComponent: () => import('./modules/estudiante/prestamos/pages/mis-prestamos.component').then(m => m.MisPrestamosComponent) 
      },
      { 
        path: 'reporte-prestamos', 
        loadComponent: () => import('./modules/administrador/prestamos/pages/prestamo-report.component').then(m => m.PrestamoReportComponent) 
      },
      { 
        path: 'herramientas', 
        loadComponent: () => import('./modules/administrador/herramientas/pages/herramienta-management.component').then(m => m.HerramientaManagementComponent) 
      },
      { path: 'practicas', 
        loadComponent: () => import('./modules/administrador/practicas/pages/practica-management.component').then(m => m.PracticaManagementComponent) 
      },
      { 
        path: 'practicas/simulacion/:id', 
        loadComponent: () => import('./modules/estudiante/practicas/components/simulation-workspace/simulation-workspace.component').then(m => m.SimulationWorkspaceComponent) 
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
