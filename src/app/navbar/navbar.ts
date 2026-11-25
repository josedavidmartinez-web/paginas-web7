import { Component, inject} from '@angular/core';
import { RouterLink, RouterLinkActive, Router} from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  protected auth = inject(Auth);
  private router = inject(Router);
 
  salir(): void {
    this.auth.logouth();
    this.router.navigateByUrl('/login');
  }
}
