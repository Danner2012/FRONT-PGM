import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HerramientaService } from '../../../../services/herramienta.service';
import { AuthService } from '../../../../services/auth.service';
import '@google/model-viewer';

@Component({
  selector: 'app-herramienta-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  // Estados para el visor 3D
  selectedFile3D: File | null = null;
  selectedPreviewImg: File | null = null;
  previewUrl3D: string | null = null;
  scaleValue = 1.0;
  rotX = 0; rotY = 0; rotZ = 0;

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

  loadData() {
    this.herramientaService.getHerramientas().subscribe(data => this.herramientas = data);
    this.herramientaService.getCategorias().subscribe(data => this.categorias = data);
  }

  openModal() {
    this.showModal = true;
    this.showViewModal = false;
    this.editingId = null;
    this.herramientaForm.reset();
    this.previewUrl3D = null;
    this.selectedFile3D = null;
    this.selectedPreviewImg = null;
    this.scaleValue = 1.0;
    this.rotX = 0; this.rotY = 0; this.rotZ = 0;
  }

  closeModal() {
    this.showModal = false;
    this.showViewModal = false;
    this.selectedHerramienta = null;
  }

  viewHerramienta(h: any) {
    this.selectedHerramienta = h;
    this.showViewModal = true;
    this.showModal = false;
    
    if (h.modelos_3d && h.modelos_3d.length > 0) {
      const model = h.modelos_3d[0];
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

  onFile3DSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile3D = file;
      this.previewUrl3D = URL.createObjectURL(file);
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPreviewImg = file;
    }
  }

  getCameraOrbit() {
    return `${this.rotX}deg ${this.rotY}deg ${this.rotZ}m`;
  }

  getScale() {
    return `${this.scaleValue} ${this.scaleValue} ${this.scaleValue}`;
  }

  saveHerramienta() {
    if (this.herramientaForm.invalid) return;

    const user = this.authService.currentUser();
    const adminId = user?.perfil_id || user?.id; // Intento de fallback

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

    const successCallback = (res: any) => {
      if (this.selectedFile3D) {
        this.upload3D(this.editingId || res.id);
      } else {
        this.loadData();
        this.closeModal();
      }
    };

    if (this.editingId) {
      this.herramientaService.updateHerramienta(this.editingId, formData).subscribe({
        next: successCallback,
        error: () => alert('Error al actualizar herramienta')
      });
    } else {
      this.herramientaService.createHerramienta(formData).subscribe({
        next: successCallback,
        error: () => alert('Error al crear herramienta')
      });
    }
  }

  upload3D(herramientaId: number) {
    const formData = new FormData();
    formData.append('archivo', this.selectedFile3D!);
    formData.append('escala', this.scaleValue.toString());
    formData.append('nombre_identificador', 'Modelo Principal');
    formData.append('rotacion_default', `${this.rotX} ${this.rotY} ${this.rotZ}`);
    
    this.herramientaService.subirModelo3D(herramientaId, formData).subscribe({
      next: () => {
        this.loadData();
        this.closeModal();
      },
      error: () => {
        alert('Error al subir modelo 3D');
        this.loadData();
        this.closeModal();
      }
    });
  }

  deleteHerramienta(id: number) {
    if (confirm('¿Estás seguro de eliminar esta herramienta?')) {
      this.herramientaService.deleteHerramienta(id).subscribe(() => this.loadData());
    }
  }

  editHerramienta(h: any) {
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
    
    if (h.modelos_3d && h.modelos_3d.length > 0) {
      const model = h.modelos_3d[0];
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
}
