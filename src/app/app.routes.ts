import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/pages/login.component';
import { DashboardComponent } from './modules/dashboard/pages/dashboard.component';
import { DashboardHomeComponent } from './modules/dashboard/pages/dashboard-home.component';
import { DiagnosticoFallasComponent } from './modules/estudiante/diagnostico_fallas/diagnostico-fallas.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: DashboardHomeComponent },
      { path: 'diagnostico-fallas', component: DiagnosticoFallasComponent },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
