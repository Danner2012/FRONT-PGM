import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CursoService } from '../../../../services/curso.service';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-curso-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './curso-management.component.html',
  styleUrls: ['../styles/curso-management.component.css']
})
export class CursoManagementComponent implements OnInit {
  private cursoService = inject(CursoService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Listas de datos
  cursos = signal<any[]>([]);
  tiposCurso = signal<any[]>([]);
  horarios = signal<any[]>([]);
  dias = signal<any[]>([]);
  tecnicosDisponibles = signal<any[]>([]);

  // Signals para Filtros
  filterNombre = signal<string>('');
  filterTipo = signal<string>('todos');
  filterEstado = signal<string>('todos');
  filterFechaInicio = signal<string>('');
  filterFechaFin = signal<string>('');

  // Lógica de Filtrado Computada
  filteredCursos = computed(() => {
    let data = this.cursos();

    // Filtrar por Nombre
    if (this.filterNombre()) {
      const search = this.filterNombre().toLowerCase();
      data = data.filter(c => c.nombre.toLowerCase().includes(search));
    }

    // Filtrar por Tipo
    if (this.filterTipo() !== 'todos') {
      data = data.filter(c => c.id_tipo?.toString() === this.filterTipo());
    }

    // Filtrar por Estado (activo/inactivo)
    if (this.filterEstado() !== 'todos') {
      const targetEstado = this.filterEstado() === 'activo';
      data = data.filter(c => c.estado === targetEstado);
    }

    // Filtrar por Fecha de Inicio (desde)
    if (this.filterFechaInicio()) {
      const start = new Date(this.filterFechaInicio());
      data = data.filter(c => new Date(c.fecha_inicio) >= start);
    }

    // Filtrar por Fecha de Fin (hasta)
    if (this.filterFechaFin()) {
      const end = new Date(this.filterFechaFin());
      end.setHours(23, 59, 59);
      data = data.filter(c => new Date(c.fecha_fin) <= end);
    }

    return data;
  });

  clearFilters() {
    this.filterNombre.set('');
    this.filterTipo.set('todos');
    this.filterEstado.set('todos');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
  }

  // Control de UI
  activeTab = signal<'cursos' | 'maestros'>('cursos');
  showCursoModal = signal(false);
  showMaestroModal = signal(false);
  showTecnicosModal = signal(false);
  showConfirmModal = signal(false);
  confirmData = signal<{ title: string, message: string, action: () => void }>({ title: '', message: '', action: () => {} });
  maestroType = signal<'tipo' | 'horario'>('tipo');
  isEditing = signal(false);
  selectedId = signal<number | null>(null);
  showAsignarForm = signal<number | null>(null);
  showDetailsModal = signal(false);
  selectedCursoDetails = signal<any>(null);

  executeConfirmedAction() {
    this.confirmData().action();
    this.showConfirmModal.set(false);
  }

  // Mensajes de feedback
  message = signal<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  // Fecha mínima para el calendario (Hoy)
  minDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Formularios
  cursoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    precio: ['', [Validators.required]], 
    id_tipo: ['', [Validators.required]],
    fecha_inicio: ['', [Validators.required]],
    fecha_fin: ['', [Validators.required]],
    cupo_maximo: ['', [Validators.required]], 
    estado: [true]
  });

  horarioAsignacionForm: FormGroup = this.fb.group({
    id_dia: ['', [Validators.required]],
    id_horario: ['', [Validators.required]]
  });

  tipoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]]
  });

  horarioMaestroForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    hora_inicio: ['', [Validators.required]],
    hora_fin: ['', [Validators.required]]
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loadCursos();
    this.loadTiposCurso();
    this.loadHorarios();
    this.loadDias();
    this.loadTecnicos();
  }

  loadCursos() {
    this.cursoService.getCursos().subscribe(data => this.cursos.set(data));
  }
  loadTiposCurso() {
    this.cursoService.getTiposCurso().subscribe(data => this.tiposCurso.set(data));
  }
  loadHorarios() {
    this.cursoService.getHorarios().subscribe(data => this.horarios.set(data));
  }
  loadDias() {
    this.cursoService.getDias().subscribe(data => this.dias.set(data));
  }
  loadTecnicos() {
    this.apiService.getTecnicos().subscribe(data => this.tecnicosDisponibles.set(data));
  }

  // --- Ver Detalles ---
  openDetails(curso: any) {
    this.selectedCursoDetails.set(curso);
    this.showDetailsModal.set(true);
  }

  // --- Gestión de Técnicos en Curso ---
  openTecnicosModal(curso: any) {
    this.selectedCursoDetails.set(curso);
    this.message.set({ text: '', type: null });
    this.showTecnicosModal.set(true);
  }

  isTecnicoAsignado(tecnicoId: number): boolean {
    const curso = this.selectedCursoDetails();
    if (!curso || !curso.tecnicos) return false;
    return curso.tecnicos.some((t: any) => t.id_tecnico === tecnicoId);
  }

  toggleTecnicoAsignacion(tecnicoId: number) {
    const curso = this.selectedCursoDetails();
    const asignacion = curso.tecnicos.find((t: any) => t.id_tecnico === tecnicoId);

    if (asignacion) {
      this.cursoService.quitarTecnico(asignacion.id).subscribe(() => {
        this.message.set({ text: 'Técnico removido exitosamente.', type: 'success' });
        this.refreshCursoData();
        setTimeout(() => this.message.set({ text: '', type: null }), 3000);
      });
    } else {
      const data = { id_curso: curso.id, id_tecnico: tecnicoId };
      this.cursoService.asignarTecnico(data).subscribe(() => {
        this.message.set({ text: 'Técnico asignado exitosamente.', type: 'success' });
        this.refreshCursoData();
        setTimeout(() => this.message.set({ text: '', type: null }), 3000);
      });
    }
  }

  refreshCursoData() {
    this.cursoService.getCursos().subscribe(data => {
      this.cursos.set(data);
      const updatedCurso = data.find(c => c.id === this.selectedCursoDetails().id);
      if (updatedCurso) this.selectedCursoDetails.set(updatedCurso);
    });
  }

  // --- Gestión de Cursos ---
  openCursoModal(curso: any = null) {
    this.isEditing.set(!!curso);
    this.showCursoModal.set(true);
    this.message.set({ text: '', type: null }); // Limpiar mensajes
    
    if (curso) {
      this.selectedId.set(curso.id);
      this.cursoForm.patchValue(curso);
    } else {
      this.selectedId.set(null);
      this.cursoForm.reset(); // Reset completo
      this.cursoForm.patchValue({ estado: true }); // Solo estado activo por defecto, cupo vacío
    }
  }

  closeCursoModal() {
    this.showCursoModal.set(false);
    this.message.set({ text: '', type: null });
  }

  closeMaestroModal() {
    this.showMaestroModal.set(false);
    this.message.set({ text: '', type: null });
  }

  saveCurso() {
    // 1. Validar campos vacíos
    if (this.cursoForm.invalid) {
      this.message.set({ text: 'Debe llenar todos los campos obligatorios del curso.', type: 'error' });
      return;
    }

    const data = this.cursoForm.value;

    // 2. Validar Precio Negativo
    if (data.precio < 0) {
      this.message.set({ text: 'El precio del curso no puede ser un valor negativo.', type: 'error' });
      return;
    }

    // 3. Validar Cupo Negativo
    if (data.cupo_maximo < 0) {
      this.message.set({ text: 'El cupo global no puede ser negativo.', type: 'error' });
      return;
    }

    // 4. Validar Coherencia de Fechas
    const inicio = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);
    if (fin < inicio) {
      this.message.set({ text: 'La fecha de fin no puede ser anterior a la fecha de inicio.', type: 'error' });
      return;
    }

    this.message.set({ text: '', type: null }); // Limpiar antes de enviar

    if (this.isEditing()) {
      this.cursoService.updateCurso(this.selectedId()!, data).subscribe({
        next: () => {
          this.message.set({ text: 'Curso actualizado exitosamente.', type: 'success' });
          setTimeout(() => {
            this.loadCursos();
            this.closeCursoModal();
          }, 1500);
        },
        error: (err) => {
          this.message.set({ text: 'Error al actualizar: ' + (err.error?.detail || 'Intente nuevamente'), type: 'error' });
        }
      });
    } else {
      this.cursoService.createCurso(data).subscribe({
        next: () => {
          this.message.set({ text: '¡Curso creado exitosamente!', type: 'success' });
          setTimeout(() => {
            this.loadCursos();
            this.closeCursoModal();
          }, 1500);
        },
        error: (err) => {
          this.message.set({ text: 'Error al crear: ' + (err.error?.detail || 'Intente nuevamente'), type: 'error' });
        }
      });
    }
  }

  // --- Asignación de Horarios ---
  toggleAsignarForm(id: number) {
    if (this.showAsignarForm() === id) {
      this.showAsignarForm.set(null);
    } else {
      this.showAsignarForm.set(id);
      this.horarioAsignacionForm.reset();
    }
  }

  asignarHorario(cursoId: number) {
    if (this.horarioAsignacionForm.invalid) return;
    this.message.set({ text: '', type: null });
    const data = { ...this.horarioAsignacionForm.value, id_curso: cursoId };
    this.cursoService.asignarHorario(data).subscribe({
      next: () => {
        this.loadCursos();
        this.horarioAsignacionForm.reset();
        this.showAsignarForm.set(null); 
        this.message.set({ text: 'Horario asignado exitosamente.', type: 'success' });
        setTimeout(() => this.message.set({ text: '', type: null }), 3000);
      },
      error: (err) => {
        this.showAsignarForm.set(null); // Cerrar también en error para ver el mensaje global
        this.message.set({ text: err.error.error || 'Error al asignar horario', type: 'error' });
        setTimeout(() => this.message.set({ text: '', type: null }), 3000);
      }
    });
  }

  quitarHorario(asignacionId: number) {
    this.confirmData.set({
      title: 'Quitar Horario',
      message: '¿Está seguro de que desea remover este horario del curso?',
      action: () => {
        this.message.set({ text: '', type: null });
        this.cursoService.quitarHorario(asignacionId).subscribe({
          next: () => {
            this.refreshCursoData(); // Refrescar detalles para que se vea el cambio en el modal
            this.message.set({ text: 'Horario removido del curso.', type: 'success' });
            setTimeout(() => this.message.set({ text: '', type: null }), 3000);
          },
          error: () => {
            this.message.set({ text: 'Error al quitar horario.', type: 'error' });
            setTimeout(() => this.message.set({ text: '', type: null }), 3000);
          }
        });
      }
    });
    this.showConfirmModal.set(true);
  }

  // --- Gestión de Maestros ---
  openMaestroModal(type: 'tipo' | 'horario', item: any = null) {
    this.maestroType.set(type);
    this.isEditing.set(!!item);
    this.selectedId.set(item?.id || null);
    this.message.set({ text: '', type: null }); // Limpiar mensajes
    this.showMaestroModal.set(true);
    
    if (type === 'tipo') {
      this.tipoForm.patchValue(item || { nombre: '' });
    } else {
      this.horarioMaestroForm.patchValue(item || { nombre: '', hora_inicio: '', hora_fin: '' });
    }
  }

  saveMaestro() {
    this.message.set({ text: '', type: null });

    if (this.maestroType() === 'tipo') {
      if (this.tipoForm.invalid) return;
      const data = this.tipoForm.value;

      // Validación de duplicados local antes de enviar
      const duplicado = this.tiposCurso().some(t => 
        t.nombre.toLowerCase() === data.nombre.toLowerCase() && t.id !== this.selectedId()
      );

      if (duplicado) {
        this.message.set({ text: 'Ya existe un tipo de curso con este nombre.', type: 'error' });
        return;
      }

      if (this.isEditing()) {
        this.cursoService.updateTipoCurso(this.selectedId()!, data).subscribe({
          next: () => {
            this.message.set({ text: 'Tipo de curso actualizado exitosamente.', type: 'success' });
            setTimeout(() => {
              this.loadTiposCurso();
              this.showMaestroModal.set(false);
              this.message.set({ text: '', type: null });
            }, 1500);
          },
          error: (err) => this.message.set({ text: 'Error: ' + (err.error?.nombre || 'No se pudo actualizar'), type: 'error' })
        });
      } else {
        this.cursoService.createTipoCurso(data).subscribe({
          next: () => {
            this.message.set({ text: '¡Tipo de curso creado exitosamente!', type: 'success' });
            setTimeout(() => {
              this.loadTiposCurso();
              this.showMaestroModal.set(false);
              this.message.set({ text: '', type: null });
            }, 1500);
          },
          error: (err) => this.message.set({ text: 'Error: ' + (err.error?.nombre || 'No se pudo crear'), type: 'error' })
        });
      }
    } else {
      if (this.horarioMaestroForm.invalid) return;
      const data = this.horarioMaestroForm.value;

      // Validación de Coherencia de Horas
      if (data.hora_fin <= data.hora_inicio) {
        this.message.set({ text: 'La hora de fin debe ser posterior a la hora de inicio.', type: 'error' });
        return;
      }

      if (this.isEditing()) {
        this.cursoService.updateHorario(this.selectedId()!, data).subscribe({
          next: () => {
            this.message.set({ text: 'Horario actualizado exitosamente.', type: 'success' });
            setTimeout(() => {
              this.loadHorarios();
              this.showMaestroModal.set(false);
              this.message.set({ text: '', type: null });
            }, 1500);
          },
          error: (err) => this.message.set({ text: 'Error: El rango de horas ya existe.', type: 'error' })
        });
      } else {
        // Validación local de duplicados por rango de tiempo
        const duplicado = this.horarios().some(h => 
          h.hora_inicio === data.hora_inicio && h.hora_fin === data.hora_fin
        );

        if (duplicado) {
          this.message.set({ text: 'Este rango de horas ya está registrado en el catálogo.', type: 'error' });
          return;
        }

        this.cursoService.createHorario(data).subscribe({
          next: () => {
            this.message.set({ text: '¡Horario creado exitosamente!', type: 'success' });
            setTimeout(() => {
              this.loadHorarios();
              this.showMaestroModal.set(false);
              this.message.set({ text: '', type: null });
            }, 1500);
          },
          error: (err) => this.message.set({ text: 'Error: El rango de horas ya existe.', type: 'error' })
        });
      }
    }
  }

  deleteMaestro(type: 'tipo' | 'horario', id: number) {
    this.confirmData.set({
      title: 'Eliminar Registro',
      message: `¿Está seguro de que desea eliminar este ${type === 'tipo' ? 'tipo de curso' : 'horario'}? Esta acción no se puede deshacer.`,
      action: () => {
        this.message.set({ text: '', type: null });
        if (type === 'tipo') {
          this.cursoService.deleteTipoCurso(id).subscribe({
            next: () => {
              this.loadTiposCurso();
              this.message.set({ text: 'Tipo de curso eliminado exitosamente.', type: 'success' });
              setTimeout(() => this.message.set({ text: '', type: null }), 3000);
            },
            error: () => {
              this.message.set({ text: 'No se puede eliminar porque está siendo usado en cursos.', type: 'error' });
              setTimeout(() => this.message.set({ text: '', type: null }), 3000);
            }
          });
        } else {
          this.cursoService.deleteHorario(id).subscribe({
            next: () => {
              this.loadHorarios();
              this.message.set({ text: 'Horario eliminado exitosamente.', type: 'success' });
              setTimeout(() => this.message.set({ text: '', type: null }), 3000);
            },
            error: () => {
              this.message.set({ text: 'No se puede eliminar porque está siendo usado.', type: 'error' });
              setTimeout(() => this.message.set({ text: '', type: null }), 3000);
            }
          });
        }
      }
    });
    this.showConfirmModal.set(true);
  }

  toggleCursoEstado(curso: any) {
    const nuevoEstado = !curso.estado;
    this.confirmData.set({
      title: `${nuevoEstado ? 'Activar' : 'Desactivar'} Curso`,
      message: `¿Está seguro de que desea ${nuevoEstado ? 'activar' : 'desactivar'} el curso "${curso.nombre}"?`,
      action: () => {
        this.message.set({ text: '', type: null });
        this.cursoService.updateCurso(curso.id, { ...curso, estado: nuevoEstado }).subscribe({
          next: () => {
            this.loadCursos();
            this.message.set({ 
              text: `Curso ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`, 
              type: 'success' 
            });
            setTimeout(() => this.message.set({ text: '', type: null }), 3000);
          },
          error: (err) => {
            this.message.set({ text: 'Error al cambiar estado: ' + (err.error?.detail || 'Intente nuevamente'), type: 'error' });
            setTimeout(() => this.message.set({ text: '', type: null }), 3000);
          }
        });
      }
    });
    this.showConfirmModal.set(true);
  }

  // --- Helpers de Visualización ---
  getUniqueDays(horarios: any[]): string[] {
    if (!horarios) return [];
    const days = horarios.map(h => h.dia_nombre.trim().substring(0, 2).toUpperCase());
    return [...new Set(days)];
  }

  getGroupedHorarios(horarios: any[]): any[] {
    if (!horarios) return [];
    const grouped: { [key: string]: any[] } = {};
    horarios.forEach(h => {
      const dia = h.dia_nombre.trim();
      if (!grouped[dia]) {
        grouped[dia] = [];
      }
      grouped[dia].push(h);
    });
    return Object.keys(grouped).map(dia => ({
      dia,
      horarios: grouped[dia]
    }));
  }
}
