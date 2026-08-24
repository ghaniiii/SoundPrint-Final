import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { NgIf, NgFor, NgStyle, DecimalPipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import {
  AnalyzeTrackResponse,
  SimilarTrack
} from '../../models/recommendation-response.model';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [NgIf, NgFor, NgStyle, DecimalPipe],
  templateUrl: './analyzer.html',
  styleUrls: ['./analyzer.scss']
})
export class AnalyzerComponent implements OnDestroy {

  uploadedFile?: File;
  analysisResult?: AnalyzeTrackResponse;

  isAnalyzing = false;
  errorMessage = '';

  frequencyBins: number[] = [];
  placeholderHeights = Array.from({ length: 56 }, (_, i) => 18 + ((i * 17) % 62));

  /* ===========================
      GLOBAL AUDIO STATE
  =========================== */

  uploadPlayer = new Audio();
  trackPlayer = new Audio();

  isUploadPlaying = false;
  playingId?: string;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /* Selection / slicing state */
  @ViewChild('audioPlayer') audioPlayerRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('selectionBar') selectionBarRef?: ElementRef<HTMLDivElement>;

  audioBuffer?: AudioBuffer;
  durationSeconds = 0;

  // start (seconds) of selected window
  selectionStart = 0;
  // fixed window size in seconds (default 30)
  windowSize = 30;

  isSelectionPlaying = false;
  private dragging = false;
  private dragOffset = 0;
  private selectionBlobUrl?: string;
  private localFileUrl?: string;

  // computed end of selection (safe for template usage)
  get selectionEnd(): number {
    return Math.min(this.selectionStart + this.windowSize, this.durationSeconds);
  }

  /* ===========================
      FILE SELECT
  =========================== */

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    input.value = '';

    this.setFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      this.setFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setFile(file: File): void {

    this.errorMessage = '';
    this.analysisResult = undefined;
    this.frequencyBins = [];
    this.windowSize = 30;
    this.stopPlayback();

    if (this.localFileUrl) {
      try { URL.revokeObjectURL(this.localFileUrl); } catch {}
      this.localFileUrl = undefined;
    }

    // Basic client-side validation: accept only audio files we can process
    const allowedExt = ['mp3', 'wav', 'flac', 'ogg', 'm4a'];
    const name = (file.name || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() || '' : '';

    if (file.type && file.type.startsWith('audio/')) {
      // ok
    } else if (allowedExt.includes(ext)) {
      // ok by extension fallback
    } else {
      this.errorMessage = 'Please upload an audio file (mp3, wav, flac, ogg, m4a).';
      this.uploadedFile = undefined;
      return;
    }

    this.uploadedFile = file;
    this.localFileUrl = URL.createObjectURL(file);

    // Decode file to an AudioBuffer so user can select a window
    this.loadAudioBuffer(file);
  }

  private async loadAudioBuffer(file: File): Promise<void> {
    try {
      const ctx = new (window as any).AudioContext();
      const ab = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(ab.slice(0));
      if (!decoded) throw new Error('Failed to decode audio');

      this.audioBuffer = decoded;
      this.durationSeconds = decoded.duration || 0;

      // clamp selection start so window fits
      this.selectionStart = 0;
      if (this.windowSize > this.durationSeconds) {
        this.windowSize = Math.min(this.windowSize, Math.ceil(this.durationSeconds));
      }

      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to decode audio buffer', e);
      this.errorMessage = 'Failed to read audio file.';
    }
  }

  /* ===========================
      UPLOAD PLAY TOGGLE
  =========================== */

  toggleUpload(): void {
    if (!this.uploadedFile) return;

    this.trackPlayer.pause();
    this.playingId = undefined;
    this.pauseSelection();

    if (this.isUploadPlaying) {
      this.uploadPlayer.pause();
      this.isUploadPlaying = false;
      return;
    }

    const url = this.localFileUrl || this.analysisResult?.track?.previewUrl;
    if (!url) return;

    this.uploadPlayer.src = url;
    this.uploadPlayer.load();
    void this.uploadPlayer.play();

    this.isUploadPlaying = true;

    this.uploadPlayer.onended = () => {
      this.isUploadPlaying = false;
      this.cdr.detectChanges();
    };
  }

  /* ===========================
      SELECTION PLAYBACK / UPLOAD
  =========================== */

  toggleSelectionPlay(): void {
    if (!this.audioBuffer || !this.audioPlayerRef) return;

    const el = this.audioPlayerRef.nativeElement;

    if (this.isSelectionPlaying) {
      el.pause();
      this.isSelectionPlaying = false;
      return;
    }

    this.uploadPlayer.pause();
    this.isUploadPlaying = false;
    this.trackPlayer.pause();
    this.playingId = undefined;

    const start = this.selectionStart;
    const end = Math.min(this.selectionStart + this.windowSize, this.durationSeconds);

    const blob = this.encodeSelectionToWav(start, end);
    if (!blob) return;

    // revoke previous URL if any
    if (this.selectionBlobUrl) {
      try { URL.revokeObjectURL(this.selectionBlobUrl); } catch {}
      this.selectionBlobUrl = undefined;
    }

    this.selectionBlobUrl = URL.createObjectURL(blob);
    el.src = this.selectionBlobUrl;
    el.currentTime = 0;
    el.play();
    this.isSelectionPlaying = true;

    el.onended = () => {
      this.isSelectionPlaying = false;
      if (this.selectionBlobUrl) {
        try { URL.revokeObjectURL(this.selectionBlobUrl); } catch {}
        this.selectionBlobUrl = undefined;
      }
    };
  }

  confirmAndAnalyzeSelection(): void {
    if (!this.audioBuffer || !this.uploadedFile || this.isAnalyzing) return;

    const start = this.selectionStart;
    const end = Math.min(this.selectionStart + this.windowSize, this.durationSeconds);
    const blob = this.encodeSelectionToWav(start, end);
    if (!blob) return;

    const filename = this.uploadedFile.name.replace(/\.[^.]+$/, '') + `_sel_${Math.floor(start)}-${Math.floor(end)}.wav`;
    const file = new File([blob], filename, { type: 'audio/wav' });

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.api.analyzeTrack(file, this.uploadedFile).subscribe({
      next: (res) => {
        this.analysisResult = res;
        this.frequencyBins = [...(res.frequencyProfile?.bins || [])];
        this.isAnalyzing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.error || err?.error?.message || 'Analysis failed';
        this.isAnalyzing = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Encode the selected range to a WAV Blob (16-bit PCM)
  private encodeSelectionToWav(startSec: number, endSec: number): Blob | null {
    if (!this.audioBuffer) return null;

    const sr = this.audioBuffer.sampleRate;
    const start = Math.floor(startSec * sr);
    const end = Math.floor(endSec * sr);
    const length = end - start;
    if (length <= 0) return null;

    const numChannels = this.audioBuffer.numberOfChannels;
    const newBuf = new Float32Array(length * numChannels);

    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = this.audioBuffer.getChannelData(ch).subarray(start, end);
      for (let i = 0; i < length; i++) {
        newBuf[i * numChannels + ch] = channelData[i];
      }
    }

    // Interleaved float32 -> 16-bit PCM
    const wavBuffer = this.floatToWav(newBuf, numChannels, sr);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private floatToWav(interleaved: Float32Array, numChannels: number, sampleRate: number): ArrayBuffer {
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */ writeString(view, 0, 'RIFF');
    /* file length */ view.setUint32(4, 36 + interleaved.length * 2, true);
    /* RIFF type */ writeString(view, 8, 'WAVE');
    /* format chunk identifier */ writeString(view, 12, 'fmt ');
    /* format chunk length */ view.setUint32(16, 16, true);
    /* sample format (raw) */ view.setUint16(20, 1, true);
    /* channel count */ view.setUint16(22, numChannels, true);
    /* sample rate */ view.setUint32(24, sampleRate, true);
    /* byte rate (sampleRate * blockAlign) */ view.setUint32(28, sampleRate * blockAlign, true);
    /* block align (channel count * bytes/samples) */ view.setUint16(32, blockAlign, true);
    /* bits per sample */ view.setUint16(34, 16, true);
    /* data chunk identifier */ writeString(view, 36, 'data');
    /* data chunk length */ view.setUint32(40, interleaved.length * 2, true);

    // write PCM samples
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;

    function writeString(view: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }
  }

  /* Simple click-and-drag on the selection overlay */
  startDrag(event: MouseEvent): void {
    if (!this.selectionBarRef) return;
    this.dragging = true;
    const overlay = event.currentTarget as HTMLElement;
    this.dragOffset = event.clientX - overlay.getBoundingClientRect().left;
    event.preventDefault();
  }

  onBarPointerDown(event: MouseEvent): void {
    if (!this.selectionBarRef || !this.audioBuffer) return;
    const rect = this.selectionBarRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const sec = pct * this.durationSeconds;
    // center selection around click
    const half = this.windowSize / 2;
    this.selectionStart = Math.max(0, Math.min(this.durationSeconds - this.windowSize, sec - half));
    this.cdr.detectChanges();
  }

  onBarPointerMove(event: MouseEvent): void {
    if (!this.dragging || !this.selectionBarRef || !this.audioBuffer) return;
    const rect = this.selectionBarRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left - this.dragOffset;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const sec = pct * this.durationSeconds;
    this.selectionStart = Math.max(0, Math.min(this.durationSeconds - this.windowSize, sec));
    this.cdr.detectChanges();
  }

  endDrag(): void {
    this.dragging = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMove(event: MouseEvent): void {
    this.onBarPointerMove(event);
  }

  @HostListener('document:mouseup')
  onDocUp(): void {
    this.endDrag();
  }

  ngOnDestroy(): void {
    try {
      this.stopPlayback();
      if (this.selectionBlobUrl) {
        URL.revokeObjectURL(this.selectionBlobUrl);
        this.selectionBlobUrl = undefined;
      }
      if (this.localFileUrl) {
        URL.revokeObjectURL(this.localFileUrl);
        this.localFileUrl = undefined;
      }
    } catch (e) {
      // ignore
    }
  }

  /* ===========================
      RECOMMENDED TRACK PLAY
  =========================== */

  toggleTrack(track: SimilarTrack): void {

    if (!track.previewUrl) return;

    /** stop upload audio */
    this.uploadPlayer.pause();
    this.isUploadPlaying = false;
    this.pauseSelection();

    if (this.playingId === track.id) {
      this.trackPlayer.pause();
      this.playingId = undefined;
      return;
    }

    this.trackPlayer.src = track.previewUrl;
    this.trackPlayer.load();
    this.trackPlayer.play();

    this.playingId = track.id;

    this.trackPlayer.onended = () => {
      this.playingId = undefined;
    };
  }

  /* ===========================
      API CALL
  =========================== */

  private analyze(): void {

    if (!this.uploadedFile) return;

    this.isAnalyzing = true;
    this.errorMessage = '';

    this.api.analyzeTrack(this.uploadedFile).subscribe({

      next: (res) => {

        this.analysisResult = res;
        this.frequencyBins =
          [...(res.frequencyProfile?.bins || [])];

        this.isAnalyzing = false;
        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          err?.error?.error ||
          err?.error?.message ||
          'Analysis failed';

        this.isAnalyzing = false;
      }
    });
  }

  /* ===========================
      HELPERS
  =========================== */

  private pauseSelection(): void {
    if (this.audioPlayerRef) {
      this.audioPlayerRef.nativeElement.pause();
    }
    this.isSelectionPlaying = false;
  }

  private stopPlayback(): void {
    this.uploadPlayer.pause();
    this.isUploadPlaying = false;
    this.trackPlayer.pause();
    this.playingId = undefined;
    this.pauseSelection();
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDuration(seconds?: number): string {
    if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '';

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  trackById(_: number, item: SimilarTrack): string {
    return item.id ?? '';
  }

  canPlay(track: SimilarTrack): boolean {
    return !!track.previewUrl;
  }
}