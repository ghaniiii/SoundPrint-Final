import { Component, HostListener, OnInit } from '@angular/core';
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
  activeSection = 'home';

  navItems = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How it Works' },
    { id: 'analyze', label: 'Analyze' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' }
  ];

  ngOnInit(): void {
    try {
      const t = localStorage.getItem('theme');
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
    this.updateActiveSection();
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

  scrollTo(id: string, event?: Event): void {
    event?.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection = id;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateActiveSection();
  }

  private updateActiveSection(): void {
    const offset = 110;
    let current = this.navItems[0].id;
    for (const item of this.navItems) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top - offset <= 0) {
        current = item.id;
      }
    }
    this.activeSection = current;
  }
}
