import test from 'node:test';
import assert from 'node:assert/strict';
import { AppointmentStatus } from '../types';
import {
  isAiStudioOrLocalPreviewHost,
  shouldShowAiStudioPreviewBar,
  resolveDisplayBusinessDescription,
  resolveMergedAppointmentStatus,
} from './appointmentSync';

test('Preview bar never flashes on production domains or during initial bootstrap loading', () => {
  assert.equal(isAiStudioOrLocalPreviewHost('timeto24.ir'), false);
  assert.equal(isAiStudioOrLocalPreviewHost('www.timeto24.ir'), false);
  assert.equal(isAiStudioOrLocalPreviewHost('timeto-app.liara.run'), false);
  assert.equal(isAiStudioOrLocalPreviewHost('localhost'), true);
  assert.equal(
    isAiStudioOrLocalPreviewHost('113da5bc.scf.usercontent.goog'),
    true
  );

  // Even if initial dataMode state starts as 'mock', loading guard prevents flash
  assert.equal(
    shouldShowAiStudioPreviewBar({
      dataMode: 'mock',
      isLoadingInitialData: true,
      hostname: 'localhost',
    }),
    false
  );

  // Production domain never shows the preview bar even in fallback states
  assert.equal(
    shouldShowAiStudioPreviewBar({
      dataMode: 'mock',
      isLoadingInitialData: false,
      hostname: 'timeto24.ir',
    }),
    false
  );

  // Real mode never shows the preview bar
  assert.equal(
    shouldShowAiStudioPreviewBar({
      dataMode: 'real',
      isLoadingInitialData: false,
      hostname: 'localhost',
    }),
    false
  );

  // Local/AI Studio mock preview after load shows the bar
  assert.equal(
    shouldShowAiStudioPreviewBar({
      dataMode: 'mock',
      isLoadingInitialData: false,
      hostname: 'localhost',
    }),
    true
  );
});

test('Business profile description prioritizes edited shortDescription over stale aboutText', () => {
  assert.equal(
    resolveDisplayBusinessDescription({
      shortDescription: 'توضیح جدید سالن آیرا',
      aboutText: 'متن قدیمی پیش‌فرض',
    }),
    'توضیح جدید سالن آیرا'
  );
  assert.equal(
    resolveDisplayBusinessDescription({
      shortDescription: '',
      aboutText: 'متن معرفی سالن',
    }),
    'متن معرفی سالن'
  );
});

test('Authoritative server appointment status overrides stale localStorage PENDING status', () => {
  assert.equal(
    resolveMergedAppointmentStatus({
      serverStatus: AppointmentStatus.Confirmed,
      localStatus: AppointmentStatus.Pending,
      authoritativeFromServer: true,
    }),
    AppointmentStatus.Confirmed
  );

  assert.equal(
    resolveMergedAppointmentStatus({
      serverStatus: AppointmentStatus.Cancelled,
      localStatus: AppointmentStatus.Pending,
      authoritativeFromServer: true,
    }),
    AppointmentStatus.Cancelled
  );

  assert.equal(
    resolveMergedAppointmentStatus({
      serverStatus: AppointmentStatus.Pending,
      localStatus: AppointmentStatus.Confirmed,
      authoritativeFromServer: false,
    }),
    AppointmentStatus.Confirmed
  );
});
