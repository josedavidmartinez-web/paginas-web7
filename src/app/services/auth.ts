import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

export interface RegistroApiPayload {
  email: string;
  username: string;
  password?: string;
  passwordHash?: string;
  firstname: string;
  lastname: string;
  phone: string;
}

export interface UsuarioPerfil {
  id: number | string;
  email: string;
  username: string;
  phone: string;
  name: {
    firstname: string;
    lastname: string;
  };
  address?: {
    city?: string;
    street?: string;
    number?: number;
    zipcode?: string;
  };
}

interface FakeStoreUserRequest {
  email: string;
  username: string;
  password: string;
  name: {
    firstname: string;
    lastname: string;
  };
  address: {
    city: string;
    street: string;
    number: number;
    zipcode: string;
    geolocation: {
      lat: string;
      long: string;
    };
  };
  phone: string;
}

interface FakeStoreUserResponse extends FakeStoreUserRequest {
  id: number;
}

interface LoginResponse {
  token: string;
}

interface TokenPayload {
  user?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = 'https://fakestoreapi.com/auth/login';
  private readonly usersUrl = 'https://fakestoreapi.com/users';
  private readonly storageKey = 'fakestore_token';
  private readonly usuariosLocalesKey = 'araucaria_usuarios_api';
  private readonly usuarioActualKey = 'fakestore_username';

  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(this.storageKey)
  );

  private readonly usernameGuardadoSignal = signal<string | null>(
    localStorage.getItem(this.usuarioActualKey)
  );

  readonly username = computed(() => {
    const guardado = this.usernameGuardadoSignal();
    if (guardado) {
      return guardado;
    }

    const token = this.tokenSignal();
    return token ? this.readUsername(token) : null;
  });

  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  readonly role = computed<'admin' | 'paciente' | null>(() => {
    const user = this.username()?.trim().toLowerCase();
    if (!user) return null;
    if (user === 'admin' || user === 'mor_2314') {
      return 'admin';
    }
    return 'paciente';
  });

  readonly isAdmin = computed(() => this.role() === 'admin');

  obtenerPerfilUsuario(): Observable<UsuarioPerfil | null> {
    const actual = this.username()?.trim().toLowerCase();
    if (!actual) {
      return of(null);
    }

    const local = this.obtenerUsuariosLocales().find(
      (u) => u.username.toLowerCase() === actual
    );

    if (local) {
      return of({
        id: local.username,
        email: local.email,
        username: local.username,
        phone: local.phone,
        name: {
          firstname: local.firstname,
          lastname: local.lastname,
        },
        address: {
          city: 'Córdoba',
          street: 'Av. 5',
          number: 607,
          zipcode: '94500',
        },
      });
    }

    return this.http.get<UsuarioPerfil[]>(this.usersUrl).pipe(
      map(
        (usuarios) =>
          usuarios.find((u) => u.username.toLowerCase() === actual) ?? null
      ),
      catchError(() => of(null))
    );
  }

  registrarUsuarioApi(datos: RegistroApiPayload): Observable<FakeStoreUserResponse> {
    const usernameNormalizado = datos.username.trim();
    const emailNormalizado = datos.email.trim().toLowerCase();
    const passwordPlano = datos.password ?? '';
    const usuariosGuardados = this.obtenerUsuariosLocales();

    const usuarioDuplicado = usuariosGuardados.some(
      (u) => u.username.toLowerCase() === usernameNormalizado.toLowerCase()
    );

    if (usuarioDuplicado) {
      return throwError(
        () => new Error('Ese nombre de usuario ya está registrado.')
      );
    }

    const correoDuplicado = usuariosGuardados.some(
      (u) => u.email.trim().toLowerCase() === emailNormalizado
    );

    if (correoDuplicado) {
      return throwError(
        () => new Error('Ese correo electrónico ya está registrado.')
      );
    }

    const body: FakeStoreUserRequest = {
      email: datos.email.trim(),
      username: usernameNormalizado,
      password: passwordPlano,
      name: {
        firstname: datos.firstname.trim(),
        lastname: datos.lastname.trim(),
      },
      address: {
        city: 'Córdoba',
        street: 'Av. 5',
        number: 607,
        zipcode: '94500',
        geolocation: {
          lat: '18.8954',
          long: '-96.9384',
        },
      },
      phone: datos.phone.trim(),
    };

    return from(this.hashPassword(passwordPlano)).pipe(
      switchMap((passwordHash) =>
        this.http.post<FakeStoreUserResponse>(this.usersUrl, body).pipe(
          tap(() => {
            const nuevoRegistro: RegistroApiPayload = {
              email: datos.email.trim(),
              username: usernameNormalizado,
              passwordHash,
              firstname: datos.firstname.trim(),
              lastname: datos.lastname.trim(),
              phone: datos.phone.trim(),
            };
            const actualizados = [...usuariosGuardados, nuevoRegistro];
            localStorage.setItem(this.usuariosLocalesKey, JSON.stringify(actualizados));
          })
        )
      )
    );
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const userTrimmed = username.trim();
    const usuarioLocal = this.obtenerUsuariosLocales().find(
      (u) => u.username.toLowerCase() === userTrimmed.toLowerCase()
    );

    if (usuarioLocal) {
      return from(this.hashPassword(password)).pipe(
        switchMap((hashIngresado) => {
          const coincideHash =
            !!usuarioLocal.passwordHash && usuarioLocal.passwordHash === hashIngresado;
          const coincidePlano =
            !!usuarioLocal.password && usuarioLocal.password === password;

          if (!coincideHash && !coincidePlano) {
            return throwError(() => new Error('Usuario o contraseña incorrectos.'));
          }

          const tokenSimulado = `api-user-${btoa(usuarioLocal.username)}-${Date.now()}`;
          return of({ token: tokenSimulado }).pipe(
            tap((response) => {
              localStorage.setItem(this.storageKey, response.token);
              localStorage.setItem(this.usuarioActualKey, usuarioLocal.username);
              this.tokenSignal.set(response.token);
              this.usernameGuardadoSignal.set(usuarioLocal.username);
            })
          );
        })
      );
    }

    return this.http
      .post<LoginResponse>(this.loginUrl, { username: userTrimmed, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.storageKey, response.token);
          localStorage.setItem(this.usuarioActualKey, userTrimmed);
          this.tokenSignal.set(response.token);
          this.usernameGuardadoSignal.set(userTrimmed);
        })
      );
  }

  logouth(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.usuarioActualKey);
    this.tokenSignal.set(null);
    this.usernameGuardadoSignal.set(null);
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private obtenerUsuariosLocales(): RegistroApiPayload[] {
    try {
      const raw = localStorage.getItem(this.usuariosLocalesKey);
      return raw ? (JSON.parse(raw) as RegistroApiPayload[]) : [];
    } catch {
      return [];
    }
  }

  private readUsername(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '='
      );

      const data = JSON.parse(atob(padded)) as TokenPayload;
      return data.user ?? null;
    } catch {
      return null;
    }
  }
}