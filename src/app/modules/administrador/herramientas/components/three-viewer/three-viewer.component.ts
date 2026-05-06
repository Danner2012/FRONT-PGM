import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeEngineService } from '../../../../../services/three-engine.service';

@Component({
  selector: 'app-three-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `<div #rendererContainer style="width: 100%; height: 100%;"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    div { outline: none; }
  `],
  providers: [ThreeEngineService] // Provee una instancia única por cada componente visor
})
export class ThreeViewerComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  @Input() src: string | null = null;
  @Input() scale: number = 1;
  @Input() rotation: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };
  @Input() autoRotate: boolean = false;

  private threeEngine = inject(ThreeEngineService);

  ngOnInit(): void {
    this.threeEngine.initEngine(this.rendererContainer.nativeElement);
    if (this.src) {
      this.threeEngine.loadModel(this.src, this.scale, this.rotation, this.autoRotate);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia la URL del modelo, recargamos
    if (changes['src'] && !changes['src'].firstChange && this.src) {
      this.threeEngine.loadModel(this.src, this.scale, this.rotation, this.autoRotate);
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
