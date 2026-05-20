import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PracticaService } from '../../../../services/practica.service';
import { CursoService } from '../../../../services/curso.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prestamo-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prestamo-report.component.html',
  styleUrls: ['../styles/prestamo-report.component.css']
})
export class PrestamoReportComponent implements OnInit {
  private practicaService = inject(PracticaService);
  private cursoService = inject(CursoService);

  prestamos = signal<any[]>([]);
  cursos = signal<any[]>([]);
  
  // Signals de Filtrado
  filterText = signal('');
  filterEstado = signal('todos');
  filterFechaInicio = signal('');
  filterFechaFin = signal('');
  filterCurso = signal('todos');

  // Signals para modal de detalles
  showDetailsModal = signal(false);
  selectedPrestamo = signal<any>(null);

  filteredPrestamos = computed(() => {
    let data = this.prestamos();
    const text = this.filterText().toLowerCase();
    const estado = this.filterEstado();
    const fechaInicio = this.filterFechaInicio();
    const fechaFin = this.filterFechaFin();
    const cursoId = this.filterCurso();

    if (text) {
      data = data.filter(p => 
        p.estudiante_nombre?.toLowerCase().includes(text) || 
        p.estudiante_ci?.toLowerCase().includes(text) ||
        p.tecnico_nombre?.toLowerCase().includes(text) ||
        p.detalles?.some((d: any) => d.herramienta_nombre?.toLowerCase().includes(text)) ||
        p.herramienta_nombre?.toLowerCase().includes(text)
      );
    }

    if (estado !== 'todos') {
      data = data.filter(p => p.estado === estado);
    }

    if (cursoId !== 'todos') {
      data = data.filter(p => p.id_curso?.toString() === cursoId);
    }

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      data = data.filter(p => new Date(p.fecha_prestamo) >= start);
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59);
      data = data.filter(p => new Date(p.fecha_prestamo) <= end);
    }

    return data;
  });

  ngOnInit() {
    this.loadPrestamos();
    this.loadCursos();
  }

  loadPrestamos() {
    this.practicaService.getPrestamos().subscribe(data => {
      this.prestamos.set(data);
    });
  }

  loadCursos() {
    this.cursoService.getCursos().subscribe(data => {
      this.cursos.set(data);
    });
  }

  clearFilters() {
    this.filterText.set('');
    this.filterEstado.set('todos');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
    this.filterCurso.set('todos');
  }

  openDetails(prestamo: any) {
    this.selectedPrestamo.set(prestamo);
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
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
