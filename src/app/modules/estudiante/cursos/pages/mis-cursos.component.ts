import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { PracticaService } from '../../../../services/practica.service';

@Component({
  selector: 'app-mis-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-cursos.component.html',
  styleUrls: ['../styles/mis-cursos.component.css']
})
export class MisCursosComponent implements OnInit {
  private apiService = inject(ApiService);
  private practicaService = inject(PracticaService);
  private router = inject(Router);
  
  // Estados para cursos
  inscripciones = signal<any[]>([]);
  isLoading = signal(true);
  selectedCurso = signal<any | null>(null);

  // Estados para prácticas del curso seleccionado
  practicas = signal<any[]>([]);
  tiposPractica = signal<any[]>([]);
  isLoadingPracticas = signal(false);

  // Filtros locales para prácticas
  filterText = signal('');
  filterTipoPractica = signal('todos');
  filterEstado = signal('todos');

  // Modal de Detalles de Práctica
  showDetailsModal = signal(false);
  selectedPractica = signal<any>(null);

  // Prácticas filtradas que pertenecen al curso seleccionado
  filteredPracticas = computed(() => {
    const curso = this.selectedCurso();
    if (!curso) return [];

    return this.practicas().filter(p => {
      // Filtrar por el curso seleccionado
      const matchCurso = p.id_curso?.toString() === curso.id?.toString();
      if (!matchCurso) return false;

      // Filtro de texto
      const text = this.filterText().toLowerCase();
      const matchText = !text || 
                        p.titulo.toLowerCase().includes(text) || 
                        p.descripcion.toLowerCase().includes(text);
      
      // Filtro de tipo de práctica
      const matchTipo = this.filterTipoPractica() === 'todos' || 
                        p.id_tipo_practica?.toString() === this.filterTipoPractica();
      
      // Filtro de estado
      const matchEstado = this.filterEstado() === 'todos' || 
                         (this.filterEstado() === 'activo' && p.estado) || 
                         (this.filterEstado() === 'inactivo' && !p.estado);

      return matchText && matchTipo && matchEstado;
    });
  });

  ngOnInit() {
    this.loadMisCursos();
    this.loadTipos();
  }

  loadMisCursos() {
    this.isLoading.set(true);
    this.apiService.getMisCursos().subscribe({
      next: (data) => {
        this.inscripciones.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cursos:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadTipos() {
    this.practicaService.getTiposPractica().subscribe({
      next: (data) => this.tiposPractica.set(data),
      error: (err) => console.error('Error cargando tipos de prácticas:', err)
    });
  }

  selectCurso(curso: any) {
    this.selectedCurso.set(curso);
    this.loadMisPracticas();
  }

  deselectCurso() {
    this.selectedCurso.set(null);
    this.clearFilters();
  }

  loadMisPracticas() {
    this.isLoadingPracticas.set(true);
    this.practicaService.getMisPracticas().subscribe({
      next: (data) => {
        this.practicas.set(data);
        this.isLoadingPracticas.set(false);
      },
      error: (err) => {
        console.error('Error cargando prácticas:', err);
        this.isLoadingPracticas.set(false);
      }
    });
  }

  clearFilters() {
    this.filterText.set('');
    this.filterTipoPractica.set('todos');
    this.filterEstado.set('todos');
  }

  getSeverity(estado: boolean): string {
    return estado ? 'success' : 'danger';
  }

  startSimulation(practica: any) {
    this.router.navigate(['/dashboard/practicas/simulacion', practica.id]);
  }

  openDetails(practica: any) {
    this.selectedPractica.set(practica);
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
    this.selectedPractica.set(null);
  }

  // Helpers para recursos de las prácticas
  isVideo(recurso: any): boolean {
    if (!recurso.archivo_url) return false;
    const ext = recurso.archivo_url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mkv'].includes(ext || '');
  }

  getResourceUrl(recurso: any): string {
    if (recurso.archivo_url) {
      return recurso.archivo_url.startsWith('http') ? recurso.archivo_url : `http://localhost:8000${recurso.archivo_url}`;
    }
    return recurso.url_externa || '#';
  }

  viewResource(recurso: any) {
    window.open(this.getResourceUrl(recurso), '_blank');
  }
}
