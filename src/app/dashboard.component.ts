import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="wrapper" [class.collapsed]="isCollapsed()">
      <!-- Sidebar Dark Pro - Optimizado -->
      <nav id="sidebar" class="sidebar" [class.collapsed]="isCollapsed()">
        <div class="sidebar-header">
          <div class="logo-container">
            <div class="logo-circle overflow-hidden">
              <img src="androide.png" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="header-text" *ngIf="!isCollapsed()">
              <h5 class="fw-bold m-0 text-white">CELUCENTRO</h5>
            </div>
          </div>
        </div>

        <div class="nav-scroll">
          <ul class="nav-links list-unstyled px-3">
            <li class="mb-1">
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-link-pro" title="Dashboard">
                <i class="bi bi-grid-1x2-fill"></i> 
                <span *ngIf="!isCollapsed()">Dashboard</span>
              </a>
            </li>
            
            <li class="section-title mt-3 mb-2" *ngIf="!isCollapsed()">OPERACIONES</li>
            
            <li class="mb-1">
              <a routerLink="/clientes" routerLinkActive="active" class="nav-link-pro" title="Clientes">
                <i class="bi bi-people"></i> 
                <span *ngIf="!isCollapsed()">Clientes</span>
              </a>
            </li>
            <li class="mb-1">
              <a routerLink="/reparaciones" routerLinkActive="active" class="nav-link-pro" title="Reparaciones">
                <i class="bi bi-tools"></i> 
                <span *ngIf="!isCollapsed()">Reparaciones</span>
                <span class="badge bg-danger ms-auto rounded-pill" *ngIf="!isCollapsed()">4</span>
              </a>
            </li>
            <li class="mb-1">
              <a routerLink="/inventario" routerLinkActive="active" class="nav-link-pro" title="Inventario">
                <i class="bi bi-box-seam"></i> 
                <span *ngIf="!isCollapsed()">Inventario</span>
              </a>
            </li>

            <li class="section-title mt-3 mb-2" *ngIf="!isCollapsed()">SISTEMA</li>
            
            <li class="mb-1">
              <a routerLink="/configuracion" routerLinkActive="active" class="nav-link-pro" title="Configuración">
                <i class="bi bi-gear"></i> 
                <span *ngIf="!isCollapsed()">Configuración</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main id="content" class="main-content">
        <!-- Navbar Superior Pro -->
        <nav class="navbar navbar-expand navbar-light pro-navbar sticky-top">
          <div class="container-fluid px-4">
            <div class="d-flex align-items-center">
              <button (click)="toggleSidebar()" class="btn btn-icon me-3 toggle-btn" [class.rotated]="isCollapsed()">
                <i class="bi bi-list fs-4"></i>
              </button>
              
              <div class="search-box position-relative d-none d-md-block">
                <i class="bi bi-search position-absolute text-muted" style="left: 15px; top: 12px;"></i>
                <input type="text" class="form-control ps-5 rounded-pill border-0 shadow-sm" placeholder="Buscar registros..." style="width: 300px;">
              </div>
            </div>

            <div class="ms-auto d-flex align-items-center gap-3">
              <div class="user-nav-pill d-flex align-items-center bg-white border rounded-pill p-1 pe-3 shadow-sm shadow-hover">
                 <div class="avatar-nav bg-primary-gradient me-2 text-white">
                   {{ user()?.username?.charAt(0).toUpperCase() }}
                 </div>
                 <div class="user-meta d-none d-md-block me-3">
                    <div class="fw-bold small lh-1">{{ user()?.username }}</div>
                    <div class="text-muted small" style="font-size: 0.65rem;">Administrador</div>
                 </div>
                 <button (click)="onLogout()" class="btn btn-logout-circle shadow-sm" title="Cerrar Sesión">
                   <i class="bi bi-power"></i>
                 </button>
              </div>
            </div>
          </div>
        </nav>

        <div class="p-4 container-fluid fade-in">
          <div class="welcome-header mb-4">
            <h2 class="fw-bold m-0 mt-2">¡Hola, {{ user()?.username }}! </h2>
            <p class="text-secondary m-0">Bienvenido al panel central de Celucentro.</p>
          </div>

          <!-- Stats -->
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
      </main>
    </div>
  `,
  styles: [`
    :host { --sidebar-bg: #111827; --primary: #6366f1; }
    .wrapper { display: flex; align-items: stretch; min-height: 100vh; background: #f9fafb; font-family: 'Inter', sans-serif; }
    
    .sidebar { 
      min-width: 260px; max-width: 260px; background: var(--sidebar-bg); 
      display: flex; flex-direction: column; transition: all 0.4s;
      border-right: 1px solid rgba(255,255,255,0.05);
    }
    .sidebar.collapsed { min-width: 85px; max-width: 85px; }

    /* Header Compacto */
    .sidebar-header { padding: 24px 20px; }
    .logo-container { display: flex; align-items: center; gap: 12px; justify-content: flex-start; }
    .sidebar.collapsed .logo-container { justify-content: center; padding: 0; gap: 0; }
    
    .logo-circle { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .bg-primary-gradient { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); }
    
    .header-text h5 { line-height: 1; font-size: 1.1rem; }
    .text-secondary-light { color: #94a3b8; font-size: 0.75rem; }

    /* Navegación */
    .nav-scroll { flex-grow: 1; overflow-y: auto; overflow-x: hidden; }
    .nav-link-pro { 
      color: #9ca3af; padding: 10px 14px; border-radius: 8px; 
      text-decoration: none; display: flex; align-items: center; gap: 12px; 
      transition: all 0.2s; white-space: nowrap;
    }
    
    .sidebar.collapsed .nav-link-pro { justify-content: center; padding: 12px 0; }
    .nav-link-pro i { font-size: 1.25rem; flex-shrink: 0; }

    .nav-link-pro:hover, .nav-link-pro.active { background: rgba(255,255,255,0.05); color: #fff; }
    .nav-link-pro.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
    
    .section-title { color: #475569; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; opacity: 0.8; }

    /* Resto de estilos */
    .main-content { flex-grow: 1; height: 100vh; overflow-y: auto; background: #f8f9fa; }
    .pro-navbar { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid #e5e7eb; height: 75px; }
    .btn-icon { width: 42px; height: 42px; border-radius: 12px; border: none; background: transparent; color: #6b7280; transition: 0.2s; }
    .btn-icon:hover { background: #f3f4f6; color: var(--primary); }
    
    .avatar-nav { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .btn-logout-circle { width: 32px; height: 32px; border-radius: 50%; border: none; background: #fff; color: #ef4444; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-logout-circle:hover { background: #ef4444; color: #fff; transform: rotate(90deg); }

    .stat-card { background: white; border-radius: 20px; border: 1px solid rgba(0,0,0,0.03); transition: 0.3s; }
    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 20px -5px rgba(0,0,0,0.05); }
    .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .bg-indigo-light { background: #eef2ff; } .text-indigo { color: #6366f1; }
    .bg-emerald-light { background: #ecfdf5; } .text-emerald { color: #10b981; }

    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  isCollapsed = signal(false);

  ngOnInit() {
    this.authService.getUserProfile().subscribe();
  }

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
