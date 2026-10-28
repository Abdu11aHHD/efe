/** Routing and the two shells: the phone-sized patient canvas, and the wider
 *  reviewer desktop layout. */

import { type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DemoBanner } from './components/AppShell';
import { Button, ErrorState, Spinner } from './components/ui';
import { useSession } from './lib/session';

import HomeScreen from './screens/HomeScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import WellnessScreen from './screens/WellnessScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import NotificationDetailScreen from './screens/NotificationDetailScreen';
import SignInScreen from './screens/SignInScreen';

import SukkarHome from './sukkar/SukkarHome';
import SukkarUpload from './sukkar/SukkarUpload';
import SukkarReports from './sukkar/SukkarReports';
import SukkarReportDetail from './sukkar/SukkarReportDetail';
import SukkarVisitPrep from './sukkar/SukkarVisitPrep';
import SukkarHowItWorks from './sukkar/SukkarHowItWorks';
import { SukkarFollowupDetail, SukkarFollowupList, SukkarFollowupNew } from './sukkar/SukkarFollowups';

import { ReviewerDashboard, ReviewerRequest } from './reviewer/ReviewerApp';

/** The phone-sized application canvas used by every patient screen. */
function PatientCanvas({ children }: { children: ReactNode }) {
  const { demoMode } = useSession();
  return (
    <div className="sp-canvas">
      <DemoBanner show={demoMode} />
      {children}
    </div>
  );
}

function RequireAuth({ children, role }: { children: ReactNode; role?: 'patient' | 'reviewer' }) {
  const { profile, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="sp-canvas grid place-items-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (!profile) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  if (role && profile.role !== role) {
    return (
      <div className="sp-canvas grid place-items-center px-6">
        <ErrorState message="هذه الصفحة مخصّصة لدور مختلف عن دورك الحالي." />
      </div>
    );
  }
  return <>{children}</>;
}

function Patient({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="patient">
      <PatientCanvas>{children}</PatientCanvas>
    </RequireAuth>
  );
}

function NotFound() {
  return (
    <div className="sp-canvas grid place-items-center px-6 text-center">
      <div>
        <p className="text-[18px] font-bold text-ink">الصفحة غير موجودة</p>
        <p className="mt-1.5 text-[13px] text-ink-2">تحقق من الرابط أو عد إلى الرئيسية.</p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => { window.location.href = '/'; }}>العودة إلى الرئيسية</Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { loading, error, retry, profile } = useSession();

  if (loading) {
    return <div className="sp-canvas grid place-items-center"><Spinner size={28} /></div>;
  }

  if (error) {
    return (
      <div className="sp-canvas grid place-items-center px-5">
        <ErrorState message={error.messageAr} detail={error.detailAr} onRetry={retry} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/sign-in" element={
        profile
          ? <Navigate to={profile.role === 'reviewer' ? '/reviewer' : '/'} replace />
          : <div className="sp-canvas"><SignInScreen /></div>
      } />

      {/* ------------------------------------------------ patient app */}
      <Route path="/" element={<Patient><HomeScreen /></Patient>} />
      <Route path="/appointments" element={<Patient><AppointmentsScreen /></Patient>} />
      <Route path="/appointments/:id" element={<Patient><AppointmentDetailScreen /></Patient>} />
      <Route path="/wellness" element={<Patient><WellnessScreen /></Patient>} />
      <Route path="/profile" element={<Patient><ProfileScreen /></Patient>} />
      <Route path="/notifications" element={<Patient><NotificationsScreen /></Patient>} />
      <Route path="/notifications/:id" element={<Patient><NotificationDetailScreen /></Patient>} />

      {/* ------------- Sukkar Plus: a service reached from ملفي ------- */}
      <Route path="/sukkar" element={<Patient><SukkarHome /></Patient>} />
      <Route path="/sukkar/upload" element={<Patient><SukkarUpload /></Patient>} />
      <Route path="/sukkar/reports" element={<Patient><SukkarReports /></Patient>} />
      <Route path="/sukkar/reports/:id" element={<Patient><SukkarReportDetail /></Patient>} />
      <Route path="/sukkar/visit-prep" element={<Patient><SukkarVisitPrep /></Patient>} />
      <Route path="/sukkar/visit-prep/:reportId" element={<Patient><SukkarVisitPrep /></Patient>} />
      <Route path="/sukkar/followups" element={<Patient><SukkarFollowupList /></Patient>} />
      <Route path="/sukkar/followups/new" element={<Patient><SukkarFollowupNew /></Patient>} />
      <Route path="/sukkar/followups/:id" element={<Patient><SukkarFollowupDetail /></Patient>} />
      <Route path="/sukkar/how-it-works" element={<Patient><SukkarHowItWorks /></Patient>} />

      {/* --------------------------------------------- reviewer app */}
      <Route path="/reviewer" element={
        <RequireAuth role="reviewer"><ReviewerDashboard /></RequireAuth>} />
      <Route path="/reviewer/requests/:id" element={
        <RequireAuth role="reviewer"><ReviewerRequest /></RequireAuth>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
