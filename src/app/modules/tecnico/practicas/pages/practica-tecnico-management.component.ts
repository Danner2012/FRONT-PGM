import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import { ApiService } from '../../../../services/api.service';
import { HerramientaService } from '../../../../services/herramienta.service';
import { CursoService } from '../../../../services/curso.service';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-practica-tecnico-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practica-tecnico-management.component.html',
  styleUrls: ['../styles/practica-tecnico-management.component.css']
})
export class PracticaTecnicoManagementComponent implements OnInit {
  practicas = signal<any[]>([]);
  cursos = signal<any[]>([]);
  herramientas = signal<any[]>([]);
  tiposRecurso = signal<any[]>([]);
  tiposPractica = signal<any[]>([]);
  
  activeTab = signal<'practicas' | 'maestros'>('practicas');
  
  // Filtros
  filterTitulo = signal('');
  filterCurso = signal('todos');
  filterEstado = signal('todos');
  
  filteredPracticas = computed(() => {
    return this.practicas().filter(p => {
      const matchTitulo = p.titulo.toLowerCase().includes(this.filterTitulo().toLowerCase());
      const matchCurso = this.filterCurso() === 'todos' || (p.id_curso && p.id_curso.toString() === this.filterCurso());
      const matchEstado = this.filterEstado() === 'todos' || 
                         (this.filterEstado() === 'activo' && p.estado) || 
                         (this.filterEstado() === 'inactivo' && !p.estado);
      return matchTitulo && matchCurso && matchEstado;
    });
  });

  // Modales
  showPracticaModal = signal(false);
  isEditing = signal(false);
  selectedPractica = signal<any>(null);
  
  // Nuevo modal para ver detalles
  showViewResourcesModal = signal(false);
  selectedPracticaDetails = signal<any>(null);

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
    this.loadData();
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
    this.filterCurso.set('todos');
    this.filterEstado.set('todos');
  }

  loadData() {
    const currentUserId = this.authService.currentUser()?.id;

    this.practicaService.getPracticas().subscribe(data => {
      // Filtrar prácticas que pertenezcan a los cursos del técnico Y hayan sido creadas por él
      this.cursoService.getCursosPorTecnico().subscribe(cursosTecnico => {
        const cursoIds = cursosTecnico.map((c: any) => c.id);
        const filtered = data.filter(p => 
          cursoIds.includes(p.id_curso) && 
          p.id_usuario_creador === currentUserId
        );
        this.practicas.set(filtered);
        this.cursos.set(cursosTecnico);

        if (this.showViewResourcesModal() && this.selectedPracticaDetails()) {
          const updated = filtered.find(p => p.id === this.selectedPracticaDetails().id);
          if (updated) this.selectedPracticaDetails.set(updated);
        }
      });
    });

    this.herramientaService.getHerramientas().subscribe(data => this.herramientas.set(data));
    this.practicaService.getTiposRecurso().subscribe(data => this.tiposRecurso.set(data));
    this.practicaService.getTiposPractica().subscribe(data => this.tiposPractica.set(data));
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
    this.selectedPracticaDetails.set(practica);
    this.showViewResourcesModal.set(true);
  }

  viewResource(recurso: any) {
    const url = this.getResourceUrl(recurso);
    if (url) {
      window.open(url, '_blank');
    } else {
      Swal.fire('Info', 'Este recurso no tiene un archivo o enlace asociado', 'info');
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
    if (practica) {
      this.isEditing.set(true);
      this.selectedPractica.set(practica);
      this.practicaForm = { 
        id_curso: practica.id_curso,
        id_tipo_practica: practica.id_tipo_practica,
        titulo: practica.titulo,
        descripcion: practica.descripcion,
        estado: practica.estado
      };
    } else {
      this.isEditing.set(false);
      this.selectedPractica.set(null);
      this.practicaForm = { id_curso: '', id_tipo_practica: '', titulo: '', descripcion: '', estado: true };
    }
    this.showPracticaModal.set(true);
  }

  savePractica() {
    if (this.isEditing()) {
      this.practicaService.updatePractica(this.selectedPractica().id, this.practicaForm).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Práctica actualizada correctamente', 'success');
          this.loadData();
          this.showPracticaModal.set(false);
        },
        error: (err) => this.showError(err, 'No se pudo actualizar la práctica')
      });
    } else {
      this.practicaService.createPractica(this.practicaForm).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Práctica creada correctamente', 'success');
          this.loadData();
          this.showPracticaModal.set(false);
        },
        error: (err) => this.showError(err, 'No se pudo crear la práctica')
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

  // Maestros: Tipos de Recurso y Práctica
  showTipoModal = signal(false);
  showTipoPracticaModal = signal(false);
  tipoForm = { nombre: '' };
  tipoPracticaForm = { nombre: '' };

  saveTipoRecurso() {
    this.practicaService.createTipoRecurso(this.tipoForm).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Tipo de recurso creado', 'success');
        this.loadData();
        this.showTipoModal.set(false);
        this.tipoForm.nombre = '';
      },
      error: (err) => this.showError(err, 'No se pudo crear el tipo de recurso')
    });
  }

  saveTipoPractica() {
    this.practicaService.createTipoPractica(this.tipoPracticaForm).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Tipo de práctica creado', 'success');
        this.loadData();
        this.showTipoPracticaModal.set(false);
        this.tipoPracticaForm.nombre = '';
      },
      error: (err) => this.showError(err, 'No se pudo crear el tipo de práctica')
    });
  }

  removeTipoRecurso(id: number) {
    Swal.fire({
      title: '¿Eliminar tipo de recurso?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deleteTipoRecurso(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El tipo de recurso ha sido eliminado', 'success');
            this.loadData();
          },
          error: (err) => this.showError(err, 'No se puede eliminar porque está en uso')
        });
      }
    });
  }

  removeTipoPractica(id: number) {
    Swal.fire({
      title: '¿Eliminar tipo de práctica?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deleteTipoPractica(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El tipo de práctica ha sido eliminado', 'success');
            this.loadData();
          },
          error: (err) => this.showError(err, 'No se puede eliminar porque está en uso')
        });
      }
    });
  }

  // Lógica para Recursos
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
        error: (err) => this.showError(err, 'No se pudo actualizar the recurso')
      });
    } else {
      this.practicaService.createRecurso(formData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Recurso añadido', 'success');
          this.loadData();
          this.showRecursoModal.set(false);
        },
        error: (err) => this.showError(err, 'No se pudo añadir the recurso')
      });
    }
  }

  // Lógica para Herramientas
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
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deletePracticaHerramienta(phId).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Herramienta quitada de la práctica', 'success');
            this.loadData();
          },
          error: (err) => this.showError(err, 'No se pudo quitar la herramienta')
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
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deleteRecurso(recursoId).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Recurso eliminado', 'success');
            this.loadData();
          },
          error: (err) => this.showError(err, 'No se pudo eliminar el recurso')
        });
      }
    });
  }
}
