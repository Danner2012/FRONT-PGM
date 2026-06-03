import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import { ApiService } from '../../../../services/api.service';
import { HerramientaService } from '../../../../services/herramienta.service';
import { CursoService } from '../../../../services/curso.service';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-practica-tecnico-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practica-tecnico-management.component.html',
  styleUrls: ['../styles/practica-tecnico-management.component.css']
})
export class PracticaTecnicoManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicaService = inject(PracticaService);
  private apiService = inject(ApiService);
  private herramientaService = inject(HerramientaService);
  private cursoService = inject(CursoService);
  private authService = inject(AuthService);
  
  cursoId = signal<number | null>(null);
  cursoNombre = signal<string>('');
  activeTab = signal<'practicas' | 'revision'>('practicas');

  // Datos Prácticas
  practicas = signal<any[]>([]);
  cursos = signal<any[]>([]);
  herramientas = signal<any[]>([]);
  tiposRecurso = signal<any[]>([]);
  tiposPractica = signal<any[]>([]);
  
  // Datos Revisión
  entregas = signal<any[]>([]);
  isLoadingRevision = signal(false);
  selectedEntrega = signal<any>(null);
  showReviewModal = signal(false);
  reviewForm = { calificacion: 0, comentario: '', estado: 'aprobada' };

  // Previsualización de Imagen (Lightbox)
  showLightbox = signal(false);
  lightboxUrl = signal('');
  activePreviewId = signal<number | null>(null);

  // Filtros Prácticas
  filterTitulo = signal('');
  filterEstado = signal('todos');
  
  // Filtros Revisión
  filterTextRevision = signal('');
  filterEstadoRevision = signal('todos');
  filterPracticaRevision = signal('todos');
  filterCategoriaRevision = signal('todos');

  filteredPracticas = computed(() => {
    return this.practicas().filter(p => {
      const matchTitulo = p.titulo.toLowerCase().includes(this.filterTitulo().toLowerCase());
      const matchEstado = this.filterEstado() === 'todos' || 
                         (this.filterEstado() === 'activo' && p.estado) || 
                         (this.filterEstado() === 'inactivo' && !p.estado);
      return matchTitulo && matchEstado;
    });
  });

  filteredEntregas = computed(() => {
    return this.entregas().filter(e => {
      const text = this.filterTextRevision().toLowerCase();
      const matchText = !text || 
                        e.estudiante_nombre?.toLowerCase().includes(text) || 
                        e.practica_detalle?.titulo?.toLowerCase().includes(text);
      const matchEstado = this.filterEstadoRevision() === 'todos' || e.estado === this.filterEstadoRevision();
      const matchPractica = this.filterPracticaRevision() === 'todos' || e.id_practica?.toString() === this.filterPracticaRevision();
      const matchCategoria = this.filterCategoriaRevision() === 'todos' || e.practica_detalle?.id_tipo_practica?.toString() === this.filterCategoriaRevision();
      return matchText && matchEstado && matchPractica && matchCategoria;
    });
  });

  // Modales y Mensajes
  showPracticaModal = signal(false);
  isEditing = signal(false);
  selectedPractica = signal<any>(null);
  showViewResourcesModal = signal(false);
  selectedPracticaDetails = signal<any>(null);
  message = signal<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  practicaForm = { id_curso: '', id_tipo_practica: '', titulo: '', descripcion: '', estado: true };
  showRecursoModal = signal(false);
  isEditingRecurso = signal(false);
  selectedRecursoId = signal<number | null>(null);
  recursoForm = { id_practica: null as number | null, id_tipo_recurso: '', titulo: '', descripcion: '', url_externa: '', archivo: null as File | null };
  showHerramientaModal = signal(false);
  isEditingHerramienta = signal(false);
  selectedPHId = signal<number | null>(null);
  phForm = { id_practica: null as number | null, id_herramienta: '', cantidad_requerida: 1 };

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cursoId.set(+params['id']);
        this.loadData();
        this.loadEntregas();
      }
    });
  }

  loadData() {
    if (!this.cursoId()) return;
    this.practicaService.getPracticas().subscribe(data => {
      const filtered = data.filter(p => p.id_curso === this.cursoId());
      this.practicas.set(filtered);
      this.cursoService.getCursosPorTecnico().subscribe(cursos => {
        const current = cursos.find((c: any) => c.id === this.cursoId());
        if (current) this.cursoNombre.set(current.nombre);
        this.cursos.set(cursos);
      });
    });
    this.herramientaService.getHerramientas().subscribe(data => this.herramientas.set(data));
    this.practicaService.getTiposRecurso().subscribe(data => this.tiposRecurso.set(data));
    this.practicaService.getTiposPractica().subscribe(data => this.tiposPractica.set(data));
  }

  loadEntregas() {
    if (!this.cursoId()) return;
    this.isLoadingRevision.set(true);
    this.practicaService.getEntregasParaTecnico().subscribe({
      next: (data: any[]) => {
        // Filtrar entregas solo de este curso
        const filtered = data.filter(e => e.practica_detalle?.id_curso === this.cursoId());
        this.entregas.set(filtered);
        this.isLoadingRevision.set(false);
      },
      error: () => this.isLoadingRevision.set(false)
    });
  }

  goBack() { this.router.navigate(['/dashboard/mis-practicas-tecnico']); }

  togglePracticaStatus(practica: any) {
    const accion = practica.estado ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿Desea ${accion} esta práctica?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.toggleStatus(practica.id).subscribe({
          next: () => { this.loadData(); Swal.fire('Éxito', '', 'success'); },
          error: (err) => this.showError(err, 'Error')
        });
      }
    });
  }

  openViewResourcesModal(practica: any) {
    this.message.set({ text: '', type: null });
    this.selectedPracticaDetails.set(practica);
    this.showViewResourcesModal.set(true);
  }

  viewResource(recurso: any) {
    const url = this.getResourceUrl(recurso);
    if (url) window.open(url, '_blank');
  }

  getResourceUrl(recurso: any): string | null {
    if (recurso.url_externa) return recurso.url_externa;
    if (recurso.archivo_local) return recurso.archivo_local.startsWith('http') ? recurso.archivo_local : `http://localhost:8000${recurso.archivo_local}`;
    return null;
  }

  isVideo(recurso: any): boolean {
    const url = this.getResourceUrl(recurso);
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || (recurso.tipo_recurso_nombre?.toLowerCase().includes('video'));
  }

  openPracticaModal(practica?: any) {
    if (practica) {
      this.isEditing.set(true);
      this.selectedPractica.set(practica);
      this.practicaForm = { id_curso: practica.id_curso.toString(), id_tipo_practica: practica.id_tipo_practica, titulo: practica.titulo, descripcion: practica.descripcion, estado: practica.estado };
    } else {
      this.isEditing.set(false);
      this.practicaForm = { id_curso: this.cursoId()?.toString() || '', id_tipo_practica: '', titulo: '', descripcion: '', estado: true };
    }
    this.showPracticaModal.set(true);
  }

  savePractica() {
    this.practicaForm.id_curso = this.cursoId()?.toString() || '';
    if (!this.practicaForm.id_tipo_practica || !this.practicaForm.titulo) return;
    const obs = this.isEditing() ? this.practicaService.updatePractica(this.selectedPractica().id, this.practicaForm) : this.practicaService.createPractica(this.practicaForm);
    obs.subscribe({
      next: () => { this.loadData(); this.showPracticaModal.set(false); },
      error: (err) => this.showError(err, 'Error')
    });
  }

  deletePractica(id: number) {
    this.practicaService.deletePractica(id).subscribe(() => this.loadData());
  }

  openReview(entrega: any) {
    this.selectedEntrega.set(entrega);
    this.reviewForm = { 
      calificacion: entrega.calificacion || 0, 
      comentario: entrega.comentario_tecnico || '', 
      estado: entrega.estado === 'entregada' ? 'aprobada' : (entrega.estado === 'pendiente' ? 'aprobada' : entrega.estado)
    };
    this.showReviewModal.set(true);
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

  isVideoFile(url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0];
    return /\.(mp4|webm|ogg|mkv|mov)$/i.test(cleanUrl);
  }

  isPdfFile(url: string): boolean {
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
      case 'entregada': return 'bg-info';
      case 'aprobada': return 'bg-success';
      case 'reprobada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  openRecursoModal(practicaId: number, recurso?: any) {
    if (recurso) {
      this.isEditingRecurso.set(true);
      this.selectedRecursoId.set(recurso.id);
      this.recursoForm = { id_practica: practicaId, id_tipo_recurso: recurso.id_tipo_recurso, titulo: recurso.titulo, descripcion: recurso.descripcion, url_externa: recurso.url_externa || '', archivo: null };
      this.showViewResourcesModal.set(false);
    } else {
      this.isEditingRecurso.set(false);
      this.selectedRecursoId.set(null);
      this.recursoForm = { id_practica: practicaId, id_tipo_recurso: '', titulo: '', descripcion: '', url_externa: '', archivo: null };
    }
    this.showRecursoModal.set(true);
  }

  onFileSelected(event: any) { this.recursoForm.archivo = event.target.files[0]; }

  saveRecurso() {
    const formData = new FormData();
    if (!this.recursoForm.id_practica) return;
    formData.append('id_practica', this.recursoForm.id_practica.toString());
    formData.append('id_tipo_recurso', this.recursoForm.id_tipo_recurso);
    formData.append('titulo', this.recursoForm.titulo);
    formData.append('descripcion', this.recursoForm.descripcion);
    if (this.recursoForm.url_externa) formData.append('url_externa', this.recursoForm.url_externa);
    if (this.recursoForm.archivo) formData.append('archivo_local', this.recursoForm.archivo);

    const obs = this.isEditingRecurso() ? this.practicaService.updateRecurso(this.selectedRecursoId()!, formData) : this.practicaService.createRecurso(formData);
    obs.subscribe({
      next: () => { this.loadData(); this.showRecursoModal.set(false); if (this.selectedPracticaDetails()) this.showViewResourcesModal.set(true); },
      error: (err) => this.showError(err, 'Error')
    });
  }

  openHerramientaModal(practicaId: number, ph?: any) {
    if (ph) {
      this.isEditingHerramienta.set(true);
      this.selectedPHId.set(ph.id);
      this.phForm = { id_practica: practicaId, id_herramienta: ph.id_herramienta, cantidad_requerida: ph.cantidad_requerida };
      this.showViewResourcesModal.set(false);
    } else {
      this.isEditingHerramienta.set(false);
      this.selectedPHId.set(null);
      this.phForm = { id_practica: practicaId, id_herramienta: '', cantidad_requerida: 1 };
    }
    this.showHerramientaModal.set(true);
  }

  savePracticaHerramienta() {
    const obs = this.isEditingHerramienta() ? this.practicaService.updatePracticaHerramienta(this.selectedPHId()!, this.phForm) : this.practicaService.createPracticaHerramienta(this.phForm);
    obs.subscribe({
      next: () => { this.loadData(); this.showHerramientaModal.set(false); if (this.selectedPracticaDetails()) this.showViewResourcesModal.set(true); },
      error: (err) => this.showError(err, 'Error')
    });
  }

  removeHerramienta(phId: number) { this.practicaService.deletePracticaHerramienta(phId).subscribe(() => this.loadData()); }
  removeRecurso(recursoId: number) { this.practicaService.deleteRecurso(recursoId).subscribe(() => this.loadData()); }
  showError(e: any, m: string) { Swal.fire('Error', m, 'error'); }
  clearFilters() { this.filterTitulo.set(''); this.filterEstado.set('todos'); }
  clearFiltersRevision() { 
    this.filterTextRevision.set(''); 
    this.filterEstadoRevision.set('todos'); 
    this.filterPracticaRevision.set('todos');
    this.filterCategoriaRevision.set('todos');
  }
}
