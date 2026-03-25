import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../styles/dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  userRole = this.authService.userRole;
  isCollapsed = signal(false);
  activeAccordion = signal<string | null>(null);

  // Lógica de acceso por roles
  canSeeOperations = computed(() => this.userRole() !== 'estudiante');
  canSeeClientes = computed(() => ['superadministrador', 'administrador'].includes(this.userRole() || ''));
  canSeeReparaciones = computed(() => ['superadministrador', 'administrador', 'técnico'].includes(this.userRole() || ''));
  canSeeInventario = computed(() => ['superadministrador', 'administrador', 'técnico'].includes(this.userRole() || ''));
  canSeeConfiguracion = computed(() => this.userRole() === 'superadministrador');
  isEstudiante = computed(() => this.userRole() === 'estudiante');

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
