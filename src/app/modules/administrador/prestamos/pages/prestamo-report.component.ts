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

  filteredPrestamos = computed(() => {
    let data = this.prestamos();
    const text = this.filterText().toLowerCase();
    const estado = this.filterEstado();

    if (text) {
      data = data.filter(p => 
        p.estudiante_nombre.toLowerCase().includes(text) || 
        p.herramienta_nombre.toLowerCase().includes(text) ||
        p.tecnico_nombre.toLowerCase().includes(text)
      );
    }

    if (estado !== 'todos') {
      data = data.filter(p => p.estado === estado);
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

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
        case 'prestado': return 'bg-warning text-dark';
        case 'parcial': return 'bg-info text-white';
        case 'devuelto': return 'bg-success text-white';
        default: return 'bg-secondary text-white';
    }
  }
}
