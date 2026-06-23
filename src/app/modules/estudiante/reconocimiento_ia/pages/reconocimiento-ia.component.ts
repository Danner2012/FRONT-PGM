import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IaService } from '../../../../services/ia.service';
import { Subscription, interval } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-reconocimiento-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reconocimiento-ia.component.html',
  styleUrls: ['../styles/reconocimiento-ia.component.css']
})
export class ReconocimientoIaComponent implements OnInit, OnDestroy {
  private iaService = inject(IaService);

  @ViewChild('streamContainer') streamContainer!: ElementRef<HTMLDivElement>;

  // Estados reactivos (Signals)
  filtroActivo = signal<string>('TODOS');
  camaraActiva = signal<boolean>(false);
  conectado = signal<boolean>(false);
  detecciones = signal<any[]>([]);
  totalDetecciones = signal<number>(0);
  errorConexion = signal<boolean>(false);
  cargando = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);

  // Estados para Ficha Técnica (Afiche)
  aficheCargado = signal<any | null>(null);
  todosLosAfiches = signal<any[]>([]);
  cargandoAfiche = signal<boolean>(false);
  tabActiva = signal<string>('general'); // general, medicion, reparacion, herramientas
  mostrarModalImagen = signal<boolean>(false);
  imagenSeleccionadaUrl = signal<string>('');
  vistaPanelDerecho = signal<string>('detecciones'); // detecciones, ficha

  // Índices de carrusel para pasos
  carruselMedicionIdx = signal<number>(0);
  carruselProcedimientoIdx = signal<number>(0);

  // Configuración de URL del stream de FastAPI
  streamUrl = 'http://localhost:5000/stream';

  // Suscripción de polling
  private pollingSub: Subscription | null = null;

  ngOnInit() {
    // Verificar si el servidor FastAPI está corriendo al iniciar
    this.verificarConexion();
    this.cargarTodosLosAfiches();
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  ngOnDestroy() {
    this.detenerPolling();
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  onFullscreenChange = () => {
    this.isFullscreen.set(!!document.fullscreenElement);
  };

  toggleFullscreen() {
    if (!this.streamContainer) return;
    const element = this.streamContainer.nativeElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error al activar pantalla completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  verificarConexion() {
    this.cargando.set(true);
    this.iaService.getEstado().pipe(
      catchError(err => {
        this.conectado.set(false);
        this.errorConexion.set(true);
        this.cargando.set(false);
        throw err;
      })
    ).subscribe(res => {
      this.conectado.set(true);
      this.errorConexion.set(false);
      this.filtroActivo.set(res.filtro || 'TODOS');
      this.cargando.set(false);
      // Cargar afiche si el filtro inicial no es TODOS
      if (res.filtro && res.filtro !== 'TODOS') {
        this.cargarAficheComponente(res.filtro);
      } else {
        this.aficheCargado.set(null);
      }
      // Iniciar la cámara por defecto si el backend responde
      this.iniciarCamara();
    });
  }

  cargarTodosLosAfiches() {
    this.iaService.getAfiches().subscribe({
      next: (data) => {
        this.todosLosAfiches.set(data || []);
      },
      error: (err) => {
        console.error('Error al cargar todos los afiches:', err);
      }
    });
  }

  iniciarCamara() {
    this.camaraActiva.set(true);
    this.iniciarPolling();
  }

  detenerCamara() {
    this.camaraActiva.set(false);
    this.detenerPolling();
    this.detecciones.set([]);
    this.totalDetecciones.set(0);
  }

  iniciarPolling() {
    this.detenerPolling(); // Evitar suscripciones duplicadas
    
    // Consultar detecciones y estado cada 500ms
    this.pollingSub = interval(500).pipe(
      switchMap(() => this.iaService.getDetecciones().pipe(
        catchError(err => {
          this.conectado.set(false);
          this.errorConexion.set(true);
          this.detenerCamara();
          throw err;
        })
      ))
    ).subscribe((res: any) => {
      this.conectado.set(true);
      this.errorConexion.set(false);
      this.detecciones.set(res.detecciones || []);
      this.totalDetecciones.set((res.detecciones || []).length);
    });
  }

  detenerPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  cambiarFiltro(filtro: string) {
    if (!this.conectado()) return;
    
    this.iaService.setFiltro(filtro).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.filtroActivo.set(filtro);
          if (filtro === 'TODOS') {
            this.aficheCargado.set(null);
          } else {
            this.cargarAficheComponente(filtro);
          }
        }
      },
      error: (err) => {
        console.error('Error al cambiar el filtro', err);
      }
    });
  }

  // --- MÉTODOS DE FICHA TÉCNICA (AFICHE) ---
  
  cargarAficheComponente(clase: string) {
    if (!clase || clase === 'TODOS') {
      this.aficheCargado.set(null);
      this.vistaPanelDerecho.set('detecciones');
      return;
    }
    this.cargandoAfiche.set(true);
    this.iaService.getAfichePorClase(clase).subscribe({
      next: (data) => {
        this.aficheCargado.set(data);
        this.cargandoAfiche.set(false);
        // Resetear carruseles al cambiar de componente
        this.carruselMedicionIdx.set(0);
        this.carruselProcedimientoIdx.set(0);
        this.tabActiva.set('general');
        this.vistaPanelDerecho.set('ficha');
      },
      error: (err) => {
        console.error('Error al cargar afiche para la clase:', clase, err);
        this.aficheCargado.set(null);
        this.cargandoAfiche.set(false);
      }
    });
  }

  // --- NAVEGACIÓN DE CARRUSELES ---
  prevMedicion() {
    const total = this.aficheCargado()?.pasos_medicion?.length || 0;
    if (total === 0) return;
    this.carruselMedicionIdx.update(i => (i - 1 + total) % total);
  }

  nextMedicion() {
    const total = this.aficheCargado()?.pasos_medicion?.length || 0;
    if (total === 0) return;
    this.carruselMedicionIdx.update(i => (i + 1) % total);
  }

  prevProcedimiento() {
    const total = this.aficheCargado()?.pasos_procedimiento?.length || 0;
    if (total === 0) return;
    this.carruselProcedimientoIdx.update(i => (i - 1 + total) % total);
  }

  nextProcedimiento() {
    const total = this.aficheCargado()?.pasos_procedimiento?.length || 0;
    if (total === 0) return;
    this.carruselProcedimientoIdx.update(i => (i + 1) % total);
  }

  verFichaDesdeDeteccion(clase: string) {
    this.cargarAficheComponente(clase);
  }

  regresarAListado() {
    this.aficheCargado.set(null);
  }

  abrirModalImagen(url: string) {
    if (!url) return;
    this.imagenSeleccionadaUrl.set(url);
    this.mostrarModalImagen.set(true);
  }

  cerrarModalImagen() {
    this.mostrarModalImagen.set(false);
    this.imagenSeleccionadaUrl.set('');
  }

  // Helper para obtener color asociado a cada clase
  getColorClase(clase: string): string {
    switch (clase.toUpperCase()) {
      case 'FPC':
        return '#ff6400'; // Naranja
      case 'CAPACITOR':
        return '#00a5ff'; // Azul
      case 'BOBINA':
        return '#ff0000'; // Rojo
      default:
        return '#00ffff'; // Cian para otras clases
    }
  }

  // Helper para traducir clases a etiquetas más legibles si se desea
  getNombreClase(clase: string): string {
    return clase.toUpperCase();
  }
}
