import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import { CursoService } from '../../../../services/curso.service';
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
  private cursoService = inject(CursoService);

  entregas = signal<any[]>([]);
  cursosAsignados = signal<any[]>([]);
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
    return this.cursosAsignados().map(c => ({
      id: c.id,
      nombre: c.nombre
    }));
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
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    // Cargar cursos y entregas en paralelo
    this.cursoService.getCursosPorTecnico().subscribe({
      next: (cursos) => {
        this.cursosAsignados.set(cursos);
        this.loadEntregas();
      },
      error: (err) => {
        console.error('Error cargando cursos:', err);
        this.loadEntregas(); // Intentar cargar entregas aunque fallen los cursos
      }
    });
  }

  loadEntregas() {
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
    console.log('Abriendo revisión para entrega:', entrega);
    this.selectedEntrega.set(entrega);
    this.reviewForm = {
      calificacion: entrega.calificacion || 0,
      comentario: entrega.comentario_tecnico || '',
      estado: entrega.estado === 'entregada' ? 'aprobada' : entrega.estado
    };
    this.showReviewModal.set(true);
    console.log('Estado showReviewModal:', this.showReviewModal());
  }

  closeReview() {
    this.showReviewModal.set(false);
    this.selectedEntrega.set(null);
  }

  submitReview() {
    const entregaActual = this.selectedEntrega();
    if (!entregaActual) {
      console.warn('No hay entrega seleccionada para calificar');
      return;
    }

    const entregaId = entregaActual.id;
    
    // Ocultamos el modal de revisión para que no se superponga con la confirmación
    this.showReviewModal.set(false);

    Swal.fire({
      title: '¿Confirmar calificación?',
      text: 'Se enviará la retroalimentación al estudiante',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, calificar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false // Evita cerrar por error y perder el estado
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Confirmación recibida, llamando al servicio para ID:', entregaId);
        this.practicaService.calificarPractica(entregaId, this.reviewForm).subscribe({
          next: (res) => {
            console.log('Respuesta exitosa del servidor:', res);
            Swal.fire('Éxito', 'Práctica calificada correctamente', 'success');
            this.loadEntregas();
            this.selectedEntrega.set(null); // Limpiamos la selección tras éxito
            console.log('Vista actualizada');
          },
          error: (err: any) => {
            console.error('Error al calificar (detalle completo):', err);
            const errorMsg = err.error?.error || 'No se pudo guardar la calificación';
            Swal.fire('Error', errorMsg, 'error');
            this.showReviewModal.set(true); // Reabrimos el modal si hubo error para corregir
          }
        });
      } else {
        // Si el usuario cancela la confirmación, reabrimos el modal con sus datos intactos
        console.log('Calificación cancelada, reabriendo formulario...');
        this.showReviewModal.set(true);
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
