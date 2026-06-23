import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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

  // Estados reactivos (Signals)
  filtroActivo = signal<string>('TODOS');
  camaraActiva = signal<boolean>(false);
  conectado = signal<boolean>(false);
  detecciones = signal<any[]>([]);
  totalDetecciones = signal<number>(0);
  errorConexion = signal<boolean>(false);
  cargando = signal<boolean>(false);

  // Configuración de URL del stream de FastAPI
  streamUrl = 'http://localhost:5000/stream';

  // Suscripción de polling
  private pollingSub: Subscription | null = null;

  ngOnInit() {
    // Verificar si el servidor FastAPI está corriendo al iniciar
    this.verificarConexion();
  }

  ngOnDestroy() {
    this.detenerPolling();
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
      // Iniciar la cámara por defecto si el backend responde
      this.iniciarCamara();
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
        }
      },
      error: (err) => {
        console.error('Error al cambiar el filtro', err);
      }
    });
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
