import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-estudiante-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  // Filtros
  filterText = signal('');
  filterEstado = signal('todos');

  // Lista filtrada computada
  filteredEstudiantes = computed(() => {
    const text = this.filterText().toLowerCase();
    const estado = this.filterEstado();
    
    return this.estudiantes().filter(e => {
      const matchText = 
        e.nombre.toLowerCase().includes(text) || 
        e.apellido_paterno.toLowerCase().includes(text) || 
        e.apellido_materno.toLowerCase().includes(text) ||
        e.ci.includes(text);
      
      const matchEstado = estado === 'todos' || 
        (estado === 'activo' && e.estado) || 
        (estado === 'inactivo' && !e.estado);
        
      return matchText && matchEstado;
    });
  });
  
  // Señales para mensajes de feedback
  message = signal<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  estudianteForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido_paterno: ['', [Validators.required]],
    apellido_materno: ['', [Validators.required]],
    ci: ['', [Validators.required]],
    celular: ['', [Validators.required]],
    correo: [''], 
    password: [''] 
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

  clearFilters() {
    this.filterText.set('');
    this.filterEstado.set('todos');
  }

  openModal(estudiante: any = null) {
    this.isEditing.set(!!estudiante);
    this.showModal.set(true);
    this.message.set({ text: '', type: null }); // Limpiar mensajes al abrir
    
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
    this.message.set({ text: '', type: null });
  }

  saveEstudiante() {
    // Validar campos vacíos manualmente para mostrar mensaje personalizado
    if (this.estudianteForm.invalid) {
      this.message.set({ 
        text: 'Debe llenar todos los campos obligatorios.', 
        type: 'error' 
      });
      return;
    }

    const data = { ...this.estudianteForm.value };
    this.message.set({ text: '', type: null }); // Limpiar mensajes previos
    
    if (this.isEditing()) {
      delete data.password;
      
      this.apiService.updateEstudiante(this.selectedEstudianteId()!, data).subscribe({
        next: () => {
          this.message.set({ text: 'Estudiante actualizado exitosamente.', type: 'success' });
          setTimeout(() => {
            this.loadEstudiantes();
            this.closeModal();
          }, 1500);
        },
        error: (err) => {
          const errorMsg = err.error?.ci ? 'No se puede usar ese CI, ya existe en el sistema.' : 'Error al actualizar el estudiante.';
          this.message.set({ text: errorMsg, type: 'error' });
        }
      });
    } else {
      data.correo = `${data.ci}@celucentro.com`;
      data.password = data.ci;

      this.apiService.createEstudiante(data).subscribe({
        next: () => {
          this.message.set({ text: '¡Estudiante creado exitosamente!', type: 'success' });
          setTimeout(() => {
            this.loadEstudiantes();
            this.closeModal();
          }, 1500);
        },
        error: (err) => {
          // Manejo específico de CI duplicado
          const errorMsg = err.error?.ci ? 'No se puede usar ese CI, ya existe en el sistema.' : 'Error al crear el estudiante.';
          this.message.set({ text: errorMsg, type: 'error' });
        }
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
