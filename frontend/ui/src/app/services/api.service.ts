import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyzeTrackResponse } from '../models/recommendation-response.model';
import { API_BASE_URL } from '../tokens/api-base-url.token';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {}

  analyzeTrack(clip: File, original?: File): Observable<AnalyzeTrackResponse> {
    const formData = new FormData();
    formData.append('file', clip);
    if (original) {
      formData.append('original', original);
    }
    return this.http.post<AnalyzeTrackResponse>(
      `${this.apiBaseUrl}/recommend`,
      formData
    );
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/health`);
  }

  getDatabaseInfo(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/database/info`);
  }
}