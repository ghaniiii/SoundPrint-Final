import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyzeTrackResponse } from '../models/recommendation-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiBaseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

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