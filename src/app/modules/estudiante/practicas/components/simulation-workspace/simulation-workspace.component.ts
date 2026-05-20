import { Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PracticaService } from '../../../../../services/practica.service';
import { ThreeViewerComponent } from '../../../../../shared/components/three-viewer/three-viewer.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-simulation-workspace',
  standalone: true,
  imports: [CommonModule, ThreeViewerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './simulation-workspace.component.html',
  styleUrls: ['./simulation-workspace.component.css']
})
export class SimulationWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicaService = inject(PracticaService);

  practica = signal<any>(null);
  isLoading = signal(true);
  activeTab = signal<'guia' | 'camara'>('guia');
  
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

  // Gestión de Cámara
  stream: MediaStream | null = null;
  cameraActive = signal(false);
  availableCameras = signal<MediaDeviceInfo[]>([]);
  selectedCameraId = signal<string>('');

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
      this.loadPractica(Number(id));
      this.loadAvailableCameras();
    } else {
      this.router.navigate(['/dashboard/mis-practicas']);
    }
  }

  async loadAvailableCameras() {
    try {
      // Pedimos permiso primero para obtener los nombres de los dispositivos
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      this.availableCameras.set(videoDevices);
      if (videoDevices.length > 0) {
        this.selectedCameraId.set(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error listando cámaras:', err);
    }
  }

  async toggleCamera() {
    if (this.cameraActive()) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }

  async startCamera() {
    try {
      if (this.stream) {
        this.stopCamera();
      }

      const constraints = {
        video: {
          deviceId: this.selectedCameraId() ? { exact: this.selectedCameraId() } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1.7777777778 } // 16:9
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.getElementById('cameraFeed') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.stream;
        this.cameraActive.set(true);
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      Swal.fire('Error', 'No se pudo acceder a la cámara seleccionada.', 'error');
    }
  }

  onCameraChange(deviceId: string) {
    this.selectedCameraId.set(deviceId);
    if (this.cameraActive()) {
      this.startCamera(); // Reiniciar con la nueva cámara si ya estaba encendida
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraActive.set(false);
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  loadPractica(id: number) {
    this.isLoading.set(true);
    this.practicaService.getPractica(id).subscribe({
      next: (data) => {
        this.practica.set(data);
        this.isLoading.set(false);
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

  getRotation(): { x: number, y: number, z: number } {
    return { x: this.rotX, y: this.rotY, z: this.rotZ };
  }
}
