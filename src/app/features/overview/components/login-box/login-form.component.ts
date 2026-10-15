import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type AfterViewInit,
} from '@angular/core';
import { IonSpinner } from '@ionic/angular';

import { AuthService } from '../../../../core';
import { GoogleAuthService } from '../../data-access';

@Component({
  selector: 'app-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSpinner],
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .login-action {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 72px;
      width: 100%;
      padding: 12px 0;
      position: relative;
    }

    .google-login {
      width: min(100%, 300px);
    }

    .google-login--initializing {
      visibility: hidden;
    }

    #web-google-button {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .google-spinner {
      position: absolute;
    }

    .native-google-button {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      width: 100%;
      height: 44px;
      gap: 12px;
      padding: 0 16px;

      background: #fff;
      border: 1px solid #747775;
      border-radius: 4px;

      color: #1f1f1f;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      letter-spacing: 0.25px;

      -webkit-tap-highlight-color: transparent;

      transition:
        background-color 120ms ease,
        border-color 120ms ease,
        box-shadow 120ms ease,
        transform 80ms ease;
    }

    .native-google-button:hover {
      background: #f8faff;
      box-shadow: 0 1px 2px rgb(60 64 67 / 20%);
    }

    .native-google-button:active {
      background: #f1f3f4;
      transform: scale(0.99);
    }

    .native-google-button:focus-visible {
      outline: 2px solid var(--ion-color-primary);
      outline-offset: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .native-google-button {
        background: #000;
        border-color: #5f6368;
        color: #fff;
      }

      .native-google-button:hover {
        background: #0f0f0f;
        border-color: #747775;
        box-shadow: none;
      }

      .native-google-button:active {
        background: #171717;
      }
    }

    .google-logo {
      width: 18px;
      height: 18px;
      flex: 0 0 18px;
    }

    ion-spinner {
      width: 24px;
      height: 24px;
    }

    .login-error {
      margin: 4px 0 0;
      color: var(--ion-color-danger);
      font-size: 0.875rem;
      text-align: center;
    }
  `,
  template: `
    <div class="login-action">
      @if (isLoading()) {
        <ion-spinner name="crescent" />
      } @else if (isNativeIos) {
        @if (isGoogleInitializing()) {
          <ion-spinner name="crescent" />
        } @else if (isGoogleReady()) {
          <div class="google-login">
            <button class="native-google-button" type="button" (click)="loginWithGoogle()">
              <svg
                class="google-logo"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.877 2.684-6.613"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.468-.806 5.956-2.182l-2.909-2.258c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18"
                />
                <path
                  fill="#FBBC05"
                  d="M3.963 10.705A5.4 5.4 0 0 1 3.682 9c0-.592.102-1.167.281-1.705V4.963H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.037z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.507.454 3.442 1.345l2.581-2.581C13.464.891 11.426 0 9 0A9 9 0 0 0 .956 4.963l3.007 2.332C4.672 5.166 6.656 3.58 9 3.58"
                />
              </svg>

              <span>Mit Google anmelden</span>
            </button>
          </div>
        }
      } @else {
        <div class="google-login" [class.google-login--initializing]="isGoogleInitializing()">
          <div id="web-google-button"></div>
        </div>

        @if (isGoogleInitializing()) {
          <ion-spinner class="google-spinner" name="crescent" />
        }
      }
    </div>

    @if (!isGoogleInitializing() && !isGoogleReady()) {
      <p class="login-error">Google Login konnte nicht geladen werden.</p>
    }
  `,
})
export class LoginFormComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly googleAuthService = inject(GoogleAuthService);

  readonly isLoading = this.authService.isLoading;
  readonly isNativeIos = this.googleAuthService.isNativeIos;

  readonly isGoogleReady = signal(false);
  readonly isGoogleInitializing = signal(true);

  ngAfterViewInit(): void {
    void this.initializeGoogleAuth();
  }

  private async initializeGoogleAuth(): Promise<void> {
    try {
      await this.googleAuthService.initialize();
      this.isGoogleReady.set(true);
    } catch (error) {
      console.error('Google Auth konnte nicht initialisiert werden:', error);
      this.isGoogleReady.set(false);
    } finally {
      this.isGoogleInitializing.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    if (!this.isGoogleReady()) {
      return;
    }

    await this.googleAuthService.login();
  }
}
