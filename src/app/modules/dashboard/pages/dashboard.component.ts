import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../styles/dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  userRole = this.authService.userRole;
  isCollapsed = signal(false);

  // Logic for role-based access
  canSeeOperations = computed(() => this.userRole() !== 'estudiante');
  canSeeClientes = computed(() => ['superadministrador', 'administrador'].includes(this.userRole() || ''));
  canSeeReparaciones = computed(() => ['superadministrador', 'administrador', 'técnico'].includes(this.userRole() || ''));
  canSeeInventario = computed(() => ['superadministrador', 'administrador', 'técnico'].includes(this.userRole() || ''));
  canSeeConfiguracion = computed(() => this.userRole() === 'superadministrador');

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
