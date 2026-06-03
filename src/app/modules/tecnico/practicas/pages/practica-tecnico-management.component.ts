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
  
  cursoId = signal<number | null>(null);
  cursoNombre = signal<string>('');

  practicas = signal<any[]>([]);
  cursos = signal<any[]>([]);
  herramientas = signal<any[]>([]);
  tiposRecurso = signal<any[]>([]);
  tiposPractica = signal<any[]>([]);
  
  // Filtros
  filterTitulo = signal('');
  filterEstado = signal('todos');
  
  filteredPracticas = computed(() => {
    return this.practicas().filter(p => {
      const matchTitulo = p.titulo.toLowerCase().includes(this.filterTitulo().toLowerCase());
      const matchEstado = this.filterEstado() === 'todos' || 
                         (this.filterEstado() === 'activo' && p.estado) || 
                         (this.filterEstado() === 'inactivo' && !p.estado);
      return matchTitulo && matchEstado;
    });
  });

  // Modales y Estados
  showPracticaModal = signal(false);
  isEditing = signal(false);
  selectedPractica = signal<any>(null);
  
  showViewResourcesModal = signal(false);
  selectedPracticaDetails = signal<any>(null);

  message = signal<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  practicaForm = {
    id_curso: '',
    id_tipo_practica: '',
    titulo: '',
    descripcion: '',
    estado: true
  };

  // Gestión de Recursos
  showRecursoModal = signal(false);
  isEditingRecurso = signal(false);
  selectedRecursoId = signal<number | null>(null);
  recursoForm = {
    id_practica: null as number | null,
    id_tipo_recurso: '',
    titulo: '',
    descripcion: '',
    url_externa: '',
    archivo: null as File | null
  };

  // Gestión de Herramientas
  showHerramientaModal = signal(false);
  isEditingHerramienta = signal(false);
  selectedPHId = signal<number | null>(null);
  phForm = {
    id_practica: null as number | null,
    id_herramienta: '',
    cantidad_requerida: 1
  };

  constructor(
    private practicaService: PracticaService,
    private apiService: ApiService,
    private herramientaService: HerramientaService,
    private cursoService: CursoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cursoId.set(+params['id']);
        this.loadData();
      }
    });
  }

  showError(err: any, defaultMsg: string) {
    console.error(err);
    let errorDetail = '';
    if (err.error) {
      if (typeof err.error === 'string') {
        errorDetail = err.error;
      } else if (typeof err.error === 'object') {
        errorDetail = Object.entries(err.error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}`)
          .join('\n');
      }
    }
    Swal.fire('Error', errorDetail || defaultMsg, 'error');
  }

  clearFilters() {
    this.filterTitulo.set('');
    this.filterEstado.set('todos');
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

      if (this.showViewResourcesModal() && this.selectedPracticaDetails()) {
        const updated = filtered.find(p => p.id === this.selectedPracticaDetails().id);
        if (updated) this.selectedPracticaDetails.set(updated);
      }
    });

    this.herramientaService.getHerramientas().subscribe(data => this.herramientas.set(data));
    this.practicaService.getTiposRecurso().subscribe(data => this.tiposRecurso.set(data));
    this.practicaService.getTiposPractica().subscribe(data => this.tiposPractica.set(data));
  }

  goBack() {
    this.router.navigate(['/dashboard/mis-practicas-tecnico']);
  }

  togglePracticaStatus(practica: any) {
    const accion = practica.estado ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿Desea ${accion} esta práctica?`,
      text: `La práctica quedará como ${practica.estado ? 'inactiva' : 'activa'} en el sistema`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: practica.estado ? '#e53e3e' : '#38a169',
      confirmButtonText: `Sí, ${accion}`
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.practicaService.toggleStatus(practica.id).subscribe({
          next: () => {
            Swal.fire('Actualizado', `La práctica ha sido ${accion}da`, 'success');
            this.loadData();
          },
          error: (err) => this.showError(err, `No se pudo ${accion} la práctica`)
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
    if (url) {
      window.open(url, '_blank');
    } else {
      this.message.set({ text: 'Este recurso no tiene un archivo o enlace asociado', type: 'error' });
    }
  }

  getResourceUrl(recurso: any): string | null {
    if (recurso.url_externa) return recurso.url_externa;
    if (recurso.archivo_local) {
      return recurso.archivo_local.startsWith('http') 
        ? recurso.archivo_local 
        : `http://localhost:8000${recurso.archivo_local}`;
    }
    return null;
  }

  isVideo(recurso: any): boolean {
    const url = this.getResourceUrl(recurso);
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mkv', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
           (recurso.tipo_recurso_nombre && recurso.tipo_recurso_nombre.toLowerCase().includes('video'));
  }

  openPracticaModal(practica?: any) {
    this.message.set({ text: '', type: null });
    if (practica) {
      this.isEditing.set(true);
      this.selectedPractica.set(practica);
      this.practicaForm = { 
        id_curso: practica.id_curso.toString(),
        id_tipo_practica: practica.id_tipo_practica,
        titulo: practica.titulo,
        descripcion: practica.descripcion,
        estado: practica.estado
      };
    } else {
      this.isEditing.set(false);
      this.selectedPractica.set(null);
      this.practicaForm = { 
        id_curso: this.cursoId()?.toString() || '', 
        id_tipo_practica: '', 
        titulo: '', 
        descripcion: '', 
        estado: true 
      };
    }
    this.showPracticaModal.set(true);
  }

  savePractica() {
    if (this.cursoId()) {
      this.practicaForm.id_curso = this.cursoId()!.toString();
    }

    if (!this.practicaForm.id_curso || !this.practicaForm.id_tipo_practica || !this.practicaForm.titulo) {
      this.message.set({ 
        text: 'Debe llenar todos los campos obligatorios (Tipo y Título).', 
        type: 'error' 
      });
      return;
    }

    this.message.set({ text: '', type: null });
    
    if (this.isEditing()) {
      this.practicaService.updatePractica(this.selectedPractica().id, this.practicaForm).subscribe({
        next: () => {
          this.message.set({ text: 'Práctica actualizada correctamente.', type: 'success' });
          setTimeout(() => {
            this.loadData();
            this.showPracticaModal.set(false);
          }, 1500);
        },
        error: (err) => {
          const errorMsg = err.error?.non_field_errors?.[0] || 'No se pudo actualizar la práctica.';
          this.message.set({ text: errorMsg, type: 'error' });
        }
      });
    } else {
      this.practicaService.createPractica(this.practicaForm).subscribe({
        next: () => {
          this.message.set({ text: '¡Práctica creada exitosamente!', type: 'success' });
          setTimeout(() => {
            this.loadData();
            this.showPracticaModal.set(false);
          }, 1500);
        },
        error: (err) => {
          const errorMsg = err.error?.non_field_errors?.[0] || 'No se pudo crear la práctica.';
          this.message.set({ text: errorMsg, type: 'error' });
        }
      });
    }
  }

  deletePractica(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "La práctica se marcará como inactiva",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, desactivar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.practicaService.deletePractica(id).subscribe({
          next: () => {
            Swal.fire('Desactivada', 'La práctica ha sido desactivada', 'success');
            this.loadData();
          },
          error: (err) => this.showError(err, 'No se pudo desactivar la práctica')
        });
      }
    });
  }

  openRecursoModal(practicaId: number, recurso?: any) {
    if (recurso) {
      this.isEditingRecurso.set(true);
      this.selectedRecursoId.set(recurso.id);
      this.recursoForm = {
        id_practica: practicaId,
        id_tipo_recurso: recurso.id_tipo_recurso,
        titulo: recurso.titulo,
        descripcion: recurso.descripcion,
        url_externa: recurso.url_externa || '',
        archivo: null
      };
      this.showViewResourcesModal.set(false);
    } else {
      this.isEditingRecurso.set(false);
      this.selectedRecursoId.set(null);
      this.recursoForm = { id_practica: practicaId, id_tipo_recurso: '', titulo: '', descripcion: '', url_externa: '', archivo: null };
    }
    this.showRecursoModal.set(true);
  }

  onFileSelected(event: any) {
    this.recursoForm.archivo = event.target.files[0];
  }

  saveRecurso() {
    const formData = new FormData();
    if (!this.recursoForm.id_practica) {
      Swal.fire('Error', 'No se ha especificado la práctica', 'error');
      return;
    }
    formData.append('id_practica', this.recursoForm.id_practica.toString());
    formData.append('id_tipo_recurso', this.recursoForm.id_tipo_recurso);
    formData.append('titulo', this.recursoForm.titulo);
    formData.append('descripcion', this.recursoForm.descripcion);
    if (this.recursoForm.url_externa) formData.append('url_externa', this.recursoForm.url_externa);
    if (this.recursoForm.archivo) formData.append('archivo_local', this.recursoForm.archivo);

    if (this.isEditingRecurso()) {
      this.practicaService.updateRecurso(this.selectedRecursoId()!, formData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Recurso actualizado', 'success');
          this.loadData();
          this.showRecursoModal.set(false);
          if (this.selectedPracticaDetails()) {
            this.showViewResourcesModal.set(true);
          }
        },
        error: (err) => this.showError(err, 'No se pudo actualizar el recurso')
      });
    } else {
      this.practicaService.createRecurso(formData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Recurso añadido', 'success');
          this.loadData();
          this.showRecursoModal.set(false);
        },
        error: (err) => this.showError(err, 'No se pudo añadir el recurso')
      });
    }
  }

  openHerramientaModal(practicaId: number, ph?: any) {
    if (ph) {
      this.isEditingHerramienta.set(true);
      this.selectedPHId.set(ph.id);
      this.phForm = {
        id_practica: practicaId,
        id_herramienta: ph.id_herramienta,
        cantidad_requerida: ph.cantidad_requerida
      };
      this.showViewResourcesModal.set(false);
    } else {
      this.isEditingHerramienta.set(false);
      this.selectedPHId.set(null);
      this.phForm = { id_practica: practicaId, id_herramienta: '', cantidad_requerida: 1 };
    }
    this.showHerramientaModal.set(true);
  }

  savePracticaHerramienta() {
    if (this.isEditingHerramienta()) {
      this.practicaService.updatePracticaHerramienta(this.selectedPHId()!, this.phForm).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Requerimiento actualizado', 'success');
          this.loadData();
          this.showHerramientaModal.set(false);
          if (this.selectedPracticaDetails()) {
            this.showViewResourcesModal.set(true);
          }
        },
        error: (err) => this.showError(err, 'No se pudo actualizar el requerimiento')
      });
    } else {
      this.practicaService.createPracticaHerramienta(this.phForm).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Herramienta asignada', 'success');
          this.loadData();
          this.showHerramientaModal.set(false);
        },
        error: (err) => this.showError(err, 'No se pudo asignar la herramienta')
      });
    }
  }

  removeHerramienta(phId: number) {
    Swal.fire({
      title: '¿Eliminar requerimiento?',
      text: "Se quitará esta herramienta de la práctica",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deletePracticaHerramienta(phId).subscribe({
          next: () => {
            this.message.set({ text: 'Herramienta eliminada exitosamente.', type: 'success' });
            this.loadData();
            setTimeout(() => this.message.set({ text: '', type: null }), 3000);
          },
          error: (err) => this.message.set({ text: 'No se pudo quitar la herramienta.', type: 'error' })
        });
      }
    });
  }

  removeRecurso(recursoId: number) {
    Swal.fire({
      title: '¿Eliminar recurso?',
      text: "El recurso ya no estará disponible para los alumnos",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deleteRecurso(recursoId).subscribe({
          next: () => {
            this.message.set({ text: 'Recurso eliminado exitosamente.', type: 'success' });
            this.loadData();
            setTimeout(() => this.message.set({ text: '', type: null }), 3000);
          },
          error: (err) => this.message.set({ text: 'No se pudo eliminar el recurso.', type: 'error' })
        });
      }
    });
  }
}
