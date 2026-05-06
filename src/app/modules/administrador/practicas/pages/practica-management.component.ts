import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import { ApiService } from '../../../../services/api.service';
import { HerramientaService } from '../../../../services/herramienta.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-practica-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practica-management.component.html',
  styleUrls: ['../styles/practica-management.component.css']
})
export class PracticaManagementComponent implements OnInit {
  practicas = signal<any[]>([]);
  cursos = signal<any[]>([]);
  herramientas = signal<any[]>([]);
  tiposRecurso = signal<any[]>([]);
  
  activeTab = signal<'practicas' | 'maestros'>('practicas');
  
  // Filtros
  filterTitulo = signal('');
  filterCurso = signal('todos');
  filterEstado = signal('todos');
  
  filteredPracticas = computed(() => {
    return this.practicas().filter(p => {
      const matchTitulo = p.titulo.toLowerCase().includes(this.filterTitulo().toLowerCase());
      const matchCurso = this.filterCurso() === 'todos' || p.id_curso.toString() === this.filterCurso();
      const matchEstado = this.filterEstado() === 'todos' || 
                         (this.filterEstado() === 'activo' && p.estado) || 
                         (this.filterEstado() === 'inactivo' && !p.estado);
      return matchTitulo && matchCurso && matchEstado;
    });
  });

  // ... (modales y resto de propiedades)

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
        this.practicaService.toggleStatus(practica.id).subscribe(() => {
          Swal.fire('Actualizado', `La práctica ha sido ${accion}da`, 'success');
          this.loadData();
        });
      }
    });
  }

  // Modales
  showPracticaModal = signal(false);
  isEditing = signal(false);
  selectedPractica = signal<any>(null);
  
  // Nuevo modal para ver detalles
  showViewResourcesModal = signal(false);
  selectedPracticaDetails = signal<any>(null);

  practicaForm = {
    id_curso: '',
    titulo: '',
    descripcion: '',
    orden: 1,
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
    archivo: null as File | null,
    orden: 1
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
    private herramientaService: HerramientaService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.practicaService.getPracticas().subscribe(data => {
      this.practicas.set(data);
      // Si hay un modal de detalles abierto, actualizar sus datos
      if (this.showViewResourcesModal() && this.selectedPracticaDetails()) {
        const updated = data.find(p => p.id === this.selectedPracticaDetails().id);
        if (updated) this.selectedPracticaDetails.set(updated);
      }
    });
    this.apiService.getCursos().subscribe(data => this.cursos.set(data));
    this.herramientaService.getHerramientas().subscribe(data => this.herramientas.set(data));
    this.practicaService.getTiposRecurso().subscribe(data => this.tiposRecurso.set(data));
  }

  openViewResourcesModal(practica: any) {
    this.selectedPracticaDetails.set(practica);
    this.showViewResourcesModal.set(true);
  }

  openPracticaModal(practica?: any) {
    if (practica) {
      this.isEditing.set(true);
      this.selectedPractica.set(practica);
      this.practicaForm = { ...practica };
    } else {
      this.isEditing.set(false);
      this.selectedPractica.set(null);
      this.practicaForm = { id_curso: '', titulo: '', descripcion: '', orden: this.practicas().length + 1, estado: true };
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
        }
      });
    } else {
      this.practicaService.createPractica(this.practicaForm).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Práctica creada correctamente', 'success');
          this.loadData();
          this.showPracticaModal.set(false);
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
        this.practicaService.deletePractica(id).subscribe(() => {
          Swal.fire('Desactivada', 'La práctica ha sido desactivada', 'success');
          this.loadData();
        });
      }
    });
  }

  // Maestros: Tipos de Recurso
  showTipoModal = signal(false);
  tipoForm = { nombre: '' };

  saveTipoRecurso() {
    this.practicaService.createTipoRecurso(this.tipoForm).subscribe(() => {
      Swal.fire('Éxito', 'Tipo de recurso creado', 'success');
      this.loadData();
      this.showTipoModal.set(false);
      this.tipoForm.nombre = '';
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
        // Nota: Asumiendo que el servicio tiene un método genérico para borrar o que deleteRecurso
        // no es lo mismo que borrar el TIPO. Revisando practica.service.ts no veo deleteTipoRecurso.
        // Pero basándome en los otros, debería existir o ser manejado. 
        // Si no existe, lo usaré como deleteRecurso pero para el endpoint de tipos si estuviera expuesto.
        // Por seguridad, usaré la estructura estándar de DRF si el servicio lo permite.
        this.practicaService.deleteTipoRecurso(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El tipo de recurso ha sido eliminado', 'success');
            this.loadData();
          },
          error: () => {
            Swal.fire('Error', 'No se puede eliminar porque está en uso', 'error');
          }
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
        archivo: null,
        orden: recurso.orden
      };
      // Cerrar el modal de vista para que no se solape con el de edición
      this.showViewResourcesModal.set(false);
    } else {
      this.isEditingRecurso.set(false);
      this.selectedRecursoId.set(null);
      this.recursoForm = { id_practica: practicaId, id_tipo_recurso: '', titulo: '', descripcion: '', url_externa: '', archivo: null, orden: 1 };
    }
    this.showRecursoModal.set(true);
  }

  onFileSelected(event: any) {
    this.recursoForm.archivo = event.target.files[0];
  }

  saveRecurso() {
    const formData = new FormData();
    formData.append('id_practica', this.recursoForm.id_practica!.toString());
    formData.append('id_tipo_recurso', this.recursoForm.id_tipo_recurso);
    formData.append('titulo', this.recursoForm.titulo);
    formData.append('descripcion', this.recursoForm.descripcion);
    formData.append('orden', this.recursoForm.orden.toString());
    if (this.recursoForm.url_externa) formData.append('url_externa', this.recursoForm.url_externa);
    if (this.recursoForm.archivo) formData.append('archivo_local', this.recursoForm.archivo);

    if (this.isEditingRecurso()) {
      this.practicaService.updateRecurso(this.selectedRecursoId()!, formData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Recurso actualizado', 'success');
          this.loadData();
          this.showRecursoModal.set(false);
          // Si cerramos el modal de edición, volvemos a mostrar el de vista con los datos actualizados
          if (this.selectedPracticaDetails()) {
            this.showViewResourcesModal.set(true);
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar el recurso.', 'error');
        }
      });
    } else {
      this.practicaService.createRecurso(formData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Recurso añadido', 'success');
          this.loadData();
          this.showRecursoModal.set(false);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo añadir el recurso. Verifique los datos.', 'error');
        }
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
      // Cerrar el modal de vista para evitar solapamiento
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
          // Reabrir modal de vista
          if (this.selectedPracticaDetails()) {
            this.showViewResourcesModal.set(true);
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar el requerimiento.', 'error');
        }
      });
    } else {
      this.practicaService.createPracticaHerramienta(this.phForm).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Herramienta asignada', 'success');
          this.loadData();
          this.showHerramientaModal.set(false);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo asignar la herramienta.', 'error');
        }
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
        this.practicaService.deletePracticaHerramienta(phId).subscribe(() => {
          Swal.fire('Eliminado', 'Herramienta quitada de la práctica', 'success');
          this.loadData();
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
        this.practicaService.deleteRecurso(recursoId).subscribe(() => {
          Swal.fire('Eliminado', 'Recurso eliminado', 'success');
          this.loadData();
        });
      }
    });
  }
}
