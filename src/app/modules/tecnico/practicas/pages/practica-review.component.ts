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

  // Previsualización de Imagen (Lightbox)
  showLightbox = signal(false);
  lightboxUrl = signal('');

  // Control de previsualización interna
  activePreviewId = signal<number | null>(null);
  message = signal<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

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
      estado: entrega.estado === 'entregada' ? 'aprobada' : (entrega.estado === 'pendiente' ? 'aprobada' : entrega.estado)
    };
    this.showReviewModal.set(true);
  }

  closeReview() {
    this.showReviewModal.set(false);
    this.selectedEntrega.set(null);
  }

  getEvidenceUrl(ev: any): string {
    if (!ev.archivo) return '';
    return ev.archivo.startsWith('http') ? ev.archivo : `http://localhost:8000${ev.archivo}`;
  }

  isImage(url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0];
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(cleanUrl);
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0];
    return /\.(mp4|webm|ogg|mkv|mov)$/i.test(cleanUrl);
  }

  isPdf(url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0];
    return cleanUrl.toLowerCase().endsWith('.pdf');
  }

  openLightbox(url: string) {
    this.lightboxUrl.set(url);
    this.showLightbox.set(true);
  }

  closeLightbox() {
    this.showLightbox.set(false);
    this.lightboxUrl.set('');
  }

  viewResource(ev: any) {
    const url = this.getEvidenceUrl(ev);
    if (url) window.open(url, '_blank');
  }

  submitReview() {
    this.message.set({ text: '', type: null });
    const entregaActual = this.selectedEntrega();
    if (!entregaActual) return;

    // VALIDACIONES
    if (this.reviewForm.calificacion === null || this.reviewForm.calificacion === undefined) {
      this.message.set({ text: 'La calificación es obligatoria', type: 'error' });
      return;
    }

    if (this.reviewForm.calificacion < 0 || this.reviewForm.calificacion > 100) {
      this.message.set({ text: 'La calificación debe estar entre 0 y 100', type: 'error' });
      return;
    }

    if (!this.reviewForm.comentario || this.reviewForm.comentario.trim().length < 5) {
      this.message.set({ text: 'Debes ingresar una retroalimentación técnica (mín. 5 caracteres)', type: 'error' });
      return;
    }

    const entregaId = entregaActual.id;
    
    Swal.fire({
      title: '¿Confirmar calificación?',
      text: `Calificarás con ${this.reviewForm.calificacion}/100 y estado ${this.reviewForm.estado.toUpperCase()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, calificar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.calificarPractica(entregaId, this.reviewForm).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Práctica calificada correctamente', 'success');
            this.showReviewModal.set(false);
            this.loadEntregas();
          },
          error: (err: any) => {
            const errorMsg = err.error?.error || 'No se pudo guardar la calificación';
            this.message.set({ text: errorMsg, type: 'error' });
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
