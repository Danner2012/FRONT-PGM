import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';

@Component({
  selector: 'app-mis-practicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-practicas.component.html',
  styleUrls: ['../styles/mis-practicas.component.css']
})
export class MisPracticasComponent implements OnInit {
  private practicaService = inject(PracticaService);

  practicas = signal<any[]>([]);
  isLoading = signal(true);
  
  // Filtros
  filterText = signal('');
  filterCurso = signal('todos');
  filterEstado = signal('todos');

  // Cursos únicos para el filtro
  cursosDisponibles = computed(() => {
    const nombres = this.practicas().map(p => ({ id: p.id_curso, nombre: p.curso_nombre }));
    // Eliminar duplicados por ID
    return Array.from(new Map(nombres.map(c => [c.id, c])).values());
  });

  // Prácticas filtradas
  filteredPracticas = computed(() => {
    return this.practicas().filter(p => {
      const text = this.filterText().toLowerCase();
      const matchText = !text || 
                        p.titulo.toLowerCase().includes(text) || 
                        p.curso_nombre.toLowerCase().includes(text) ||
                        p.descripcion.toLowerCase().includes(text);
      
      const matchCurso = this.filterCurso() === 'todos' || p.id_curso.toString() === this.filterCurso();
      
      const matchEstado = this.filterEstado() === 'todos' || 
                         (this.filterEstado() === 'activo' && p.estado) || 
                         (this.filterEstado() === 'inactivo' && !p.estado);

      return matchText && matchCurso && matchEstado;
    });
  });

  ngOnInit() {
    this.loadMisPracticas();
  }

  loadMisPracticas() {
    this.isLoading.set(true);
    this.practicaService.getMisPracticas().subscribe({
      next: (data) => {
        this.practicas.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando prácticas:', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilters() {
    this.filterText.set('');
    this.filterCurso.set('todos');
    this.filterEstado.set('todos');
  }

  getSeverity(estado: boolean): string {
    return estado ? 'success' : 'danger';
  }
}
