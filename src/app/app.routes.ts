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
      { path: 'tecnicos', component: TecnicoManagementComponent },
      { path: 'estudiantes', component: EstudianteManagementComponent },
      { path: 'cursos', component: CursoManagementComponent },
      { path: 'inscripciones', component: InscripcionManagementComponent },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
