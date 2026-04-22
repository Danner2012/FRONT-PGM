import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-three-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `<div #rendererContainer style="width: 100%; height: 100%;"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    div { outline: none; }
  `]
})
export class ThreeViewerComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  @Input() src: string | null = null;
  @Input() scale: number = 1;
  @Input() rotation: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };
  @Input() autoRotate: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: THREE.Group | null = null;
  private animationId: number | null = null;

  ngOnInit(): void {
    this.initThree();
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && this.src) {
      this.loadModel(this.src);
    }
    if (changes['scale'] && this.model) {
      this.updateScale();
    }
    if (changes['rotation'] && this.model) {
      this.updateRotation();
    }
    if (changes['autoRotate'] && this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
  }

  private initThree(): void {
    const width = this.rendererContainer.nativeElement.clientWidth || 300;
    const height = this.rendererContainer.nativeElement.clientHeight || 300;

    // Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x212529); // Color oscuro para coincidir con tu UI

    // Cámara
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    // Renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Controles
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = this.autoRotate;

    // Resize listener
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private loadModel(url: string): void {
    if (this.model) {
      this.scene.remove(this.model);
    }

    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      this.model = gltf.scene;
      this.updateScale();
      this.updateRotation();
      
      // Centrar el modelo
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      this.model.position.sub(center);
      
      this.scene.add(this.model);

      // Ajustar cámara para ver el modelo
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      this.camera.position.z = maxDim * 2.5;
    }, undefined, (error) => {
      console.error('Error cargando el modelo 3D', error);
    });
  }

  private updateScale(): void {
    if (this.model) {
      this.model.scale.set(this.scale, this.scale, this.scale);
    }
  }

  private updateRotation(): void {
    if (this.model) {
      // Convertir grados a radianes
      this.model.rotation.set(
        THREE.MathUtils.degToRad(this.rotation.x),
        THREE.MathUtils.degToRad(this.rotation.y),
        THREE.MathUtils.degToRad(this.rotation.z)
      );
    }
  }

  private onWindowResize(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
