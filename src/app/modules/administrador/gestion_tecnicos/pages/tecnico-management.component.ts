import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-tecnico-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tecnico-management.component.html',
  styleUrls: ['../styles/tecnico-management.component.css']
})
export class TecnicoManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);

  tecnicos = signal<any[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  selectedTecnicoId = signal<number | null>(null);

  tecnicoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido_paterno: ['', [Validators.required]],
    apellido_materno: ['', [Validators.required]],
    ci: ['', [Validators.required]],
    celular: ['', [Validators.required]],
    especialidad: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    password: [''] // Solo requerido al crear
  });

  ngOnInit() {
    this.loadTecnicos();
  }

  loadTecnicos() {
    this.apiService.getTecnicos().subscribe({
      next: (data) => this.tecnicos.set(data),
      error: (err) => console.error('Error cargando técnicos:', err)
    });
  }

  openModal(tecnico: any = null) {
    this.isEditing.set(!!tecnico);
    this.showModal.set(true);
    
    if (tecnico) {
      this.selectedTecnicoId.set(tecnico.id);
      this.tecnicoForm.patchValue({
        nombre: tecnico.nombre,
        apellido_paterno: tecnico.apellido_paterno,
        apellido_materno: tecnico.apellido_materno,
        ci: tecnico.ci,
        celular: tecnico.celular,
        especialidad: tecnico.especialidad,
        correo: tecnico.correo
      });
      // La contraseña no se edita aquí por seguridad
      this.tecnicoForm.get('password')?.clearValidators();
    } else {
      this.selectedTecnicoId.set(null);
      this.tecnicoForm.reset();
      this.tecnicoForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.tecnicoForm.get('password')?.updateValueAndValidity();
  }

  closeModal() {
    this.showModal.set(false);
    this.tecnicoForm.reset();
  }

  saveTecnico() {
    if (this.tecnicoForm.invalid) return;

    const data = this.tecnicoForm.value;
    
    if (this.isEditing()) {
      // Si estamos editando, quitamos la contraseña del objeto si está vacía
      if (!data.password) delete data.password;
      
      this.apiService.updateTecnico(this.selectedTecnicoId()!, data).subscribe({
        next: () => {
          this.loadTecnicos();
          this.closeModal();
        },
        error: (err) => alert('Error al actualizar: ' + JSON.stringify(err.error))
      });
    } else {
      this.apiService.createTecnico(data).subscribe({
        next: () => {
          this.loadTecnicos();
          this.closeModal();
        },
        error: (err) => alert('Error al crear: ' + JSON.stringify(err.error))
      });
    }
  }

  toggleStatus(tecnico: any) {
    this.apiService.toggleTecnicoStatus(tecnico.id).subscribe({
      next: (res: any) => {
        // Actualizar el estado localmente para feedback inmediato
        this.tecnicos.update(list => 
          list.map(t => t.id === tecnico.id ? { ...t, estado: res.estado } : t)
        );
      },
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }
}
