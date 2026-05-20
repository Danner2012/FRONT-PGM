import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HerramientaService } from '../../../../services/herramienta.service';
import { AuthService } from '../../../../services/auth.service';
import { ThreeViewerComponent } from '../../../../shared/components/three-viewer/three-viewer.component';
import Swal from 'sweetalert2';

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

  // Signals de Datos
  herramientas = signal<any[]>([]);
  categorias = signal<any[]>([]);

  // Signals de Filtrado
  filterNombre = signal<string>('');
  filterCategoria = signal<string>('todos');
  filterEstado = signal<string>('todos');

  // Lógica de Filtrado Reactiva
  filteredHerramientas = computed(() => {
    let data = this.herramientas();
    if (this.filterNombre()) {
      const s = this.filterNombre().toLowerCase();
      data = data.filter(h => h.nombre.toLowerCase().includes(s));
    }
    if (this.filterCategoria() !== 'todos') {
      data = data.filter(h => h.id_categoria?.toString() === this.filterCategoria());
    }
    if (this.filterEstado() !== 'todos') {
      const active = this.filterEstado() === 'activo';
      data = data.filter(h => h.estado === active);
    }
    return data;
  });

  clearFilters() {
    this.filterNombre.set('');
    this.filterCategoria.set('todos');
    this.filterEstado.set('todos');
  }

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
      stock_total: [0, [Validators.required, Validators.min(0)]],
      stock_disponible: [0, [Validators.required, Validators.min(0)]],
      id_administrador: [null]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  showError(err: any, defaultMsg: string) {
    console.error(err);
    let errorDetail = '';
    if (err.error) {
      if (typeof err.error === 'string') {
        errorDetail = err.error;
      } else if (typeof err.error === 'object') {
        errorDetail = Object.entries(err.error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}`)
          .join('\n');
      }
    }
    Swal.fire('Error', errorDetail || defaultMsg, 'error');
  }

  loadData(): void {
    this.herramientaService.getHerramientas().subscribe({
      next: (data) => this.herramientas.set(data),
      error: (err) => console.error('Error cargando herramientas', err)
    });
    this.herramientaService.getCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  public toggleStatus(id: number): void {
    this.herramientaService.toggleStatus(id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => this.showError(err, 'Error al cambiar el estado de la herramienta')
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
        archivo_esquema: null as File | null,
        schemaPreview: null as string | null,
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

  onSchemaSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const nActuales = this.modelosActuales.length;
      if (this.activeModelIdx >= nActuales) {
        const idxNuevo = this.activeModelIdx - nActuales;
        this.modelosNuevos[idxNuevo].archivo_esquema = file;
        this.modelosNuevos[idxNuevo].schemaPreview = URL.createObjectURL(file);
      } else {
        this.modelosActuales[this.activeModelIdx].nuevo_esquema = file;
        this.modelosActuales[this.activeModelIdx].schemaPreview = URL.createObjectURL(file);
      }
    }
  }

  getSchemaUrl(model: any): string | null {
    if (!model) return null;
    if (model.schemaPreview) return model.schemaPreview;
    if (model.archivo_esquema) {
      return model.archivo_esquema.startsWith('http') 
        ? model.archivo_esquema 
        : `http://localhost:8000${model.archivo_esquema}`;
    }
    return null;
  }

  getSchemaPreview(): string | null {
    const nActuales = this.modelosActuales.length;
    if (this.activeModelIdx < nActuales) {
      const m = this.modelosActuales[this.activeModelIdx];
      if (m.schemaPreview) return m.schemaPreview;
      if (m.archivo_esquema) {
        return m.archivo_esquema.startsWith('http') ? m.archivo_esquema : `http://localhost:8000${m.archivo_esquema}`;
      }
    } else {
      return this.modelosNuevos[this.activeModelIdx - nActuales]?.schemaPreview || null;
    }
    return null;
  }

  removeActiveModel(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const nActuales = this.modelosActuales.length;
    
    // CASO 1: Es un modelo que ya existe en la base de datos
    if (this.activeModelIdx < nActuales) {
      const m = this.modelosActuales[this.activeModelIdx];
      
      // Verificación de seguridad: si no tiene ID (poco probable pero posible), solo quitar de lista
      if (!m.id) {
        this.modelosActuales.splice(this.activeModelIdx, 1);
        this.resetAfterDelete();
        return;
      }

      this.herramientaService.deleteModelo3D(m.id).subscribe({
        next: () => {
          this.modelosActuales.splice(this.activeModelIdx, 1);
          this.resetAfterDelete();
          this.showSuccessToast('Modelo eliminado de la base de datos');
        },
        error: (err) => {
          console.error('Error al borrar de DB:', err);
          // Si el error es 404, significa que ya no existe, lo quitamos de la lista local
          if (err.status === 404) {
            this.modelosActuales.splice(this.activeModelIdx, 1);
            this.resetAfterDelete();
          } else {
            this.showError(err, 'No se pudo eliminar el modelo del servidor');
          }
        }
      });
    } 
    // CASO 2: Es un modelo nuevo que aún no se ha guardado
    else {
      const idxNuevo = this.activeModelIdx - nActuales;
      if (this.modelosNuevos[idxNuevo]) {
        this.modelosNuevos.splice(idxNuevo, 1);
        this.resetAfterDelete();
        this.showSuccessToast('Modelo nuevo descartado');
      }
    }
  }

  private resetAfterDelete(): void {
    this.activeModelIdx = 0;
    this.refreshActivePreview();
  }

  private showSuccessToast(message: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: message });
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
      Swal.fire('Error', 'No se pudo identificar su perfil de administrador.', 'error');
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
    formData.append('stock_total', formValues.stock_total.toString());
    formData.append('stock_disponible', formValues.stock_disponible.toString());
    
    if (this.selectedPreviewImg) formData.append('imagen_previa', this.selectedPreviewImg);

    const afterSave = (herramientaId: number) => {
      const subirPromesas = this.modelosNuevos.map(m => {
        const fd = new FormData();
        fd.append('archivo', m.archivo);
        fd.append('escala', m.escala.toString());
        fd.append('nombre_identificador', m.nombre_identificador);
        fd.append('rotacion_default', `${m.rotX} ${m.rotY} ${m.rotZ}`);
        if (m.archivo_esquema) fd.append('archivo_esquema', m.archivo_esquema);
        return this.herramientaService.subirModelo3D(herramientaId, fd).toPromise();
      });

      const updatePromesas = this.modelosActuales.map(m => {
        const configFd = new FormData();
        configFd.append('escala', m.escala.toString());
        configFd.append('rotacion_default', m.rotacion_default);
        if (m.nuevo_esquema) configFd.append('archivo_esquema', m.nuevo_esquema);
        return this.herramientaService.updateConfig3D(m.id, configFd).toPromise();
      });

      Promise.all([...subirPromesas, ...updatePromesas]).then(() => {
        Swal.fire('Éxito', 'Herramienta guardada correctamente', 'success');
        this.loadData();
        this.closeModal();
      }).catch((err) => {
        this.showError(err, 'Herramienta guardada, pero hubo errores con algunos modelos 3D.');
        this.loadData();
        this.closeModal();
      });
    };

    if (this.editingId) {
      this.herramientaService.updateHerramienta(this.editingId, formData).subscribe({
        next: () => afterSave(this.editingId!),
        error: (err) => this.showError(err, 'Error al actualizar herramienta')
      });
    } else {
      this.herramientaService.createHerramienta(formData).subscribe({
        next: (res) => afterSave(res.id),
        error: (err) => this.showError(err, 'Error al crear herramienta')
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
      info_importante: h.info_importante,
      stock_total: h.stock_total,
      stock_disponible: h.stock_disponible
    });
    
    this.modelosActuales = JSON.parse(JSON.stringify(h.modelos_3d || []));
    this.modelosNuevos = [];
    this.activeModelIdx = 0;
    this.refreshActivePreview();
  }
}
