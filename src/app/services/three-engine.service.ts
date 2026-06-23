import { Injectable, NgZone, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Injectable({
  providedIn: 'root'
})
export class ThreeEngineService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: THREE.Group | null = null;
  private animationId: number | null = null;
  private container!: HTMLElement;
  
  // Loader de Draco compartido
  private dracoLoader = new DRACOLoader();

  constructor(private ngZone: NgZone) {
    // Configurar el decodificador de Draco desde una CDN confiable (Google)
    // Esto evita tener que servir los archivos de decodificación localmente
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.dracoLoader.setDecoderConfig({ type: 'js' }); // Usar JS para máxima compatibilidad
  }

  public initEngine(container: HTMLElement): void {
    this.container = container;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    this.scene = new THREE.Scene();
    
    // Fondo con gradiente profundo
    this.scene.background = new THREE.Color(0x0a0e14);
    this.scene.fog = new THREE.Fog(0x0a0e14, 20, 100);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Limpiar contenedor
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupEnvironment();
    this.setupControls();
    
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupEnvironment(): void {
    // Rejilla tecnológica (Digital Grid)
    const size = 100;
    const divisions = 50;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x3182ce, 0x1a202c);
    gridHelper.position.y = -2; // Ligeramente abajo del modelo
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Luces de acento para el ambiente
    const blueLight = new THREE.PointLight(0x3182ce, 2, 50);
    blueLight.position.set(-10, 5, -10);
    this.scene.add(blueLight);
  }

  private setupLights(): void {
    // Iluminación de estudio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 10, 7.5);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x3182ce, 0.6);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0xffffff, 1);
    rimLight.position.set(0, 15, 0);
    this.scene.add(rimLight);
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotateSpeed = 2.0;
  }

  public loadModel(url: string, scale: number, rotation: {x: number, y: number, z: number}, autoRotate: boolean): void {
    if (this.model) {
      this.scene.remove(this.model);
      this.disposeObject(this.model);
    }

    const loader = new GLTFLoader();
    loader.setDRACOLoader(this.dracoLoader); // Vincular el decodificador
    loader.load(url, (gltf) => {
      this.model = gltf.scene;
      
      this.updateModelTransform(scale, rotation);
      this.controls.autoRotate = autoRotate;
      
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      this.model.position.sub(center);
      this.scene.add(this.model);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.3;
      
      this.camera.position.set(0, maxDim * 0.2, cameraZ);
      this.camera.lookAt(0, 0, 0);
      
      this.controls.minDistance = maxDim * 0.5;
      this.controls.maxDistance = cameraZ * 3;
      this.controls.target.set(0, 0, 0);
      this.controls.update();

    }, undefined, (error) => {
      console.error('Error cargando el modelo 3D en el servicio', error);
    });
  }

  public updateModelTransform(scale: number, rotation: {x: number, y: number, z: number}): void {
    if (this.model) {
      this.model.scale.set(scale, scale, scale);
      this.model.rotation.set(
        THREE.MathUtils.degToRad(rotation.x),
        THREE.MathUtils.degToRad(rotation.y),
        THREE.MathUtils.degToRad(rotation.z)
      );
    }
  }

  public setAutoRotate(enabled: boolean): void {
    if (this.controls) {
      this.controls.autoRotate = enabled;
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (this.controls) {
      this.controls.update();
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onWindowResize(): void {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.onWindowResize);

    if (this.model) {
      this.disposeObject(this.model);
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }

  private disposeObject(obj: any): void {
    obj.traverse((child: any) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
}
