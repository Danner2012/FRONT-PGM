import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CursoService } from '../../../../services/curso.service';

@Component({
  selector: 'app-curso-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './curso-management.component.html',
  styleUrls: ['../styles/curso-management.component.css']
})
export class CursoManagementComponent implements OnInit {
  private cursoService = inject(CursoService);
  private fb = inject(FormBuilder);

  // Listas de datos
  cursos = signal<any[]>([]);
  tiposCurso = signal<any[]>([]);
  horarios = signal<any[]>([]);
  dias = signal<any[]>([]);

  // Control de UI
  activeTab = signal<'cursos' | 'maestros'>('cursos');
  showCursoModal = signal(false);
  showMaestroModal = signal(false);
  maestroType = signal<'tipo' | 'horario'>('tipo');
  isEditing = signal(false);
  selectedId = signal<number | null>(null);

  // Formularios
  cursoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    precio: ['', [Validators.required, Validators.min(0)]],
    id_tipo: ['', [Validators.required]],
    fecha_inicio: ['', [Validators.required]],
    fecha_fin: ['', [Validators.required]],
    estado: [true]
  });

  horarioAsignacionForm: FormGroup = this.fb.group({
    id_dia: ['', [Validators.required]],
    id_horario: ['', [Validators.required]],
    cupo_maximo: [20, [Validators.required, Validators.min(1)]]
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

  // --- Gestión de Cursos ---
  openCursoModal(curso: any = null) {
    this.isEditing.set(!!curso);
    this.showCursoModal.set(true);
    if (curso) {
      this.selectedId.set(curso.id);
      this.cursoForm.patchValue(curso);
    } else {
      this.selectedId.set(null);
      this.cursoForm.reset({ estado: true });
    }
  }

  saveCurso() {
    if (this.cursoForm.invalid) return;
    const data = this.cursoForm.value;
    if (this.isEditing()) {
      this.cursoService.updateCurso(this.selectedId()!, data).subscribe({
        next: () => {
          this.loadCursos();
          this.showCursoModal.set(false);
        },
        error: (err) => alert('Error al actualizar: ' + JSON.stringify(err.error))
      });
    } else {
      this.cursoService.createCurso(data).subscribe({
        next: () => {
          this.loadCursos();
          this.showCursoModal.set(false);
        },
        error: (err) => alert('Error al crear: ' + JSON.stringify(err.error))
      });
    }
  }

  // --- Asignación de Horarios ---
  asignarHorario(cursoId: number) {
    if (this.horarioAsignacionForm.invalid) return;
    const data = { ...this.horarioAsignacionForm.value, id_curso: cursoId };
    this.cursoService.asignarHorario(data).subscribe({
      next: () => {
        this.loadCursos();
        this.horarioAsignacionForm.reset({ cupo_maximo: 20 });
      },
      error: (err) => alert(err.error.error || 'Error al asignar horario')
    });
  }

  quitarHorario(asignacionId: number) {
    if (confirm('¿Está seguro de quitar este horario?')) {
      this.cursoService.quitarHorario(asignacionId).subscribe(() => this.loadCursos());
    }
  }

  // --- Gestión de Maestros ---
  openMaestroModal(type: 'tipo' | 'horario', item: any = null) {
    this.maestroType.set(type);
    this.isEditing.set(!!item);
    this.selectedId.set(item?.id || null);
    this.showMaestroModal.set(true);
    
    if (type === 'tipo') {
      this.tipoForm.patchValue(item || { nombre: '' });
    } else {
      this.horarioMaestroForm.patchValue(item || { nombre: '', hora_inicio: '', hora_fin: '' });
    }
  }

  saveMaestro() {
    if (this.maestroType() === 'tipo') {
      if (this.tipoForm.invalid) return;
      const data = this.tipoForm.value;
      if (this.isEditing()) {
        this.cursoService.updateTipoCurso(this.selectedId()!, data).subscribe(() => {
          this.loadTiposCurso();
          this.showMaestroModal.set(false);
        });
      } else {
        this.cursoService.createTipoCurso(data).subscribe(() => {
          this.loadTiposCurso();
          this.showMaestroModal.set(false);
        });
      }
    } else {
      if (this.horarioMaestroForm.invalid) return;
      const data = this.horarioMaestroForm.value;
      if (this.isEditing()) {
        this.cursoService.updateHorario(this.selectedId()!, data).subscribe(() => {
          this.loadHorarios();
          this.showMaestroModal.set(false);
        });
      } else {
        this.cursoService.createHorario(data).subscribe(() => {
          this.loadHorarios();
          this.showMaestroModal.set(false);
        });
      }
    }
  }

  deleteMaestro(type: 'tipo' | 'horario', id: number) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    if (type === 'tipo') {
      this.cursoService.deleteTipoCurso(id).subscribe(() => this.loadTiposCurso());
    } else {
      this.cursoService.deleteHorario(id).subscribe(() => this.loadHorarios());
    }
  }
}
