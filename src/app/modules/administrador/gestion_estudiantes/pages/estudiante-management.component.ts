import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-estudiante-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estudiante-management.component.html',
  styleUrls: ['../styles/estudiante-management.component.css']
})
export class EstudianteManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);

  estudiantes = signal<any[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  selectedEstudianteId = signal<number | null>(null);

  estudianteForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido_paterno: ['', [Validators.required]],
    apellido_materno: ['', [Validators.required]],
    ci: ['', [Validators.required]],
    celular: ['', [Validators.required]],
    correo: [''], // Se generará automáticamente
    password: [''] // Se generará automáticamente
  });

  ngOnInit() {
    this.loadEstudiantes();
  }

  loadEstudiantes() {
    this.apiService.getEstudiantes().subscribe({
      next: (data) => this.estudiantes.set(data),
      error: (err) => console.error('Error cargando estudiantes:', err)
    });
  }

  openModal(estudiante: any = null) {
    this.isEditing.set(!!estudiante);
    this.showModal.set(true);
    
    if (estudiante) {
      this.selectedEstudianteId.set(estudiante.id);
      this.estudianteForm.patchValue({
        nombre: estudiante.nombre,
        apellido_paterno: estudiante.apellido_paterno,
        apellido_materno: estudiante.apellido_materno,
        ci: estudiante.ci,
        celular: estudiante.celular,
        correo: estudiante.correo
      });
    } else {
      this.selectedEstudianteId.set(null);
      this.estudianteForm.reset();
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.estudianteForm.reset();
  }

  saveEstudiante() {
    if (this.estudianteForm.invalid) return;

    const data = { ...this.estudianteForm.value };
    
    if (this.isEditing()) {
      // Al editar, mantenemos el correo actual (no se edita en el form)
      delete data.password; // No permitimos cambiar password desde aquí
      
      this.apiService.updateEstudiante(this.selectedEstudianteId()!, data).subscribe({
        next: () => {
          this.loadEstudiantes();
          this.closeModal();
        },
        error: (err) => alert('Error al actualizar: ' + JSON.stringify(err.error))
      });
    } else {
      // AUTOMATIZACIÓN: Generar cuenta basada en CI
      data.correo = `${data.ci}@celucentro.com`;
      data.password = data.ci;

      this.apiService.createEstudiante(data).subscribe({
        next: () => {
          this.loadEstudiantes();
          this.closeModal();
        },
        error: (err) => alert('Error al crear: ' + JSON.stringify(err.error))
      });
    }
  }

  toggleStatus(estudiante: any) {
    this.apiService.toggleEstudianteStatus(estudiante.id).subscribe({
      next: (res: any) => {
        // Actualizar el estado localmente para feedback inmediato
        this.estudiantes.update(list => 
          list.map(e => e.id === estudiante.id ? { ...e, estado: res.estado } : e)
        );
      },
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }
}
