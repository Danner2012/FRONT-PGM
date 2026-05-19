import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PracticaService } from '../../../../services/practica.service';
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

  prestamos = signal<any[]>([]);
  filterText = signal('');
  filterEstado = signal('todos');
  filterFecha = signal('');

  // Signals para modal de detalles
  showDetailsModal = signal(false);
  selectedPrestamo = signal<any>(null);

  filteredPrestamos = computed(() => {
    let data = this.prestamos();
    const text = this.filterText().toLowerCase();
    const estado = this.filterEstado();
    const fecha = this.filterFecha();

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

    if (fecha) {
      data = data.filter(p => {
        const pFecha = new Date(p.fecha_prestamo).toISOString().split('T')[0];
        return pFecha === fecha;
      });
    }

    return data;
  });

  ngOnInit() {
    this.loadPrestamos();
  }

  loadPrestamos() {
    this.practicaService.getPrestamos().subscribe(data => {
      this.prestamos.set(data);
    });
  }

  clearFilters() {
    this.filterText.set('');
    this.filterEstado.set('todos');
    this.filterFecha.set('');
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
