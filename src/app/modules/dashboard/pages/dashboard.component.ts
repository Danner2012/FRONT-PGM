import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../styles/dashboard.component.css'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: '1' })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('sidebarAnimation', [
      state('full', style({ width: '260px' })),
      state('collapsed', style({ width: '85px' })),
      transition('full <=> collapsed', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  userRole = this.authService.userRole;
  isCollapsed = signal(false);
  activeAccordion = signal<string | null>(null);

  // Lógica de acceso por roles (Insensible a mayúsculas para mayor seguridad)
  private currentRole = computed(() => this.userRole()?.toLowerCase() || '');

  canSeeOperations = computed(() => this.currentRole() !== 'estudiante');
  canSeeClientes = computed(() => ['superadministrador'].includes(this.currentRole()));
  canSeeReparaciones = computed(() => ['superadministrador', 'técnico', 'tecnico'].includes(this.currentRole()));
  canSeeInventario = computed(() => ['superadministrador', 'técnico', 'tecnico'].includes(this.currentRole()));
  canSeeConfiguracion = computed(() => this.currentRole() === 'superadministrador');
  isEstudiante = computed(() => this.currentRole() === 'estudiante');
  isAdministrador = computed(() => this.currentRole() === 'administrador');
  isTecnico = computed(() => ['técnico', 'tecnico'].includes(this.currentRole()));
  canSeeUserManagement = computed(() => ['superadministrador', 'administrador'].includes(this.currentRole()));
  canSeePrestamos = computed(() => ['superadministrador', 'administrador', 'técnico', 'tecnico'].includes(this.currentRole()));

  ngOnInit() {
    this.authService.getUserProfile().subscribe();
  }

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
    if (this.isCollapsed()) {
      this.activeAccordion.set(null);
    }
  }

  toggleAccordion(name: string) {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
    }
    this.activeAccordion.update(val => val === name ? null : name);
  }

  isAccordionOpen(name: string): boolean {
    return this.activeAccordion() === name;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
