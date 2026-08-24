import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [NgFor],
  templateUrl: './features.html',
  styleUrls: ['./features.scss']
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      title: 'DSP-Powered Analysis',
      description: 'Advanced Fourier transforms extract detailed frequency patterns from audio signals.',
      icon: '🌊'
    },
    {
      title: 'Cross-Cultural Discovery',
      description: 'Find similar music across languages and regions based on sound, not metadata.',
      icon: '🌍'
    },
    {
      title: 'Beyond Metadata',
      description: 'Works with mislabeled or untagged tracks by analyzing pure audio fingerprints.',
      icon: '🔎'
    },
    {
      title: 'Fast Matching',
      description: 'Efficient similarity algorithms provide instant recommendations.',
      icon: '⚡'
    },
    {
      title: 'Reliable Results',
      description: 'Frequency-based matching ensures consistent, unbiased recommendations.',
      icon: '🛡'
    },
    {
      title: 'Scalable Architecture',
      description: 'Modular design ready for ML enhancements and future expansions.',
      icon: '⚙'
    }
  ];
}
