import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-inscripcion-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inscripcion-management.component.html',
  styleUrls: ['../styles/inscripcion-management.component.css']
})
export class InscripcionManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);

  // Listas base
  inscripciones = signal<any[]>([]);
  estudiantes = signal<any[]>([]);
  cursos = signal<any[]>([]);

  // Signals para Filtros
  filterStatus = signal<string>('todos');
  filterCurso = signal<string>('todos');
  filterSearch = signal<string>('');
  filterDateStart = signal<string>('');
  filterDateEnd = signal<string>('');

  // Lógica de Filtrado Computada
  filteredInscripciones = computed(() => {
    let data = this.inscripciones();

    // Filtrar por Estado
    if (this.filterStatus() !== 'todos') {
      data = data.filter(i => i.estado === this.filterStatus());
    }

    // Filtrar por Curso
    if (this.filterCurso() !== 'todos') {
      data = data.filter(i => i.id_curso?.toString() === this.filterCurso());
    }

    // Filtrar por Búsqueda (Estudiante / CI)
    if (this.filterSearch()) {
      const search = this.filterSearch().toLowerCase();
      data = data.filter(i => 
        i.estudiante_detalle?.nombre_completo.toLowerCase().includes(search) ||
        i.estudiante_detalle?.ci.includes(search)
      );
    }

    // Filtrar por Fechas
    if (this.filterDateStart()) {
      const start = new Date(this.filterDateStart());
      data = data.filter(i => new Date(i.fecha_inscripcion) >= start);
    }
    if (this.filterDateEnd()) {
      const end = new Date(this.filterDateEnd());
      end.setHours(23, 59, 59); // Final del día
      data = data.filter(i => new Date(i.fecha_inscripcion) <= end);
    }

    return data;
  });

  // UI Control
  activeTab = signal<'inscripciones' | 'estudiantes'>('inscripciones');
  showModal = signal(false);
  
  clearFilters() {
    this.filterStatus.set('todos');
    this.filterCurso.set('todos');
    this.filterSearch.set('');
    this.filterDateStart.set('');
    this.filterDateEnd.set('');
  }

  showStudentModal = signal(false);
  isEditing = signal(false);
  selectedId = signal<number | null>(null);

  // Formularios
  inscripcionForm: FormGroup = this.fb.group({
    id_estudiante: ['', [Validators.required]],
    id_curso: ['', [Validators.required]],
    metodo_pago: ['Fisico', [Validators.required]],
    estado: ['pendiente', [Validators.required]]
  });

  studentForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido_paterno: ['', [Validators.required]],
    apellido_materno: ['', [Validators.required]],
    ci: ['', [Validators.required]],
    celular: ['', [Validators.required]]
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loadInscripciones();
    this.loadEstudiantes();
    this.loadCursos();
  }

  loadInscripciones() {
    this.apiService.getInscripciones().subscribe({
      next: (data) => this.inscripciones.set(data),
      error: (err) => console.error('Error cargando inscripciones:', err)
    });
  }

  loadEstudiantes() {
    this.apiService.getEstudiantes().subscribe({
      next: (data) => {
        const formatted = data.map(e => ({
          ...e,
          nombre_completo: `${e.nombre} ${e.apellido_paterno} ${e.apellido_materno}`.trim()
        }));
        this.estudiantes.set(formatted);
      }
    });
  }

  loadCursos() {
    this.apiService.getCursos().subscribe({
      next: (data) => this.cursos.set(data)
    });
  }

  // --- Gestión Inscripciones ---
  openModal() {
    this.inscripcionForm.reset({ estado: 'pendiente' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveInscripcion() {
    if (this.inscripcionForm.invalid) return;
    this.apiService.createInscripcion(this.inscripcionForm.value).subscribe({
      next: () => {
        this.loadInscripciones();
        this.closeModal();
      },
      error: (err) => alert('Error al inscribir: ' + (err.error?.error || 'Error desconocido'))
    });
  }

  // --- Gestión Estudiantes Simplificada ---
  openStudentModal(estudiante: any = null) {
    this.isEditing.set(!!estudiante);
    this.showStudentModal.set(true);
    if (estudiante) {
      this.selectedId.set(estudiante.id);
      this.studentForm.patchValue(estudiante);
    } else {
      this.selectedId.set(null);
      this.studentForm.reset();
    }
  }

  saveStudent() {
    if (this.studentForm.invalid) return;
    const data = this.studentForm.value;

    if (this.isEditing()) {
      this.apiService.updateEstudiante(this.selectedId()!, data).subscribe({
        next: () => {
          this.loadEstudiantes();
          this.showStudentModal.set(false);
        },
        error: (err) => alert('Error al actualizar: ' + JSON.stringify(err.error))
      });
    } else {
      // Para registro rápido: correo = CI@celu.com, password = CI
      const finalData = {
        ...data,
        correo: `${data.ci}@celucentro.com`,
        password: data.ci
      };
      this.apiService.createEstudiante(finalData).subscribe({
        next: () => {
          this.loadEstudiantes();
          this.showStudentModal.set(false);
        },
        error: (err) => alert('Error al crear: ' + JSON.stringify(err.error))
      });
    }
  }

  confirmInscripcion(inscripcion: any) {
    if (confirm('¿Desea confirmar esta inscripción?')) {
      this.apiService.updateInscripcion(inscripcion.id, { ...inscripcion, estado: 'confirmado' }).subscribe({
        next: () => this.loadInscripciones(),
        error: (err) => console.error('Error al confirmar:', err)
      });
    }
  }

  cancelInscripcion(inscripcion: any) {
    if (confirm('¿Desea cancelar esta inscripción?')) {
      this.apiService.updateInscripcion(inscripcion.id, { ...inscripcion, estado: 'cancelado' }).subscribe({
        next: () => this.loadInscripciones(),
        error: (err) => console.error('Error al cancelar:', err)
      });
    }
  }
}
