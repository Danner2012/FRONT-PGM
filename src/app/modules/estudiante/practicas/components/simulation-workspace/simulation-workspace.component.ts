import { Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PracticaService } from '../../../../../services/practica.service';
import { ThreeViewerComponent } from '../../../../../shared/components/three-viewer/three-viewer.component';
import { CameraRecorderComponent } from '../../../../../shared/components/camera-recorder/camera-recorder.component';
import Swal from 'sweetalert2';

interface TemporaryEvidence {
  file: File;
  previewUrl: any;
  type: 'image' | 'video';
  isUploading: boolean;
}

@Component({
  selector: 'app-simulation-workspace',
  standalone: true,
  imports: [CommonModule, ThreeViewerComponent, CameraRecorderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './simulation-workspace.component.html',
  styleUrls: ['./simulation-workspace.component.css']
})
export class SimulationWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicaService = inject(PracticaService);
  private sanitizer = inject(DomSanitizer);

  practica = signal<any>(null);
  isLoading = signal(true);
  activeTab = signal<'guia' | 'camara' | 'entregables'>('guia');
  
  // Seguimiento de la práctica
  seguimientoPractica = signal<any>(null);
  isUploading = signal(false);

  // Evidencias Temporales (Capturadas por cámara pero no subidas)
  temporaryEvidences = signal<TemporaryEvidence[]>([]);
  showPreviewModal = signal(false);
  selectedPreview = signal<TemporaryEvidence | null>(null);

  // Filtros de Recursos
  searchTerm = signal<string>('');
  selectedType = signal<string>('all');

  // Extraer tipos de recursos únicos de la práctica actual
  resourceTypes = computed(() => {
    const p = this.practica();
    if (!p || !p.recursos) return [];
    
    const types = p.recursos.map((r: any) => r.tipo_recurso_nombre);
    return [...new Set(types)].filter(t => !!t); // Solo tipos únicos y no nulos
  });

  isTeorica = computed(() => {
    const p = this.practica();
    if (!p) return false;
    const tipo = p.tipo_practica_nombre?.toLowerCase() || '';
    return tipo === 'teórica' || tipo === 'teorica';
  });

  filteredRecursos = computed(() => {
    const p = this.practica();
    if (!p || !p.recursos) return [];
    
    let resources = p.recursos;

    // Filtro por búsqueda
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      resources = resources.filter((r: any) => 
        r.titulo.toLowerCase().includes(term) || 
        (r.tipo_recurso_nombre && r.tipo_recurso_nombre.toLowerCase().includes(term))
      );
    }

    // Filtro por tipo dinámico
    if (this.selectedType() !== 'all') {
      resources = resources.filter((r: any) => r.tipo_recurso_nombre === this.selectedType());
    }

    return resources;
  });

  // Estados para el visor 3D
  showViewModal = false;
  selectedHerramienta: any = null;
  modelosActuales: any[] = [];
  activeModelIdx = 0;
  previewUrl3D: string | null = null;
  scaleValue = 1.0;
  rotX = 0; rotY = 0; rotZ = 0;
  activeHUD: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const practicaId = Number(id);
      this.loadPractica(practicaId);
      this.loadSeguimiento(practicaId);
    } else {
      this.router.navigate(['/dashboard/mis-practicas']);
    }
  }

  loadSeguimiento(idPractica: number) {
    this.practicaService.getEstadoPracticaEstudiante(idPractica).subscribe({
      next: (data) => this.seguimientoPractica.set(data),
      error: (err) => console.error('Error cargando seguimiento:', err)
    });
  }

  async onSubirEvidencia(event: any) {
    const file = event.target.files[0];
    if (!file || !this.seguimientoPractica()) return;

    this.isUploading.set(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('id_practica_estudiante', this.seguimientoPractica().id);
    formData.append('descripcion', 'Evidencia subida desde simulación');

    this.practicaService.subirEvidencia(formData).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.loadSeguimiento(this.practica().id);
        Swal.fire('Éxito', 'Evidencia subida correctamente', 'success');
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Error subiendo evidencia:', err);
        Swal.fire('Error', 'No se pudo subir la evidencia', 'error');
      }
    });
  }

  eliminarEvidencia(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.deleteEvidencia(id).subscribe({
          next: () => {
            this.loadSeguimiento(this.practica().id);
            Swal.fire('Eliminado', 'La evidencia ha sido eliminada', 'success');
          },
          error: (err) => {
            console.error('Error eliminando evidencia:', err);
            Swal.fire('Error', 'No se pudo eliminar la evidencia', 'error');
          }
        });
      }
    });
  }

  finalizarEntrega() {
    if (!this.seguimientoPractica()) return;

    Swal.fire({
      title: '¿Finalizar entrega?',
      text: 'Una vez finalizada, no podrás subir más evidencias hasta que sea revisada.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar y enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.practicaService.finalizarEntrega(this.seguimientoPractica().id).subscribe({
          next: () => {
            this.loadSeguimiento(this.practica().id);
            Swal.fire('¡Entregada!', 'Tu práctica ha sido enviada para revisión.', 'success');
          },
          error: (err) => {
            console.error('Error finalizando entrega:', err);
            Swal.fire('Error', 'Hubo un problema al finalizar la entrega.', 'error');
          }
        });
      }
    });
  }

  loadPractica(id: number) {
    this.isLoading.set(true);
    this.practicaService.getPractica(id).subscribe({
      next: (data) => {
        this.practica.set(data);
        this.isLoading.set(false);
        
        // Si es teórica y por alguna razón estamos en la pestaña de cámara, cambiamos a guía
        if (this.isTeorica() && this.activeTab() === 'camara') {
          this.activeTab.set('guia');
        }
      },
      error: (err) => {
        console.error('Error cargando práctica:', err);
        Swal.fire('Error', 'No se pudo cargar la información de la práctica', 'error');
        this.router.navigate(['/dashboard/mis-practicas']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/mis-practicas']);
  }

  getResourceUrl(recurso: any): string | null {
    if (recurso.url_externa) return recurso.url_externa;
    if (recurso.archivo_local) {
      return recurso.archivo_local.startsWith('http') 
        ? recurso.archivo_local 
        : `http://localhost:8000${recurso.archivo_local}`;
    }
    return null;
  }

  isVideo(recurso: any): boolean {
    const url = this.getResourceUrl(recurso);
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mkv', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
           (recurso.tipo_recurso_nombre && recurso.tipo_recurso_nombre.toLowerCase().includes('video'));
  }

  // Métodos para el visor 3D
  viewHerramienta(h: any): void {
    this.selectedHerramienta = h;
    this.showViewModal = true;
    this.modelosActuales = h.modelos_3d || [];
    this.activeModelIdx = 0;
    this.refreshActivePreview();
  }

  closeModal(): void {
    this.showViewModal = false;
    this.selectedHerramienta = null;
    this.activeHUD = null;
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
    const total = this.modelosActuales.length;
    if (total === 0) return;
    this.activeModelIdx = (this.activeModelIdx + 1) % total;
    this.refreshActivePreview();
  }

  prevModel(): void {
    const total = this.modelosActuales.length;
    if (total === 0) return;
    this.activeModelIdx = (this.activeModelIdx - 1 + total) % total;
    this.refreshActivePreview();
  }

  refreshActivePreview(): void {
    this.updatePreviewFromCurrent();
  }

  getSchemaUrl(model: any): string | null {
    if (!model) return null;
    if (model.archivo_esquema) {
      return model.archivo_esquema.startsWith('http') 
        ? model.archivo_esquema 
        : `http://localhost:8000${model.archivo_esquema}`;
    }
    return null;
  }

  getRotation(): { x: number, y: number, z: number } {
    return { x: this.rotX, y: this.rotY, z: this.rotZ };
  }

  // GESTIÓN DE MEDIOS TEMPORALES
  onMediaCaptured(file: File) {
    const type = file.type.startsWith('image') ? 'image' : 'video';
    const objectUrl = URL.createObjectURL(file);
    
    // IMPORTANTE: Para <video> se necesita bypassSecurityTrustResourceUrl
    const previewUrl = type === 'image' 
      ? this.sanitizer.bypassSecurityTrustUrl(objectUrl)
      : this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
    
    this.temporaryEvidences.update(list => [...list, {
      file,
      previewUrl,
      type,
      isUploading: false
    }]);

    // Opcional: Notificación suave
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
    toast.fire({
      icon: 'success',
      title: `${type === 'image' ? 'Foto' : 'Video'} capturado. Revisa la pestaña de Entregas.`
    });
  }

  uploadTemporaryEvidence(index: number) {
    const evidence = this.temporaryEvidences()[index];
    if (!evidence || !this.seguimientoPractica()) return;

    evidence.isUploading = true;
    const formData = new FormData();
    formData.append('archivo', evidence.file);
    formData.append('id_practica_estudiante', this.seguimientoPractica().id);
    formData.append('descripcion', `Evidencia capturada desde cámara (${evidence.type})`);

    this.practicaService.subirEvidencia(formData).subscribe({
      next: () => {
        this.discardTemporaryEvidence(index);
        this.loadSeguimiento(this.practica().id);
        Swal.fire('Éxito', 'Evidencia subida correctamente', 'success');
      },
      error: (err) => {
        evidence.isUploading = false;
        console.error('Error subiendo evidencia:', err);
        Swal.fire('Error', 'No se pudo subir la evidencia', 'error');
      }
    });
  }

  discardTemporaryEvidence(index: number) {
    this.temporaryEvidences.update(list => {
      const newList = [...list];
      newList.splice(index, 1);
      return newList;
    });
  }

  openPreview(evidence: TemporaryEvidence) {
    this.selectedPreview.set(evidence);
    this.showPreviewModal.set(true);
  }

  closePreview() {
    this.showPreviewModal.set(false);
    this.selectedPreview.set(null);
  }
}
