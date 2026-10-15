import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService } from '../auth';

import { TabViewComponent } from './tab-view.component';
import type { TabId } from './tab-view.config';

describe('TabViewComponent', () => {
  let fixture: ComponentFixture<TabViewComponent>;

  const isLoggedIn = signal(false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabViewComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { isLoggedIn },
        },
      ],
    })
      .overrideComponent(TabViewComponent, {
        set: {
          imports: [],
          template: `
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                [attr.data-tab]="tab.id"
                [disabled]="tab.requiresAuth && !isLoggedIn()"
                (click)="selectTab(tab.id)"
              >
                <span
                  class="icon"
                  [attr.data-icon]="getIcon(tab)"
                ></span>
              </button>
            }
          `,
        },
      })
      .compileComponents();

    isLoggedIn.set(false);

    fixture = TestBed.createComponent(TabViewComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('authentication', () => {
    it('should disable protected tabs when logged out', () => {
      expect(getTabButton('training').disabled).toBe(true);
      expect(getTabButton('overview').disabled).toBe(false);
      expect(getTabButton('calendar').disabled).toBe(true);
      expect(getTabButton('more').disabled).toBe(true);
    });

    it('should enable protected tabs when logged in', () => {
      isLoggedIn.set(true);
      fixture.detectChanges();

      expect(getTabButton('training').disabled).toBe(false);
      expect(getTabButton('overview').disabled).toBe(false);
      expect(getTabButton('calendar').disabled).toBe(false);
      expect(getTabButton('more').disabled).toBe(false);
    });
  });

  describe('selected tab', () => {
    it('should initially display the active overview icon', () => {
      expect(getIconName('overview')).toBe('person');
      expect(getIconName('training')).toBe('bicycle-outline');
      expect(getIconName('calendar')).toBe('calendar-outline');
    });

    it('should update the active icon when the selected tab changes', () => {
      isLoggedIn.set(true);
      fixture.detectChanges();

      getTabButton('training').click();
      fixture.detectChanges();

      expect(getIconName('training')).toBe('bicycle');
      expect(getIconName('overview')).toBe('person-outline');
    });
  });

  function getTabButton(tab: TabId): HTMLButtonElement {
    return fixture.debugElement.query(By.css(`[data-tab="${tab}"]`))
      .nativeElement as HTMLButtonElement;
  }

  function getIconName(tab: TabId): string | null {
    const button = fixture.debugElement.query(By.css(`[data-tab="${tab}"]`));

    const icon = button.query(By.css('.icon'));

    return icon.nativeElement.getAttribute('data-icon');
  }
});
