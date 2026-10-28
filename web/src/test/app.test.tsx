/**
 * Frontend behaviour tests.
 *
 * The API client is mocked so each test drives the real screens, routing and
 * state machine rather than a visual approximation.
 */

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fx from './fixtures';

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  me: vi.fn(),
  healthProfile: vi.fn(),
  home: vi.fn(),
  sukkarState: vi.fn(),
  reports: vi.fn(),
  report: vi.fn(),
  reportStatus: vi.fn(),
  updateFields: vi.fn(),
  visitPrep: vi.fn(),
  followups: vi.fn(),
  followup: vi.fn(),
  createFollowup: vi.fn(),
  withdrawFollowup: vi.fn(),
  closeFollowup: vi.fn(),
  appointments: vi.fn(),
  appointment: vi.fn(),
  notifications: vi.fn(),
  readNotification: vi.fn(),
  readAllNotifications: vi.fn(),
  deleteNotifications: vi.fn(),
  wellness: vi.fn(),
  reviewerQueue: vi.fn(),
  reviewerRequest: vi.fn(),
  reviewerStart: vi.fn(),
  reviewerDecide: vi.fn(),
  reviewerNote: vi.fn(),
  demoSession: vi.fn(),
  uploadReport: vi.fn(),
}));

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    api: mocks,
    uploadReport: mocks.uploadReport,
    readToken: () => 'demo-patient',
    writeToken: vi.fn(),
  };
});

const { renderApp } = await import('./render');

function resetHappyPath() {
  mocks.config.mockResolvedValue(fx.config);
  mocks.me.mockResolvedValue({ profile: fx.profile, demo_mode: true, role: 'patient' });
  mocks.healthProfile.mockResolvedValue(fx.healthProfile);
  mocks.home.mockResolvedValue(fx.homeData);
  mocks.sukkarState.mockResolvedValue(fx.sukkarState);
  mocks.reports.mockResolvedValue({ items: [fx.reportSummary], total: 1, limit: 20, offset: 0 });
  mocks.report.mockResolvedValue(fx.reportDetail);
  mocks.visitPrep.mockResolvedValue(fx.visitPrep);
  mocks.followups.mockResolvedValue({ items: [], total: 0 });
  mocks.followup.mockResolvedValue(fx.followup);
  mocks.createFollowup.mockResolvedValue(fx.followup);
  mocks.appointments.mockResolvedValue(fx.appointments);
  mocks.notifications.mockResolvedValue(fx.notifications);
  mocks.readNotification.mockResolvedValue(undefined);
  mocks.readAllNotifications.mockResolvedValue({ count: 1 });
  mocks.deleteNotifications.mockResolvedValue({ count: 1 });
  mocks.wellness.mockResolvedValue(fx.wellness);
}

beforeEach(() => {
  vi.clearAllMocks();
  resetHappyPath();
});

/* ------------------------------------------------------------ navigation */

describe('main navigation', () => {
  it('has exactly the four required destinations', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'التنقل الرئيسي' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'الرئيسية', 'المواعيد', 'جودة الحياة', 'ملفي',
    ]);
  });

  it('does not add Sukkar Plus as a fifth tab', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'التنقل الرئيسي' });
    expect(within(nav).queryByText('سكر بلس')).toBeNull();
  });

  it('moves between destinations without losing the bottom navigation', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByRole('heading', { name: 'الرئيسية' });

    const tab = (name: string) => within(
      screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).getByRole('link', { name });

    await user.click(tab('جودة الحياة'));
    expect(await screen.findByRole('heading', { name: 'جودة الحياة' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument();

    await user.click(tab('المواعيد'));
    expect(await screen.findByRole('heading', { name: 'المواعيد' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument();
  });

  it('keeps ملفي active while inside the Sukkar Plus service', async () => {
    renderApp('/sukkar');
    await screen.findByRole('heading', { name: 'سكر بلس' });
    const nav = screen.getByRole('navigation', { name: 'التنقل الرئيسي' });
    const profileTab = within(nav).getByRole('link', { name: 'ملفي' });
    expect(profileTab).toHaveAttribute('aria-current', 'page');
  });
});

/* --------------------------------------------------------- ملفي + tile */

describe('the ملفي screen', () => {
  it('shows the patient card and the health-profile services', async () => {
    renderApp('/profile');
    expect(await screen.findByRole('heading', { name: 'ملفي' })).toBeInTheDocument();
    expect(screen.getByText('سارة الأحمد (حساب تجريبي)')).toBeInTheDocument();
    expect(screen.getByText(/SP-0000-0000-DEMO/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'الملف الصحي' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'التقارير والمستندات' })).toBeInTheDocument();
    expect(screen.getByLabelText('فريقي الطبي')).toBeInTheDocument();
    expect(screen.getByLabelText('السجل الصحي')).toBeInTheDocument();
    expect(screen.getByLabelText('الأدوية والوصفات')).toBeInTheDocument();
  });

  it('carries the سكر بلس service tile with its subtitle', async () => {
    renderApp('/profile');
    const tile = await screen.findByTestId('sukkar-plus-tile');
    expect(tile).toHaveAccessibleName(/سكر بلس/);
    expect(within(tile).getByText('رحلتك مع السكر، بطريقة أسهل')).toBeInTheDocument();
  });

  it('opens Sukkar Plus when the tile is tapped', async () => {
    const user = userEvent.setup();
    renderApp('/profile');
    await user.click(await screen.findByTestId('sukkar-plus-tile'));
    expect(await screen.findByText('أهلًا بك في سكر بلس')).toBeInTheDocument();
  });
});

/* ----------------------------------------------------- Sukkar Plus flow */

describe('the Sukkar Plus service', () => {
  it('greets the patient and offers the main action', async () => {
    renderApp('/sukkar');
    expect(await screen.findByText('أهلًا بك في سكر بلس')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ابدأ بتقرير السكر/ })).toBeInTheDocument();
    expect(screen.getByText('التقرير جاهز للمراجعة')).toBeInTheDocument();
  });

  it('shows all four shortcuts', async () => {
    renderApp('/sukkar');
    await screen.findByText('أهلًا بك في سكر بلس');
    for (const label of ['تقاريري', 'الاستعداد لموعدي', 'طلبات المتابعة', 'كيف يعمل سكر بلس؟']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('shows a first-use state and no fabricated metrics before any upload', async () => {
    mocks.sukkarState.mockResolvedValue(fx.emptySukkarState);
    renderApp('/sukkar');
    expect(await screen.findByText('خلّنا نرتّب تقريرك مع بعض')).toBeInTheDocument();
    expect(screen.getByText(/PDF نصي/)).toBeInTheDocument();
    expect(screen.queryByText('65.5%')).toBeNull();
  });

  it('navigates ملفي → سكر بلس → تقاريري → تقرير and back again', async () => {
    const user = userEvent.setup();
    renderApp('/profile');

    await user.click(await screen.findByTestId('sukkar-plus-tile'));
    await screen.findByText('أهلًا بك في سكر بلس');

    await user.click(screen.getByRole('button', { name: /تقاريري/ }));
    expect(await screen.findByRole('heading', { name: 'تقاريري' })).toBeInTheDocument();

    await user.click(screen.getByText('يحتاج إلى مراجعة مختص'));
    expect(await screen.findByRole('heading', { name: 'تفاصيل التقرير' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'رجوع' }));
    expect(await screen.findByRole('heading', { name: 'تقاريري' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'رجوع' }));
    expect(await screen.findByText('أهلًا بك في سكر بلس')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'رجوع' }));
    expect(await screen.findByRole('heading', { name: 'ملفي' })).toBeInTheDocument();
  });
});

/* ----------------------------------------------------------- the upload */

describe('report upload', () => {
  it('rejects a non-PDF file before contacting the server', async () => {
    renderApp('/sukkar/upload');
    await screen.findByText('اختر ملف PDF');
    // fireEvent, because userEvent.upload silently drops files the input's
    // accept attribute rejects - here we are testing our own validation.
    fireEvent.change(document.getElementById('report-file') as HTMLInputElement,
      { target: { files: [new File(['hello'], 'notes.txt', { type: 'text/plain' })] } });
    expect(await screen.findByText(/نوع الملف غير مدعوم/)).toBeInTheDocument();
    expect(mocks.uploadReport).not.toHaveBeenCalled();
  });

  it('rejects an oversized file before contacting the server', async () => {
    renderApp('/sukkar/upload');
    await screen.findByText('اختر ملف PDF');
    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 16 * 1024 * 1024 });
    fireEvent.change(document.getElementById('report-file') as HTMLInputElement,
      { target: { files: [big] } });
    expect(await screen.findByText(/أكبر من الحد المسموح/)).toBeInTheDocument();
    expect(mocks.uploadReport).not.toHaveBeenCalled();
  });

  it('only reports success once the backend says processing finished', async () => {
    const user = userEvent.setup();
    mocks.uploadReport.mockReturnValue({
      promise: Promise.resolve({ report: { ...fx.reportSummary, status: 'processing',
        status_label_ar: 'جارٍ تجهيز التقرير' }, message_ar: 'تم الاستلام' }),
      cancel: vi.fn(),
    });
    mocks.reportStatus
      .mockResolvedValueOnce({ id: 'r1', status: 'processing', status_label_ar: 'جارٍ تجهيز التقرير',
        error_ar: null, ready: false, failed: false })
      .mockResolvedValue({ id: 'r1', status: 'ready', status_label_ar: 'التقرير جاهز',
        error_ar: null, ready: true, failed: false });

    renderApp('/sukkar/upload');
    await screen.findByText('اختر ملف PDF');
    fireEvent.change(document.getElementById('report-file') as HTMLInputElement,
      { target: { files: [new File(['%PDF-1.7'], 'report.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByText('report.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /رفع التقرير/ }));
    expect(await screen.findByText(/جارٍ تجهيز التقرير/)).toBeInTheDocument();
    expect(screen.queryByText('تم بنجاح')).toBeNull();

    expect(await screen.findByText('تم بنجاح', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /افتح التقرير/ })).toBeInTheDocument();
  }, 10_000);

  it('shows the backend failure reason and offers a retry', async () => {
    const user = userEvent.setup();
    mocks.uploadReport.mockReturnValue({
      promise: Promise.resolve({ report: { ...fx.reportSummary, status: 'processing',
        status_label_ar: 'جارٍ التجهيز' }, message_ar: '' }),
      cancel: vi.fn(),
    });
    mocks.reportStatus.mockResolvedValue({
      id: 'r1', status: 'failed', status_label_ar: 'تعذّرت المعالجة',
      error_ar: 'لا يحتوي الملف على نص يمكن قراءته — يبدو أنه تقرير ممسوح ضوئيًا.',
      ready: false, failed: true,
    });

    renderApp('/sukkar/upload');
    await screen.findByText('اختر ملف PDF');
    fireEvent.change(document.getElementById('report-file') as HTMLInputElement,
      { target: { files: [new File(['%PDF-1.7'], 'scan.pdf', { type: 'application/pdf' })] } });
    await user.click(await screen.findByRole('button', { name: /رفع التقرير/ }));

    expect(await screen.findByText(/ممسوح ضوئيًا/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument();
  }, 10_000);
});

/* ------------------------------------------------------- report details */

describe('the report detail screen', () => {
  it('shows a loading skeleton, then the values with their source', async () => {
    renderApp('/sukkar/reports/r1');
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(await screen.findByText('متوسط السكر')).toBeInTheDocument();
    expect(screen.getByText(/Average Glucose/)).toBeInTheDocument();
    expect(screen.getAllByText(/صفحة 1/).length).toBeGreaterThan(0);
  });

  it('shows the outcome, the checks and the summary source', async () => {
    renderApp('/sukkar/reports/r1');
    expect(await screen.findByText('يحتاج إلى مراجعة مختص')).toBeInTheDocument();
    expect(screen.getByText(/مجموع نطاقات السكر الخمسة/)).toBeInTheDocument();
    expect(screen.getByText(/قالب محلي/)).toBeInTheDocument();
  });

  it('surfaces a failed report with its Arabic reason', async () => {
    mocks.report.mockResolvedValue({
      ...fx.reportDetail, status: 'failed',
      error_ar: 'لم نتعرف على أي مؤشر سكر في هذا الملف.',
    });
    renderApp('/sukkar/reports/r1');
    expect(await screen.findByText('لم نتعرف على أي مؤشر سكر في هذا الملف.')).toBeInTheDocument();
  });

  it('shows an error state with a retry when the request fails', async () => {
    const { ApiError } = await import('../lib/api');
    mocks.report.mockRejectedValue(new ApiError(500, 'internal_error', 'حدث خطأ غير متوقع.'));
    renderApp('/sukkar/reports/r1');
    expect(await screen.findByRole('alert')).toHaveTextContent('حدث خطأ غير متوقع.');
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument();
  });
});

/* ----------------------------------------------------- follow-up submit */

describe('follow-up requests', () => {
  it('requires a reason and then submits to the backend', async () => {
    const user = userEvent.setup();
    renderApp('/sukkar/followups/new?report=r1');

    const submit = await screen.findByRole('button', { name: /إرسال الطلب/ });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('لماذا ترغب في المراجعة؟'), 'أرغب في مراجعة تقريري.');
    expect(submit).toBeEnabled();

    await user.click(submit);
    await waitFor(() => expect(mocks.createFollowup).toHaveBeenCalledWith({
      report_id: 'r1', reason_ar: 'أرغب في مراجعة تقريري.', include_metrics: true,
    }));
  });

  it('shows the exact snapshot the reviewer will see', async () => {
    renderApp('/sukkar/followups/new?report=r1');
    expect(await screen.findByRole('heading', { name: 'ما سيراه المراجع' })).toBeInTheDocument();
    expect(screen.getByText('الوقت ضمن النطاق (70–180)')).toBeInTheDocument();
  });

  it('surfaces a duplicate request as a clear message', async () => {
    const user = userEvent.setup();
    const { ApiError } = await import('../lib/api');
    mocks.createFollowup.mockRejectedValue(
      new ApiError(409, 'duplicate_request', 'يوجد طلب متابعة مفتوح لنفس التقرير ونفس الأسباب.'));
    renderApp('/sukkar/followups/new?report=r1');
    await user.type(await screen.findByLabelText('لماذا ترغب في المراجعة؟'), 'سبب');
    await user.click(screen.getByRole('button', { name: /إرسال الطلب/ }));
    expect(await screen.findByText(/يوجد طلب متابعة مفتوح/)).toBeInTheDocument();
  });
});

/* -------------------------------------------------------- notifications */

describe('notifications', () => {
  it('separates personal and general notifications', async () => {
    const user = userEvent.setup();
    renderApp('/notifications');
    expect(await screen.findByRole('heading', { name: 'التنبيهات' })).toBeInTheDocument();
    expect(screen.getByText('تقريرك جاهز')).toBeInTheDocument();
    expect(screen.queryByText('عن سكر بلس')).toBeNull();

    await user.click(screen.getByRole('tab', { name: /العامة/ }));
    expect(await screen.findByText('عن سكر بلس')).toBeInTheDocument();
    expect(screen.queryByText('تقريرك جاهز')).toBeNull();
  });

  it('marks everything as read through the backend', async () => {
    const user = userEvent.setup();
    renderApp('/notifications');
    await user.click(await screen.findByRole('button', { name: 'تعليم الكل كمقروء' }));
    await waitFor(() => expect(mocks.readAllNotifications).toHaveBeenCalled());
  });

  it('asks for confirmation before deleting everything', async () => {
    const user = userEvent.setup();
    renderApp('/notifications');
    await user.click(await screen.findByRole('button', { name: 'حذف الكل' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('لا يمكن التراجع');
    expect(mocks.deleteNotifications).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'حذف' }));
    await waitFor(() => expect(mocks.deleteNotifications).toHaveBeenCalledWith('personal'));
  });
});

/* ----------------------------------------------------------- guardrails */

describe('honest states', () => {
  it('labels every appointment as a prototype appointment', async () => {
    renderApp('/appointments');
    expect(await screen.findByText(/لم يُحجز أي موعد حقيقي/)).toBeInTheDocument();
  });

  it('shows the demo banner when the backend runs in demo mode', async () => {
    renderApp('/');
    expect(await screen.findByText('وضع العرض — بيانات تجريبية بالكامل')).toBeInTheDocument();
  });

  it('keeps the reviewer dashboard away from a patient session', async () => {
    renderApp('/reviewer');
    expect(await screen.findByRole('alert'))
      .toHaveTextContent('هذه الصفحة مخصّصة لدور مختلف');
    expect(mocks.reviewerQueue).not.toHaveBeenCalled();
  });

  it('shows the wellness disclaimer and sources', async () => {
    const user = userEvent.setup();
    renderApp('/wellness');
    expect(await screen.findByText(/لا يتضمن تشخيصًا/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ما معنى الوقت ضمن النطاق/ }));
    expect(await screen.findByText(/Battelino 2019/)).toBeInTheDocument();
  });
});
