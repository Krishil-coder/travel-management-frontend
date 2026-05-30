import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (showAppChrome()) {
      <app-navbar></app-navbar>
    }
    <main class="app-page" [class.auth-app-page]="!showAppChrome()">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly showAppChrome = computed(() => {
    const cleanUrl = this.currentUrl().split('?')[0].split('#')[0];

    return this.authService.isLoggedIn() && cleanUrl !== '/login';
  });
}
