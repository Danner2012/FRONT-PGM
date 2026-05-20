import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-practica-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practica-review.component.html',
  styleUrls: ['../styles/practica-review.component.css']
})
export class PracticaReviewComponent implements OnInit {
  private practicaService = inject(PracticaService);

  entregas = signal<any[]>([]);
  isLoading = signal(true);
  
  // Filtros
  filterText = signal('');
  filterCurso = signal('todos');
  filterEstado = signal('todos');

  selectedEntrega = signal<any>(null);
  showReviewModal = signal(false);

  // Formulario de Calificación
  reviewForm = {
    calificacion: 0,
    comentario: '',
    estado: 'aprobada'
  };

  // Cursos únicos para el filtro
  cursosDisponibles = computed(() => {
    const nombres = this.entregas().map(e => ({ 
      id: e.practica_detalle?.id_curso, 
      nombre: e.practica_detalle?.curso_nombre 
    })).filter(c => c.id);
    
    return Array.from(new Map(nombres.map(c => [c.id, c])).values());
  });

  // Entregas filtradas
  filteredEntregas = computed(() => {
    return this.entregas().filter(e => {
      const text = this.filterText().toLowerCase();
      const matchText = !text || 
                        e.estudiante_nombre?.toLowerCase().includes(text) || 
                        e.practica_detalle?.titulo?.toLowerCase().includes(text);
      
      const matchCurso = this.filterCurso() === 'todos' || 
                         e.practica_detalle?.id_curso?.toString() === this.filterCurso();
      
      const matchEstado = this.filterEstado() === 'todos' || e.estado === this.filterEstado();

      return matchText && matchCurso && matchEstado;
    });
  });

  ngOnInit() {
    this.loadEntregas();
  }

  loadEntregas() {
    this.isLoading.set(true);
    this.practicaService.getEntregasParaTecnico().subscribe({
      next: (data: any[]) => {
        this.entregas.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando entregas:', err);
        this.isLoading.set(false);
        Swal.fire('Error', 'No se pudieron cargar las prácticas entregadas', 'error');
      }
    });
  }

  clearFilters() {
    this.filterText.set('');
    this.filterCurso.set('todos');
    this.filterEstado.set('todos');
  }

  openReview(entrega: any) {
    this.selectedEntrega.set(entrega);
    this.reviewForm = {
      calificacion: entrega.calificacion || 0,
      comentario: entrega.comentario_tecnico || '',
      estado: entrega.estado === 'entregada' ? 'aprobada' : entrega.estado
    };
    this.showReviewModal.set(true);
  }

  closeReview() {
    this.showReviewModal.set(false);
    this.selectedEntrega.set(null);
  }

  submitReview() {
    if (!this.selectedEntrega()) return;

    Swal.fire({
      title: '¿Confirmar calificación?',
      text: 'Se enviará la retroalimentación al estudiante',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, calificar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.calificarPractica(this.selectedEntrega().id, this.reviewForm).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Práctica calificada correctamente', 'success');
            this.loadEntregas();
            this.closeReview();
          },
          error: (err: any) => {
            console.error('Error al calificar:', err);
            Swal.fire('Error', 'No se pudo guardar la calificación', 'error');
          }
        });
      }
    });
  }

  getStatusBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-secondary';
      case 'entregada': return 'bg-info text-white';
      case 'aprobada': return 'bg-success';
      case 'reprobada': return 'bg-danger';
      default: return 'bg-dark';
    }
  }
}
