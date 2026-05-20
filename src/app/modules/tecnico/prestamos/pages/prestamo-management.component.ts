import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';
import { CursoService } from '../../../../services/curso.service';
import { HerramientaService } from '../../../../services/herramienta.service';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prestamo-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './prestamo-management.component.html',
  styleUrls: ['../styles/prestamo-management.component.css']
})
export class PrestamoManagementComponent implements OnInit {
  private practicaService = inject(PracticaService);
  private cursoService = inject(CursoService);
  private herramientaService = inject(HerramientaService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Data signals
  prestamos = signal<any[]>([]);
  inscripciones = signal<any[]>([]);
  practicas = signal<any[]>([]);
  herramientas = signal<any[]>([]);
  cursos = signal<any[]>([]);
  estudiantes = signal<any[]>([]); 
  
  // Lista de herramientas seleccionadas para el nuevo préstamo
  selectedHerramientas = signal<any[]>([]);

  // UI signals
  showPrestamoModal = signal(false);
  showDevolucionModal = signal(false);
  isEditing = signal(false);
  selectedPrestamo = signal<any>(null);
  selectedCursoId = signal<string>(''); // Signal para reactividad

  // Signals de Filtrado (NUEVOS)
  filterText = signal('');
  filterEstado = signal('todos');
  filterFechaInicio = signal('');
  filterFechaFin = signal('');
  filterCurso = signal('todos');

  // Computed signals for filtering
  filteredPrestamos = computed(() => {
    let data = this.prestamos();
    const text = this.filterText().toLowerCase();
    const estado = this.filterEstado();
    const fechaInicio = this.filterFechaInicio();
    const fechaFin = this.filterFechaFin();
    const cursoId = this.filterCurso();

    if (text) {
      data = data.filter(p => 
        p.estudiante_nombre?.toLowerCase().includes(text) || 
        p.estudiante_ci?.toLowerCase().includes(text) ||
        p.tecnico_nombre?.toLowerCase().includes(text) ||
        p.detalles?.some((d: any) => d.herramienta_nombre?.toLowerCase().includes(text)) ||
        p.herramienta_nombre?.toLowerCase().includes(text)
      );
    }

    if (estado !== 'todos') {
      data = data.filter(p => {
        // En este componente, el estado puede estar en detalles o en la raíz
        const pEstado = p.detalles?.[0]?.estado || p.estado;
        return pEstado === estado;
      });
    }

    if (cursoId !== 'todos') {
      data = data.filter(p => p.id_curso?.toString() === cursoId);
    }

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      data = data.filter(p => new Date(p.fecha_prestamo) >= start);
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59);
      data = data.filter(p => new Date(p.fecha_prestamo) <= end);
    }

    return data;
  });

  clearFilters() {
    this.filterText.set('');
    this.filterEstado.set('todos');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
    this.filterCurso.set('todos');
  }

  filteredInscripciones = computed(() => {
    const cursoId = this.selectedCursoId();
    const todas = this.inscripciones();
    
    if (!cursoId || todas.length === 0) return [];
    
    return todas.filter(ins => {
      const actualCursoId = ins.id_curso || ins.curso_detalle?.id;
      return String(actualCursoId) === String(cursoId) && ['confirmado', 'pendiente'].includes(ins.estado);
    });
  });

  filteredPracticas = computed(() => {
    const cursoId = this.selectedCursoId();
    const todasPracticas = this.practicas();
    if (!cursoId) return todasPracticas;
    return todasPracticas.filter(p => {
      const actualCursoId = p.id_curso || p.curso_detalle?.id;
      return String(actualCursoId) === String(cursoId);
    });
  });

  // Forms
  prestamoForm: FormGroup = this.fb.group({
    id_curso_temp: [''],
    id_inscripcion: ['', [Validators.required]],
    id_practica: ['', [Validators.required]],
    id_herramienta: [''], // Se usa para la selección individual
    cantidad_prestada: [1], // Se usa para la selección individual
    observacion: ['']
  });

  devolucionForm: FormGroup = this.fb.group({
    cantidad_devuelta: [1, [Validators.required, Validators.min(1)]],
    observacion: ['']
  });

  ngOnInit() {
    this.loadAllData();
    
    this.prestamoForm.get('id_curso_temp')?.valueChanges.subscribe(val => {
        this.selectedCursoId.set(val || '');
        this.prestamoForm.patchValue({
            id_inscripcion: '',
            id_practica: ''
        }, { emitEvent: false });
    });
  }

  loadAllData() {
    this.loadPrestamos();
    this.loadInscripciones();
    this.loadPracticas();
    this.loadHerramientas();
    this.loadCursos();
  }

  loadPrestamos() {
    this.practicaService.getPrestamos().subscribe(data => {
        this.prestamos.set(data);
    });
  }

  loadInscripciones() {
    this.apiService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones.set(data);
      },
      error: (err) => console.error('Error al cargar inscripciones:', err)
    });
  }

  loadPracticas() {
    this.practicaService.getPracticas().subscribe(data => this.practicas.set(data));
  }

  loadHerramientas() {
    this.herramientaService.getHerramientas().subscribe(data => this.herramientas.set(data));
  }

  loadCursos() {
    this.cursoService.getCursosPorTecnico().subscribe(data => this.cursos.set(data));
  }

  openPrestamoModal() {
    this.prestamoForm.reset({ cantidad_prestada: 1 });
    this.selectedHerramientas.set([]);
    this.showPrestamoModal.set(true);
  }

  closePrestamoModal() {
    this.showPrestamoModal.set(false);
  }

  addHerramienta() {
    const hId = this.prestamoForm.get('id_herramienta')?.value;
    const cant = this.prestamoForm.get('cantidad_prestada')?.value;

    if (!hId || cant < 1) {
        Swal.fire('Atención', 'Seleccione una herramienta y cantidad válida', 'warning');
        return;
    }

    const tool = this.herramientas().find(h => h.id == hId);
    if (!tool) return;

    if (tool.stock_disponible < cant) {
        Swal.fire('Error', `Stock insuficiente. Disponible: ${tool.stock_disponible}`, 'error');
        return;
    }

    // Verificar si ya está en la lista
    const existing = this.selectedHerramientas().find(item => item.id_herramienta == hId);
    if (existing) {
        Swal.fire('Info', 'Esta herramienta ya fue añadida. Modifíquela si es necesario.', 'info');
        return;
    }

    this.selectedHerramientas.update(list => [...list, {
        id_herramienta: hId,
        nombre: tool.nombre,
        cantidad_prestada: cant
    }]);

    // Limpiar selección individual
    this.prestamoForm.patchValue({ id_herramienta: '', cantidad_prestada: 1 });
  }

  removeHerramienta(index: number) {
    this.selectedHerramientas.update(list => list.filter((_, i) => i !== index));
  }

  savePrestamo() {
    if (this.prestamoForm.get('id_inscripcion')?.invalid || 
        this.prestamoForm.get('id_practica')?.invalid) return;

    if (this.selectedHerramientas().length === 0) {
        Swal.fire('Error', 'Debe añadir al menos una herramienta al préstamo.', 'error');
        return;
    }

    const currentProfile = this.authService.currentUser();
    // Usamos perfil_id que es el ID del técnico en el backend
    if (!currentProfile || !currentProfile.perfil_id) {
        Swal.fire('Error', 'No se pudo identificar al técnico actual.', 'error');
        return;
    }

    const data = {
        id_inscripcion: this.prestamoForm.get('id_inscripcion')?.value,
        id_practica: this.prestamoForm.get('id_practica')?.value,
        observacion: this.prestamoForm.get('observacion')?.value,
        id_tecnico: currentProfile.perfil_id,
        detalles_input: this.selectedHerramientas().map(h => ({
            id_herramienta: h.id_herramienta,
            cantidad_prestada: h.cantidad_prestada
        }))
    };

    this.practicaService.createPrestamo(data).subscribe({
        next: () => {
            Swal.fire('Éxito', 'Préstamo registrado correctamente', 'success');
            this.loadPrestamos();
            this.closePrestamoModal();
        },
        error: (err) => {
            console.error('Error completo del servidor:', err);
            let msg = 'Error al registrar préstamo';
            
            if (err.error) {
                if (typeof err.error === 'string') {
                    msg = err.error;
                } else if (err.error.error) {
                    msg = err.error.error;
                } else if (err.error.non_field_errors) {
                    msg = err.error.non_field_errors[0];
                } else if (typeof err.error === 'object') {
                    // Intentar extraer el primer error de cualquier campo
                    const keys = Object.keys(err.error);
                    if (keys.length > 0) {
                        const firstError = err.error[keys[0]];
                        msg = Array.isArray(firstError) ? firstError[0] : firstError;
                    }
                }
            }
            
            Swal.fire('Error', msg, 'error');
        }
    });
  }

  openDevolucionModal(prestamo: any) {
    this.selectedPrestamo.set(prestamo);
    const faltante = prestamo.cantidad_prestada - (prestamo.total_devuelto || 0);
    this.devolucionForm.reset({ cantidad_devuelta: faltante });
    this.showDevolucionModal.set(true);
  }

  closeDevolucionModal() {
    this.showDevolucionModal.set(false);
  }

  saveDevolucion() {
    if (this.devolucionForm.invalid) return;

    const currentProfile = this.authService.currentUser();
    if (!currentProfile || !currentProfile.perfil_id) {
        Swal.fire('Error', 'No se pudo identificar al técnico actual.', 'error');
        return;
    }

    // Buscamos el detalle de préstamo para esta devolución
    // Como el frontend actual muestra préstamos basados en el primer detalle,
    // usaremos el ID del primer detalle si está disponible.
    const detalleId = this.selectedPrestamo().detalles?.[0]?.id || this.selectedPrestamo().id_detalle;

    if (!detalleId) {
        Swal.fire('Error', 'No se pudo identificar el detalle del préstamo.', 'error');
        return;
    }

    const data = {
        id_prestamo_detalle: detalleId,
        id_tecnico_receptor: currentProfile.perfil_id,
        ...this.devolucionForm.value
    };

    this.practicaService.createDevolucion(data).subscribe({
        next: () => {
            Swal.fire('Éxito', 'Devolución registrada correctamente', 'success');
            this.loadPrestamos();
            this.closeDevolucionModal();
        },
        error: (err) => {
            const msg = err.error?.error || 'Error al registrar devolución';
            Swal.fire('Error', msg, 'error');
        }
    });
  }

  deletePrestamo(id: number) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            this.practicaService.deletePrestamo(id).subscribe({
                next: () => {
                    Swal.fire('Eliminado', 'El préstamo ha sido eliminado', 'success');
                    this.loadPrestamos();
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar el préstamo', 'error')
            });
        }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
        case 'prestado': return 'badge-active';
        case 'parcial': return 'badge-warning';
        case 'devuelto': return 'badge-success';
        default: return 'badge-inactive';
    }
  }
}
