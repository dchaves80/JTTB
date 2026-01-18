import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.hasToken()) {
      this.router.navigate(['/terminal']);
    }
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error = 'Usuario y contraseña requeridos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/terminal']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Error de autenticación';
      }
    });
  }
}
