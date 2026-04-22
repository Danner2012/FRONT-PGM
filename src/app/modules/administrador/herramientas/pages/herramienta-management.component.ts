import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HerramientaService } from '../../../../services/herramienta.service';
import { AuthService } from '../../../../services/auth.service';
import { ThreeViewerComponent } from '../components/three-viewer/three-viewer.component';

@Component({
  selector: 'app-herramienta-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ThreeViewerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './herramienta-management.component.html',
  styleUrls: ['./herramienta-management.component.css']
})
export class HerramientaManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private herramientaService = inject(HerramientaService);
  private authService = inject(AuthService);

  herramientas: any[] = [];
  categorias: any[] = [];
  herramientaForm: FormGroup;
  
  showModal = false;
  showViewModal = false; 
  editingId: number | null = null;
  selectedHerramienta: any = null; 

  // Estados para el visor 3D y multimodelo
  modelosActuales: any[] = []; 
  modelosNuevos: any[] = [];   
  activeModelIdx = 0;          
  
  selectedPreviewImg: File | null = null;
  previewUrl3D: string | null = null;
  scaleValue = 1.0;
  rotX = 0; rotY = 0; rotZ = 0;

  // Control de paneles HUD
  activeHUD: string | null = null;

  constructor() {
    this.herramientaForm = this.fb.group({
      nombre: ['', Validators.required],
      id_categoria: ['', Validators.required],
      descripcion: ['', Validators.required],
      uso: ['', Validators.required],
      info_importante: ['', Validators.required],
      id_administrador: [null]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.herramientaService.getHerramientas().subscribe({
      next: (data) => this.herramientas = data,
      error: (err) => console.error('Error cargando herramientas', err)
    });
    this.herramientaService.getCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  public toggleStatus(id: number): void {
    this.herramientaService.toggleStatus(id).subscribe({
      next: () => {
        this.loadData();
      },
      error: () => {
        alert('Error al cambiar el estado de la herramienta');
      }
    });
  }

  openModal(): void {
    this.showModal = true;
    this.showViewModal = false;
    this.editingId = null;
    this.herramientaForm.reset();
    
    this.modelosActuales = [];
    this.modelosNuevos = [];
    this.activeModelIdx = 0;
    this.previewUrl3D = null;
    this.selectedPreviewImg = null;
    this.scaleValue = 1.0;
    this.rotX = 0; this.rotY = 0; this.rotZ = 0;
  }

  closeModal(): void {
    this.showModal = false;
    this.showViewModal = false;
    this.selectedHerramienta = null;
  }

  viewHerramienta(h: any): void {
    this.selectedHerramienta = h;
    this.showViewModal = true;
    this.showModal = false;
    this.modelosActuales = h.modelos_3d || [];
    this.activeModelIdx = 0;
    this.refreshActivePreview();
  }

  updatePreviewFromCurrent(): void {
    if (this.modelosActuales.length > 0) {
      const model = this.modelosActuales[this.activeModelIdx];
      this.previewUrl3D = model.archivo.startsWith('http') 
        ? model.archivo 
        : `http://localhost:8000${model.archivo}`;
      this.scaleValue = model.escala;
      const rot = (model.rotacion_default || '0 0 0').split(' ');
      this.rotX = parseFloat(rot[0] || '0');
      this.rotY = parseFloat(rot[1] || '0');
      this.rotZ = parseFloat(rot[2] || '0');
    } else {
      this.previewUrl3D = null;
    }
  }

  nextModel(): void {
    const total = this.modelosActuales.length + this.modelosNuevos.length;
    if (total === 0) return;
    this.syncActiveConfig();
    this.activeModelIdx = (this.activeModelIdx + 1) % total;
    this.refreshActivePreview();
  }

  prevModel(): void {
    const total = this.modelosActuales.length + this.modelosNuevos.length;
    if (total === 0) return;
    this.syncActiveConfig();
    this.activeModelIdx = (this.activeModelIdx - 1 + total) % total;
    this.refreshActivePreview();
  }

  refreshActivePreview(): void {
    const nActuales = this.modelosActuales.length;
    if (this.activeModelIdx < nActuales) {
      this.updatePreviewFromCurrent();
    } else {
      const idxNuevo = this.activeModelIdx - nActuales;
      const m = this.modelosNuevos[idxNuevo];
      this.previewUrl3D = m.previewUrl;
      this.scaleValue = m.escala;
      this.rotX = m.rotX; this.rotY = m.rotY; this.rotZ = m.rotZ;
    }
  }

  onFile3DSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const nuevo = {
        archivo: file,
        previewUrl: URL.createObjectURL(file),
        escala: 1.0,
        rotX: 0, rotY: 0, rotZ: 0,
        nombre_identificador: `Modelo ${this.modelosActuales.length + this.modelosNuevos.length + 1}`
      };
      this.modelosNuevos.push(nuevo);
      this.activeModelIdx = this.modelosActuales.length + this.modelosNuevos.length - 1;
      this.refreshActivePreview();
      event.target.value = '';
    }
  }

  removeActiveModel(): void {
    const nActuales = this.modelosActuales.length;
    if (this.activeModelIdx < nActuales) {
      const m = this.modelosActuales[this.activeModelIdx];
      if (confirm(`¿Seguro que desea eliminar el modelo "${m.nombre_identificador}"?`)) {
        this.herramientaService.deleteModelo3D(m.id).subscribe({
          next: () => {
            this.modelosActuales.splice(this.activeModelIdx, 1);
            this.activeModelIdx = 0;
            this.refreshActivePreview();
          },
          error: () => alert('Error al eliminar el modelo de la base de datos')
        });
      }
    } else {
      this.modelosNuevos.splice(this.activeModelIdx - nActuales, 1);
      this.activeModelIdx = 0;
      this.refreshActivePreview();
    }
  }

  syncActiveConfig(): void {
    const nActuales = this.modelosActuales.length;
    if (this.activeModelIdx >= nActuales) {
      const idxNuevo = this.activeModelIdx - nActuales;
      if (this.modelosNuevos[idxNuevo]) {
        this.modelosNuevos[idxNuevo].escala = this.scaleValue;
        this.modelosNuevos[idxNuevo].rotX = this.rotX;
        this.modelosNuevos[idxNuevo].rotY = this.rotY;
        this.modelosNuevos[idxNuevo].rotZ = this.rotZ;
      }
    } else {
      const m = this.modelosActuales[this.activeModelIdx];
      if (m) {
        m.escala = this.scaleValue;
        m.rotacion_default = `${this.rotX} ${this.rotY} ${this.rotZ}`;
      }
    }
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedPreviewImg = file;
    }
  }

  getRotation(): { x: number, y: number, z: number } {
    return { x: this.rotX, y: this.rotY, z: this.rotZ };
  }

  saveHerramienta(): void {
    if (this.herramientaForm.invalid) return;
    this.syncActiveConfig();

    const user = this.authService.currentUser();
    const adminId = user?.perfil_id || user?.id;

    if (!adminId) {
      alert('Error: No se pudo identificar su perfil de administrador.');
      return;
    }

    const formData = new FormData();
    const formValues = this.herramientaForm.value;
    formData.append('nombre', formValues.nombre);
    formData.append('id_categoria', formValues.id_categoria);
    formData.append('descripcion', formValues.descripcion);
    formData.append('uso', formValues.uso);
    formData.append('info_importante', formValues.info_importante);
    formData.append('id_administrador', adminId.toString());
    
    if (this.selectedPreviewImg) formData.append('imagen_previa', this.selectedPreviewImg);

    const afterSave = (herramientaId: number) => {
      const subirPromesas = this.modelosNuevos.map(m => {
        const fd = new FormData();
        fd.append('archivo', m.archivo);
        fd.append('escala', m.escala.toString());
        fd.append('nombre_identificador', m.nombre_identificador);
        fd.append('rotacion_default', `${m.rotX} ${m.rotY} ${m.rotZ}`);
        return this.herramientaService.subirModelo3D(herramientaId, fd).toPromise();
      });

      const updatePromesas = this.modelosActuales.map(m => {
        return this.herramientaService.updateConfig3D(m.id, {
          escala: m.escala,
          rotacion_default: m.rotacion_default
        }).toPromise();
      });

      Promise.all([...subirPromesas, ...updatePromesas]).then(() => {
        this.loadData();
        this.closeModal();
      }).catch(() => {
        alert('Herramienta guardada, pero hubo errores con algunos modelos 3D.');
        this.loadData();
        this.closeModal();
      });
    };

    if (this.editingId) {
      this.herramientaService.updateHerramienta(this.editingId, formData).subscribe({
        next: () => afterSave(this.editingId!),
        error: () => alert('Error al actualizar herramienta')
      });
    } else {
      this.herramientaService.createHerramienta(formData).subscribe({
        next: (res) => afterSave(res.id),
        error: () => alert('Error al crear herramienta')
      });
    }
  }

  editHerramienta(h: any): void {
    this.editingId = h.id;
    this.showModal = true;
    this.showViewModal = false;
    this.herramientaForm.patchValue({
      nombre: h.nombre,
      id_categoria: h.id_categoria,
      descripcion: h.descripcion,
      uso: h.uso,
      info_importante: h.info_importante
    });
    
    this.modelosActuales = JSON.parse(JSON.stringify(h.modelos_3d || []));
    this.modelosNuevos = [];
    this.activeModelIdx = 0;
    this.refreshActivePreview();
  }
}
