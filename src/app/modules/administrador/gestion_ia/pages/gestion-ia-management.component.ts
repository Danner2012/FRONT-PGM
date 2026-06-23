import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IaService } from '../../../../services/ia.service';
import { HerramientaService } from '../../../../services/herramienta.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-ia-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './gestion-ia-management.component.html',
  styleUrls: ['../styles/gestion-ia-management.component.css']
})
export class GestionIaManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private iaService = inject(IaService);
  private herramientaService = inject(HerramientaService);

  // Catalogo de clases IA del detector de estudiante
  clasesIaDisponibles = signal<string[]>(['CAPACITOR', 'FPC', 'BOBINA']);

  // Datos de base de datos
  afiches = signal<any[]>([]);
  herramientasDisponibles = signal<any[]>([]);

  // Filtros
  filtroClase = signal<string>('TODOS');

  // Filtrado de afiches reactivo
  filteredAfiches = computed(() => {
    const list = this.afiches();
    const filter = this.filtroClase().toUpperCase();
    if (filter === 'TODOS') return list;
    return list.filter(a => a.clase_ia?.toUpperCase() === filter);
  });

  // Control de interfaz
  showModal = false;
  editingId: number | null = null;
  selectedAfiche: any = null;
  activeTab = signal<string>('general'); // general, funcion, medicion, reparacion

  // Formularios
  aficheForm!: FormGroup;

  // Archivos seleccionados para subida
  selectedReferenciaImg: File | null = null;
  selectedSimboloImg: File | null = null;

  // Medios temporales para pasos (clave: pasoIndex, valor: array de archivos)
  pasosMedicionMedios: { [key: number]: File[] } = {};
  pasosProcedimientoMedios: { [key: number]: File[] } = {};

  // URL previas para las imágenes generales
  previewReferenciaUrl: string | null = null;
  previewSimboloUrl: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.aficheForm = this.fb.group({
      clase_ia: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion_general: ['', Validators.required],
      funciones: this.fb.array([]),
      caracteristicas: this.fb.array([]),
      pasos_medicion: this.fb.array([]),
      pasos_procedimiento: this.fb.array([]),
      herramientas: [[]] // Array de IDs de herramientas
    });
  }

  // --- GETTERS DE FORMARRAY ---
  get funciones(): FormArray {
    return this.aficheForm.get('funciones') as FormArray;
  }

  get caracteristicas(): FormArray {
    return this.aficheForm.get('caracteristicas') as FormArray;
  }

  get pasosMedicion(): FormArray {
    return this.aficheForm.get('pasos_medicion') as FormArray;
  }

  get pasosProcedimiento(): FormArray {
    return this.aficheForm.get('pasos_procedimiento') as FormArray;
  }

  // --- CARGA DE DATOS ---
  loadData() {
    this.iaService.getAfiches().subscribe({
      next: (data) => this.afiches.set(data),
      error: (err) => console.error('Error al cargar los afiches de la IA', err)
    });

    this.herramientaService.getHerramientas().subscribe({
      next: (data) => this.herramientasDisponibles.set(data),
      error: (err) => console.error('Error al cargar herramientas de base de datos', err)
    });
  }

  // --- ACCIONES DE FORMULARIO DINÁMICO ---
  
  // Agregar funciones (checks)
  addFuncion(texto: string = '') {
    this.funciones.push(this.fb.group({
      texto: [texto, Validators.required],
      activo: [true]
    }));
  }

  removeFuncion(index: number) {
    this.funciones.removeAt(index);
  }

  // Agregar características (viñetas)
  addCaracteristica(texto: string = '') {
    this.caracteristicas.push(this.fb.group({
      texto: [texto, Validators.required]
    }));
  }

  removeCaracteristica(index: number) {
    this.caracteristicas.removeAt(index);
  }

  // Pasos de Medición
  addPasoMedicion(descripcion: string = '', orden: number | null = null) {
    const nextOrden = orden !== null ? orden : this.pasosMedicion.length + 1;
    const paso = this.fb.group({
      id: [null],
      orden: [nextOrden, Validators.required],
      descripcion: [descripcion, Validators.required],
      recursos_existentes: [[]] // Para mostrar videos/fotos ya subidos
    });
    this.pasosMedicion.push(paso);
    this.pasosMedicionMedios[this.pasosMedicion.length - 1] = [];
  }

  removePasoMedicion(index: number) {
    this.pasosMedicion.removeAt(index);
    // Reordenar pasos
    this.pasosMedicion.controls.forEach((c, idx) => {
      c.patchValue({ orden: idx + 1 });
    });
    delete this.pasosMedicionMedios[index];
  }

  // Pasos de Procedimiento (Cambios o Reparaciones)
  addPasoProcedimiento(descripcion: string = '', orden: number | null = null) {
    const nextOrden = orden !== null ? orden : this.pasosProcedimiento.length + 1;
    const paso = this.fb.group({
      id: [null],
      orden: [nextOrden, Validators.required],
      descripcion: [descripcion, Validators.required],
      recursos_existentes: [[]]
    });
    this.pasosProcedimiento.push(paso);
    this.pasosProcedimientoMedios[this.pasosProcedimiento.length - 1] = [];
  }

  removePasoProcedimiento(index: number) {
    this.pasosProcedimiento.removeAt(index);
    // Reordenar pasos
    this.pasosProcedimiento.controls.forEach((c, idx) => {
      c.patchValue({ orden: idx + 1 });
    });
    delete this.pasosProcedimientoMedios[index];
  }

  // --- SELECCIÓN DE ARCHIVOS ---
  onReferenciaSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.selectedReferenciaImg = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewReferenciaUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  onSimboloSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.selectedSimboloImg = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewSimboloUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  onPasoMedicionFileSelected(event: any, index: number) {
    if (event.target.files) {
      const files: FileList = event.target.files;
      if (!this.pasosMedicionMedios[index]) {
        this.pasosMedicionMedios[index] = [];
      }
      for (let i = 0; i < files.length; i++) {
        this.pasosMedicionMedios[index].push(files[i]);
      }
    }
  }

  removePasoMedicionFile(pasoIdx: number, fileIdx: number) {
    this.pasosMedicionMedios[pasoIdx].splice(fileIdx, 1);
  }

  onPasoProcedimientoFileSelected(event: any, index: number) {
    if (event.target.files) {
      const files: FileList = event.target.files;
      if (!this.pasosProcedimientoMedios[index]) {
        this.pasosProcedimientoMedios[index] = [];
      }
      for (let i = 0; i < files.length; i++) {
        this.pasosProcedimientoMedios[index].push(files[i]);
      }
    }
  }

  removePasoProcedimientoFile(pasoIdx: number, fileIdx: number) {
    this.pasosProcedimientoMedios[pasoIdx].splice(fileIdx, 1);
  }

  // --- MODAL CONTROLS ---
  openCreateModal() {
    this.editingId = null;
    this.showModal = true;
    this.activeTab.set('general');
    this.selectedReferenciaImg = null;
    this.selectedSimboloImg = null;
    this.previewReferenciaUrl = null;
    this.previewSimboloUrl = null;
    this.pasosMedicionMedios = {};
    this.pasosProcedimientoMedios = {};
    
    this.initForm();
    // Valores por defecto sugeridos
    this.addFuncion('Filtrado');
    this.addFuncion('Estabilización');
    this.addCaracteristica('No polarizado');
  }

  openEditModal(afiche: any) {
    this.editingId = afiche.id;
    this.showModal = true;
    this.activeTab.set('general');
    this.selectedReferenciaImg = null;
    this.selectedSimboloImg = null;
    this.previewReferenciaUrl = afiche.imagen_referencia || null;
    this.previewSimboloUrl = afiche.imagen_simbolo || null;
    this.pasosMedicionMedios = {};
    this.pasosProcedimientoMedios = {};

    this.aficheForm = this.fb.group({
      clase_ia: [afiche.clase_ia, Validators.required],
      nombre: [afiche.nombre, Validators.required],
      descripcion_general: [afiche.descripcion_general || '', Validators.required],
      funciones: this.fb.array([]),
      caracteristicas: this.fb.array([]),
      pasos_medicion: this.fb.array([]),
      pasos_procedimiento: this.fb.array([]),
      herramientas: [afiche.herramientas?.map((h: any) => h.id) || []]
    });

    // Rellenar funciones
    afiche.funciones?.forEach((f: any) => {
      this.addFuncion(f.texto);
    });

    // Rellenar características
    afiche.caracteristicas?.forEach((c: any) => {
      this.addCaracteristica(c.texto);
    });

    // Rellenar pasos de medición
    afiche.pasos_medicion?.forEach((p: any) => {
      this.pasosMedicion.push(this.fb.group({
        id: [p.id],
        orden: [p.orden, Validators.required],
        descripcion: [p.descripcion, Validators.required],
        recursos_existentes: [p.recursos || []]
      }));
    });

    // Rellenar pasos de procedimiento
    afiche.pasos_procedimiento?.forEach((p: any) => {
      this.pasosProcedimiento.push(this.fb.group({
        id: [p.id],
        orden: [p.orden, Validators.required],
        descripcion: [p.descripcion, Validators.required],
        recursos_existentes: [p.recursos || []]
      }));
    });
  }

  closeModal() {
    this.showModal = false;
  }

  // --- SUBMIT ---
  onSubmit() {
    if (this.aficheForm.invalid) {
      this.aficheForm.markAllAsTouched();
      Swal.fire('Atención', 'Por favor, rellene todos los campos obligatorios.', 'warning');
      return;
    }

    const formData = new FormData();
    const formValue = this.aficheForm.value;

    formData.append('clase_ia', formValue.clase_ia);
    formData.append('nombre', formValue.nombre);
    formData.append('descripcion_general', formValue.descripcion_general);

    // Archivos de imagen principales
    if (this.selectedReferenciaImg) {
      formData.append('imagen_referencia', this.selectedReferenciaImg);
    }
    if (this.selectedSimboloImg) {
      formData.append('imagen_simbolo', this.selectedSimboloImg);
    }

    // Funciones y Características como JSON stringificado o campos individuales
    formData.append('funciones', JSON.stringify(formValue.funciones));
    formData.append('caracteristicas', JSON.stringify(formValue.caracteristicas));
    
    // Herramientas
    formData.append('herramientas', JSON.stringify(formValue.herramientas));

    // Estructurar Pasos de Medición y Procedimiento sin archivos
    // Los archivos se subirán con referencias o mapeo de índice
    formData.append('pasos_medicion', JSON.stringify(formValue.pasos_medicion.map((p: any, idx: number) => ({
      id: p.id,
      orden: p.orden,
      descripcion: p.descripcion
    }))));

    formData.append('pasos_procedimiento', JSON.stringify(formValue.pasos_procedimiento.map((p: any, idx: number) => ({
      id: p.id,
      orden: p.orden,
      descripcion: p.descripcion
    }))));

    // Adjuntar archivos de pasos de medición mapeados por índice
    Object.keys(this.pasosMedicionMedios).forEach((pasoIdx) => {
      const archivos = this.pasosMedicionMedios[Number(pasoIdx)];
      archivos.forEach((file) => {
        formData.append(`medicion_archivos_paso_${pasoIdx}`, file);
      });
    });

    // Adjuntar archivos de pasos de procedimiento mapeados por índice
    Object.keys(this.pasosProcedimientoMedios).forEach((pasoIdx) => {
      const archivos = this.pasosProcedimientoMedios[Number(pasoIdx)];
      archivos.forEach((file) => {
        formData.append(`procedimiento_archivos_paso_${pasoIdx}`, file);
      });
    });

    Swal.fire({
      title: 'Guardando Afiche...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    if (this.editingId) {
      this.iaService.updateAfiche(this.editingId, formData).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Afiche actualizado correctamente', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Hubo un error al actualizar el afiche del componente', 'error');
        }
      });
    } else {
      this.iaService.createAfiche(formData).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Afiche de componente IA creado correctamente', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Hubo un error al crear el afiche del componente', 'error');
        }
      });
    }
  }

  // --- BORRAR AFICHE ---
  onDeleteAfiche(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el afiche de forma permanente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.iaService.deleteAfiche(id).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El afiche ha sido eliminado', 'success');
            this.loadData();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el afiche', 'error');
          }
        });
      }
    });
  }

  // Helpers visuales
  getColorClase(clase: string): string {
    switch (clase?.toUpperCase()) {
      case 'FPC': return '#ff6400';
      case 'CAPACITOR': return '#00a5ff';
      case 'BOBINA': return '#ff0000';
      default: return '#00cccc';
    }
  }

  getHerramientasNombres(herramientasIds: any[]): string {
    if (!herramientasIds || herramientasIds.length === 0) return 'Ninguna';
    return herramientasIds.map(h => h.nombre).join(', ');
  }

  isHerramientaSelected(toolId: number): boolean {
    const seleccionadas = this.aficheForm.get('herramientas')?.value;
    return Array.isArray(seleccionadas) && seleccionadas.includes(toolId);
  }

  onHerramientaToggle(toolId: number, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const herramientasControl = this.aficheForm.get('herramientas');
    if (herramientasControl) {
      const currentList = herramientasControl.value || [];
      if (checkbox.checked) {
        herramientasControl.setValue([...currentList, toolId]);
      } else {
        herramientasControl.setValue(currentList.filter((id: number) => id !== toolId));
      }
    }
  }
}
