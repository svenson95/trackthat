import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../../environments/environment';
import type { GetLogsWorkoutDTO, UserDoc } from '../../../core';
import { UserService } from '../../../core';

import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let httpTestingController: HttpTestingController;

  const userData = signal<UserDoc | undefined>(undefined);

  const userServiceMock = {
    userData,
  };

  const createUser = (overrides: Partial<UserDoc> = {}): UserDoc => ({
    id: 'user-1',
    googleId: 'google-1',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    email: 'test@example.com',
    ...overrides,
  });

  beforeEach(() => {
    userData.set(undefined);

    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: UserService,
          useValue: userServiceMock,
        },
      ],
    });

    service = TestBed.inject(CalendarService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should not request workout entries when no user is available', () => {
    TestBed.tick();

    httpTestingController.expectNone((request) => request.url.includes('/logs-workout/get/all/'));
  });

  it('should request all workout entries for the current user', async () => {
    userData.set(createUser());

    TestBed.tick();

    const request = httpTestingController.expectOne(
      `${environment.api}logs-workout/get/all/user-1`,
    );

    expect(request.request.method).toBe('GET');

    const response: GetLogsWorkoutDTO = [];

    request.flush(response);

    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.workoutEntriesResource.value()).toEqual(response);
  });

  it('should request workout entries when a user becomes available', () => {
    TestBed.tick();

    httpTestingController.expectNone((request) => request.url.includes('/logs-workout/get/all/'));

    userData.set(createUser());

    TestBed.tick();

    const request = httpTestingController.expectOne(
      `${environment.api}logs-workout/get/all/user-1`,
    );

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });

  it('should reload workout entries when the current user changes', () => {
    userData.set(createUser({ id: 'user-1' }));

    TestBed.tick();

    const firstRequest = httpTestingController.expectOne(
      `${environment.api}logs-workout/get/all/user-1`,
    );

    firstRequest.flush([]);

    TestBed.tick();

    userData.set(createUser({ id: 'user-2' }));

    TestBed.tick();

    const secondRequest = httpTestingController.expectOne(
      `${environment.api}logs-workout/get/all/user-2`,
    );

    expect(secondRequest.request.method).toBe('GET');

    secondRequest.flush([]);
  });
});
