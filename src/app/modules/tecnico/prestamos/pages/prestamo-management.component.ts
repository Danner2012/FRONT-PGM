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
  estudiantes = signal<any[]>([]); // Respaldo

  // UI signals
  showPrestamoModal = signal(false);
  showDevolucionModal = signal(false);
  isEditing = signal(false);
  selectedPrestamo = signal<any>(null);
  selectedCursoId = signal<string>(''); // Signal para reactividad

  // Computed signals for filtering
  filteredInscripciones = computed(() => {
    const cursoId = this.selectedCursoId();
    const todas = this.inscripciones();
    
    if (!cursoId || todas.length === 0) return [];
    
    return todas.filter(ins => {
      // Extraer ID del curso de la inscripción
      const actualCursoId = ins.id_curso || ins.curso_detalle?.id;
      // Filtramos por curso e inscripciones válidas (confirmadas o pendientes)
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
    id_herramienta: ['', [Validators.required]],
    cantidad_prestada: [1, [Validators.required, Validators.min(1)]],
    observacion: ['']
  });

  devolucionForm: FormGroup = this.fb.group({
    cantidad_devuelta: [1, [Validators.required, Validators.min(1)]],
    observacion: ['']
  });

  ngOnInit() {
    this.loadAllData();
    
    // Sincronizar el valor del formulario con la Signal para activar la reactividad
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
    this.cursoService.getCursos().subscribe(data => this.cursos.set(data));
  }

  openPrestamoModal() {
    this.prestamoForm.reset({ cantidad_prestada: 1 });
    this.showPrestamoModal.set(true);
  }

  closePrestamoModal() {
    this.showPrestamoModal.set(false);
  }

  savePrestamo() {
    if (this.prestamoForm.invalid) return;

    const currentProfile = this.authService.currentUser();
    if (!currentProfile || !currentProfile.tecnico_id) {
        Swal.fire('Error', 'No se pudo identificar al técnico actual.', 'error');
        return;
    }

    const data = {
        ...this.prestamoForm.value,
        id_tecnico: currentProfile.tecnico_id
    };

    this.practicaService.createPrestamo(data).subscribe({
        next: () => {
            Swal.fire('Éxito', 'Préstamo registrado correctamente', 'success');
            this.loadPrestamos();
            this.closePrestamoModal();
        },
        error: (err) => {
            const msg = err.error?.non_field_errors?.[0] || err.error?.error || 'Error al registrar préstamo';
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
    if (!currentProfile || !currentProfile.tecnico_id) {
        Swal.fire('Error', 'No se pudo identificar al técnico actual.', 'error');
        return;
    }

    const data = {
        id_prestamo: this.selectedPrestamo().id,
        id_tecnico_receptor: currentProfile.tecnico_id,
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
