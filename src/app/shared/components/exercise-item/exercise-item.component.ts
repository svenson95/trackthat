import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { IonLabel } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';

const ION_COMPONENTS = [IonLabel];

@Component({
  selector: 'app-exercise-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, TranslateModule],
  styles: `
    :host {
      display: flex;
      align-items: center;
    }
    .exercise-image {
      margin-right: 1rem;
    }
  `,
  template: `
    <img
      class="exercise-image"
      [src]="'assets/images/exercises' + darkPath() + '/' + exercise() + '.png'"
      width="24"
      height="24"
    />
    <ion-label>
      {{ 'tabs.training.workout-routine.exercise.' + exercise() | translate }}
    </ion-label>
  `,
})
export class ExerciseItemComponent implements OnInit, OnDestroy {
  exercise = input.required<string>();

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkPath = signal(this.mediaQuery.matches ? '-white' : '');

  ngOnInit(): void {
    this.mediaQuery.addEventListener('change', this.darkPathListener);
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.darkPathListener);
  }

  private darkPathListener = (event: MediaQueryListEvent): void => {
    this.darkPath.set(event.matches ? '-white' : '');
  };
}
