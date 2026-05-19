import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-mis-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-prestamos.component.html',
  styleUrls: ['../styles/mis-prestamos.component.css']
})
export class MisPrestamosComponent implements OnInit {
  private practicaService = inject(PracticaService);
  private authService = inject(AuthService);

  prestamos = signal<any[]>([]);
  user = this.authService.currentUser;

  // Signals para filtros
  filterHerramienta = signal<string>('');
  filterEstado = signal<string>('todos');
  filterFecha = signal<string>('');
  
  // Lista filtrada reactiva
  filteredPrestamos = computed(() => {
    let data = this.prestamos();
    
    // Filtro por Herramienta (busca en todos los detalles)
    if (this.filterHerramienta()) {
      const search = this.filterHerramienta().toLowerCase();
      data = data.filter(p => {
        // Buscar en el campo principal
        if (p.herramienta_nombre?.toLowerCase().includes(search)) return true;
        // Buscar en los detalles
        return p.detalles?.some((det: any) => det.herramienta_nombre?.toLowerCase().includes(search));
      });
    }

    // Filtro por Estado
    if (this.filterEstado() !== 'todos') {
      data = data.filter(p => p.estado === this.filterEstado());
    }

    // Filtro por Fecha
    if (this.filterFecha()) {
      data = data.filter(p => {
        const fechaPrestamo = new Date(p.fecha_prestamo).toISOString().split('T')[0];
        return fechaPrestamo === this.filterFecha();
      });
    }

    return data;
  });

  ngOnInit() {
    this.loadPrestamos();
  }

  loadPrestamos() {
    this.practicaService.getPrestamos().subscribe(data => {
      const currentUser = this.authService.currentUser();
      if (currentUser && currentUser.perfil_id) {
        this.prestamos.set(data.filter((p: any) => p.estudiante_ci === currentUser.ci || p.id_estudiante === currentUser.perfil_id));
      }
    });
  }

  clearFilters() {
    this.filterHerramienta.set('');
    this.filterEstado.set('todos');
    this.filterFecha.set('');
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
        case 'prestado': return 'badge-active';
        case 'parcial': return 'badge-warning';
        case 'devuelto': return 'badge-success';
        default: return 'badge-inactive';
    }
  }
}
