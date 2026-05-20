import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeEngineService } from '../../../services/three-engine.service';

@Component({
  selector: 'app-three-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viewer-wrapper" style="position: relative; width: 100%; height: 100%;">
      <!-- Motor 3D -->
      <div #rendererContainer style="width: 100%; height: 100%;"></div>

      <!-- Spinner de Carga -->
      <div class="loading-overlay" *ngIf="isLoading()">
        <div class="spinner-grow text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Botón para ver esquema -->
      <button *ngIf="schemaUrl" 
              class="btn-schema-toggle"
              (click)="showSchema.set(!showSchema())"
              [title]="showSchema() ? 'Cerrar Esquema' : 'Ver Esquema Técnico'">
        <i [class]="showSchema() ? 'bi bi-x-lg' : 'bi bi-file-earmark-image'"></i>
      </button>

      <!-- Overlay del Esquema -->
      <div class="schema-overlay" *ngIf="showSchema()" (click)="showSchema.set(false)">
        <div class="schema-content animate-zoom" (click)="$event.stopPropagation()">
          <div class="d-flex justify-content-between align-items-center mb-2 px-3 pt-3">
            <h6 class="m-0 fw-bold text-white uppercase x-small">Esquema Técnico</h6>
            <button class="btn-close btn-close-white" (click)="showSchema.set(false)"></button>
          </div>
          <div class="p-3">
            <img [src]="schemaUrl" class="img-fluid rounded shadow-lg" alt="Esquema">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .viewer-wrapper { overflow: hidden; }
    
    .btn-schema-toggle {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 45px;
      height: 45px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100;
    }
    .btn-schema-toggle:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .schema-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center;
      z-index: 200;
      cursor: zoom-out;
    }

    .schema-content {
      max-width: 90%;
      max-height: 90%;
      background: #1a1a1a;
      border-radius: 15px;
      border: 1px solid #333;
      cursor: default;
    }

    .schema-content img {
      max-height: 75vh;
      object-fit: contain;
    }

    .animate-zoom { animation: zoomIn 0.3s ease-out; }
    @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .x-small { font-size: 0.7rem; letter-spacing: 1px; }

    .loading-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(33, 37, 41, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 50;
      pointer-events: none;
    }
  `],
  providers: [ThreeEngineService]
})
export class ThreeViewerComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  @Input() src: string | null = null;
  @Input() schemaUrl: string | null = null; // Nueva entrada
  @Input() scale: number = 1;
  @Input() rotation: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };
  @Input() autoRotate: boolean = false;

  showSchema = signal(false); // Signal para controlar visibilidad
  isLoading = signal(false);  // Signal para estado de carga

  private threeEngine = inject(ThreeEngineService);

  ngOnInit(): void {
    this.threeEngine.initEngine(this.rendererContainer.nativeElement);
    if (this.src) {
      this.loadModel();
    }
  }

  private loadModel(): void {
    if (!this.src) return;
    this.isLoading.set(true);
    // Usamos una pequeña demora para que la UI respire antes de la carga pesada
    setTimeout(() => {
      this.threeEngine.loadModel(this.src!, this.scale, this.rotation, this.autoRotate);
      // Como loadModel es asíncrono internamente pero no devuelve promesa, 
      // asumimos que termina pronto o confiamos en que el motor ya está renderizando
      this.isLoading.set(false);
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia el esquema, lo ocultamos por defecto
    if (changes['schemaUrl']) {
      this.showSchema.set(false);
    }

    // Si cambia la URL del modelo, recargamos
    if (changes['src'] && !changes['src'].firstChange && this.src) {
      this.loadModel();
    } 
    // Si solo cambian transformaciones, actualizamos el modelo existente sin recargar archivo
    else if ((changes['scale'] || changes['rotation']) && !changes['src']) {
      this.threeEngine.updateModelTransform(this.scale, this.rotation);
    }
    
    if (changes['autoRotate']) {
      this.threeEngine.setAutoRotate(this.autoRotate);
    }
  }

  ngOnDestroy(): void {
    this.threeEngine.dispose();
  }
}
