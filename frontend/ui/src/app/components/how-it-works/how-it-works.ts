import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

interface HowStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [NgFor],
  templateUrl: './how-it-works.html',
  styleUrls: ['./how-it-works.scss']
})
export class HowItWorksComponent {
  steps: HowStep[] = [
    {
      number: 1,
      title: 'Upload Music',
      description: 'Submit your audio file in any standard format.',
      icon: '⬆'
    },
    {
      number: 2,
      title: 'Frequency Analysis',
      description: 'DSP algorithms extract unique frequency patterns using Fourier transforms.',
      icon: '📡'
    },
    {
      number: 3,
      title: 'Pattern Matching',
      description: 'Compare against a database of frequency profiles.',
      icon: '🗄'
    },
    {
      number: 4,
      title: 'Get Recommendations',
      description: 'Receive similar-sounding tracks regardless of genre or artist.',
      icon: '🎵'
    }
  ];
}
