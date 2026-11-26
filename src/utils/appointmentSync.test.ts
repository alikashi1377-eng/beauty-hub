import test from 'node:test';
import assert from 'node:assert/strict';
import { AppointmentItem, AppointmentStatus } from '../types';
import {
  isAiStudioOrLocalPreviewHost,
  shouldShowAiStudioPreviewBar,
  resolveDisplayBusinessDescription,
  resolveMergedAppointmentStatus,
  resolveBootstrapAppointmentsUpdate,
  shouldCustomerBootstrapOverwriteAppointments,
  isUnauthorizedSessionError,
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

test('Public bootstrap omitting appointments (undefined) preserves existing appointments instead of wiping them to []', () => {
  const existingApt: AppointmentItem = {
    id: 'apt-live-1',
    referenceCode: 'ZB-4926693834',
    businessId: 'biz-ayra',
    businessSlug: 'ayra',
    businessName: 'مرکز لیزر آیرا',
    serviceId: 'srv-1',
    serviceTitle: 'لیزر فول‌بادی',
    specialistId: 'spc-1',
    specialistName: 'متخصص آیرا',
    customerName: 'سارا محمدی',
    customerPhone: '۰۹۳۸۱۴۰۱۹۱۶',
    customerPhoneMasked: '۰۹۳۸***۱۹۱۶',
    dateJalali: '۱۴۰۵/۰۹/۰۵',
    timeSlot: '۱۳:۰۰',
    durationMinutes: 60,
    priceToman: 1500000,
    depositPaidToman: 150000,
    status: AppointmentStatus.Confirmed,
  };

  let mergeCalled = false;
  const omittedRes = resolveBootstrapAppointmentsUpdate({
    bootstrapAppointments: undefined,
    previousAppointments: [existingApt],
    mergeAuthoritative: (serverApts) => {
      mergeCalled = true;
      return serverApts;
    },
  });

  assert.equal(mergeCalled, false);
  assert.equal(omittedRes.shouldPersist, false);
  assert.equal(omittedRes.appointments.length, 1);
  assert.equal(omittedRes.appointments[0].referenceCode, 'ZB-4926693834');

  const explicitArrayRes = resolveBootstrapAppointmentsUpdate({
    bootstrapAppointments: [existingApt],
    previousAppointments: [],
    mergeAuthoritative: (serverApts) => {
      mergeCalled = true;
      return serverApts;
    },
  });
  assert.equal(mergeCalled, true);
  assert.equal(explicitArrayRes.shouldPersist, true);
  assert.equal(explicitArrayRes.appointments.length, 1);
});

test('Customer bootstrap never overwrites appointments for PLATFORM_ADMIN or BUSINESS_OWNER, and 401 session errors are detected cleanly', () => {
  assert.equal(shouldCustomerBootstrapOverwriteAppointments(['CUSTOMER']), true);
  assert.equal(
    shouldCustomerBootstrapOverwriteAppointments(['CUSTOMER', 'BUSINESS_OWNER']),
    false
  );
  assert.equal(
    shouldCustomerBootstrapOverwriteAppointments(['CUSTOMER', 'PLATFORM_ADMIN']),
    false
  );

  assert.equal(
    isUnauthorizedSessionError({ status: 401, errorCode: 'AUTHENTICATION_REQUIRED' }),
    true
  );
  assert.equal(
    isUnauthorizedSessionError({ status: 403, errorCode: 'SESSION_EXPIRED' }),
    true
  );
  assert.equal(
    isUnauthorizedSessionError({ status: 503, errorCode: 'DB_CONNECTION_REFUSED' }),
    false
  );
});

