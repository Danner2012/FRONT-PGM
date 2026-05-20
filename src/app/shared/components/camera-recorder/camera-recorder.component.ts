import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCaptureService } from '../../../services/media-capture.service';

@Component({
  selector: 'app-camera-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera-recorder.component.html',
  styleUrls: ['./camera-recorder.component.css']
})
export class CameraRecorderComponent implements OnInit, OnDestroy {
  private mediaService = inject(MediaCaptureService);

  @Output() onCapture = new EventEmitter<File>();
  @ViewChild('videoFeed') videoElement!: ElementRef<HTMLVideoElement>;

  availableCameras = signal<MediaDeviceInfo[]>([]);
  selectedCameraId = signal<string>('');
  cameraActive = signal(false);
  isRecording = signal(false);
  recordingTime = signal(0);
  private timerInterval: any;

  ngOnInit() {
    this.loadCameras();
  }

  async loadCameras() {
    const devices = await this.mediaService.getAvailableCameras();
    this.availableCameras.set(devices);
    if (devices.length > 0) {
      this.selectedCameraId.set(devices[0].deviceId);
    }
  }

  async toggleCamera() {
    if (this.cameraActive()) {
      this.stopCamera();
    } else {
      try {
        const stream = await this.mediaService.startStream(this.selectedCameraId());
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
          this.cameraActive.set(true);
        }
      } catch (err) {
        console.error('Error starting camera:', err);
      }
    }
  }

  stopCamera() {
    this.mediaService.stopStream();
    this.cameraActive.set(false);
    if (this.isRecording()) this.stopRecording();
  }

  onCameraChange(event: any) {
    const deviceId = event.target.value;
    this.selectedCameraId.set(deviceId);
    if (this.cameraActive()) {
      this.toggleCamera(); // Restart with new device
      this.toggleCamera();
    }
  }

  takeSnapshot() {
    if (!this.cameraActive() || !this.videoElement) return;
    const file = this.mediaService.takeSnapshot(this.videoElement.nativeElement);
    this.onCapture.emit(file);
  }

  startRecording() {
    if (!this.cameraActive()) return;
    const stream = this.videoElement.nativeElement.srcObject as MediaStream;
    this.mediaService.startRecording(stream);
    this.isRecording.set(true);
    this.startTimer();
  }

  async stopRecording() {
    if (!this.isRecording()) return;
    const file = await this.mediaService.stopRecording();
    this.onCapture.emit(file);
    this.isRecording.set(false);
    this.stopTimer();
  }

  private startTimer() {
    this.recordingTime.set(0);
    this.timerInterval = setInterval(() => {
      this.recordingTime.update(t => t + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopTimer();
  }
}
