import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './components/hero/hero';
import { HowItWorksComponent } from './components/how-it-works/how-it-works';
import { AnalyzerComponent } from './components/analyzer/analyzer';
import { FeaturesComponent } from './components/features/features';
import { AppFooterComponent } from './components/app-footer/app-footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    HowItWorksComponent,
    AnalyzerComponent,
    FeaturesComponent,
    AppFooterComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  isDark = true;

  ngOnInit(): void {
    try {
      const t = localStorage.getItem('theme');
      // Default to dark unless user explicitly chose light
      if (t === 'light') {
        this.isDark = false;
        document.body.classList.remove('dark');
      } else {
        this.isDark = true;
        document.body.classList.add('dark');
      }
    } catch (e) {
      this.isDark = true;
      document.body.classList.add('dark');
    }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
  }
}
