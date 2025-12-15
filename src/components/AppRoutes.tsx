import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Import critical pages synchronously
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import PatientDashboard from "../pages/PatientDashboard";
import PatientOverview from "../pages/PatientOverview";
import TodaysIpdDashboard from "../pages/TodaysIpdDashboard";
import TodaysOpd from "../pages/TodaysOpd";
import AdvanceStatementReport from "../pages/AdvanceStatementReport";
import NoDeductionLetterPage from "../pages/NoDeductionLetter";
import CurrentlyAdmittedPatients from "../pages/CurrentlyAdmittedPatients";

// Lazy load discharged patients page
const DischargedPatients = lazy(() => import("../pages/DischargedPatients"));
const Accommodation = lazy(() => import("../pages/Accommodation"));
const RoomManagement = lazy(() => import("../pages/RoomManagement"));

// Import authentication pages
import UnifiedLogin from "./UnifiedLogin";
import SignupPage from "./SignupPage";
import TestSignup from "./TestSignup";
import SimpleSignup from "./SimpleSignup";

// Import patient portal
import PatientDashboardNew from "../pages/PatientDashboardNew";
import PatientSelfRegistration from "../pages/PatientSelfRegistration";
import PatientSignupEnhanced from "../pages/PatientSignupEnhanced";
import DoctorDirectory from "../pages/DoctorDirectory";
import DoctorProfile from "../pages/DoctorProfile";
import BookAppointment from "../pages/BookAppointment";

// Lazy load patient detail pages
const PatientMedicalRecords = lazy(() => import("../pages/patient/PatientMedicalRecords"));
const PatientPrescriptions = lazy(() => import("../pages/patient/PatientPrescriptions"));
const PatientBilling = lazy(() => import("../pages/patient/PatientBilling"));
const PatientSettings = lazy(() => import("../pages/patient/PatientSettings"));

// Email verification page
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));

// Appointment pages
const AppointmentConfirmation = lazy(() => import("../pages/AppointmentConfirmation"));

// Doctor Portal
const DoctorDashboard = lazy(() => import("../pages/doctor/DoctorDashboard"));
const DoctorSettings = lazy(() => import("../pages/doctor/DoctorSettings"));
const DoctorCalendar = lazy(() => import("../pages/doctor/DoctorCalendar"));
const DoctorMeeting = lazy(() => import("../pages/doctor/DoctorMeeting"));

// Lazy load Advanced Statement Report
const AdvancedStatementReport = lazy(() => import("../pages/AdvancedStatementReport"));

// Lazy load heavy feature pages
const Accounting = lazy(() => import("../pages/Accounting"));
const Pharmacy = lazy(() => import("../pages/Pharmacy"));
const Lab = lazy(() => import("../pages/Lab"));
const Radiology = lazy(() => import("../pages/Radiology"));
const OperationTheatre = lazy(() => import("../pages/OperationTheatre"));
const FinalBill = lazy(() => import("../pages/FinalBill"));
const EditFinalBill = lazy(() => import("../pages/EditFinalBill"));

// Lazy load other pages
const Diagnoses = lazy(() => import("../pages/Diagnoses"));
const Patients = lazy(() => import("../pages/Patients"));
const Users = lazy(() => import("../pages/Users"));
const Complications = lazy(() => import("../pages/Complications"));
const CghsSurgery = lazy(() => import("../pages/CghsSurgery"));
const CghsSurgeryMaster = lazy(() => import("../pages/CghsSurgeryMaster"));
const Medications = lazy(() => import("../pages/Medications"));
const EsicSurgeons = lazy(() => import("../pages/EsicSurgeons"));
const Referees = lazy(() => import("../pages/Referees"));
const HopeSurgeons = lazy(() => import("../pages/HopeSurgeons"));
const HopeConsultants = lazy(() => import("../pages/HopeConsultants"));
const HopeAnaesthetists = lazy(() => import("../pages/HopeAnaesthetists"));
const AyushmanSurgeons = lazy(() => import("../pages/AyushmanSurgeons"));
const AyushmanConsultants = lazy(() => import("../pages/AyushmanConsultants"));
const AyushmanAnaesthetists = lazy(() => import("../pages/AyushmanAnaesthetists"));
const SecurityVerificationPage = lazy(() => import("../pages/SecurityVerificationPage"));
const MandatoryService = lazy(() => import("../pages/MandatoryService"));
const MandatoryServiceCreate = lazy(() => import("../pages/MandatoryServiceCreate"));
const ClinicalServices = lazy(() => import("../pages/ClinicalServices"));
const ClinicalServiceCreate = lazy(() => import("../pages/ClinicalServiceCreate"));
const ExternalRequisition = lazy(() => import("../pages/ExternalRequisition"));
const ExternalRequisitionCreate = lazy(() => import("../pages/ExternalRequisitionCreate"));
const GatePassPrintPage = lazy(() => import("../pages/GatePassPrint"));
const DischargeSummaryPrint = lazy(() => import("../pages/DischargeSummaryPrint"));
const DischargeSummaryEdit = lazy(() => import("../pages/DischargeSummaryEdit"));
const IpdDischargeSummary = lazy(() => import("../pages/IpdDischargeSummary"));
const PhysiotherapyBill = lazy(() => import("../pages/PhysiotherapyBill"));
const AdmissionNotes = lazy(() => import("../pages/AdmissionNotes"));
const OpdAdmissionNotes = lazy(() => import("../pages/OpdAdmissionNotes"));

const PVIFormPrint = lazy(() => import("../pages/PVIFormPrint"));
const PatientProfile = lazy(() => import("../pages/PatientProfile"));
const Prescriptions = lazy(() => import("../pages/prescriptions/Prescriptions"));
const TreatmentSheet = lazy(() => import("../pages/TreatmentSheet"));
const Reports = lazy(() => import("../pages/Reports"));
const FinalBillTest = lazy(() => import("../pages/FinalBillTest"));
const LabPrintDemo = lazy(() => import("../pages/LabPrintDemo"));
const StoreRequisition = lazy(() => import("../components/pharmacy/StoreRequisition"));
const EditSaleBill = lazy(() => import("../components/pharmacy/EditSaleBill"));
const DaywiseBills = lazy(() => import("../pages/DaywiseBills"));
const OldBills = lazy(() => import("../pages/OldBills"));
const ViewBill = lazy(() => import("../pages/ViewBill"));
const FinancialSummary = lazy(() => import("../pages/FinancialSummary"));
const P2Form = lazy(() => import("../pages/P2Form"));
const LabResultsEntryDemo = lazy(() => import("../pages/LabResultsEntryDemo"));
const Invoice = lazy(() => import("../pages/Invoice"));
const DetailedInvoice = lazy(() => import("../pages/DetailedInvoice"));
const DischargeInvoice = lazy(() => import("../pages/DischargeInvoice"));
const BillManagement = lazy(() => import("../pages/BillManagement"));
const Corporate = lazy(() => import("../pages/Corporate"));

// AI Patient Follow-Up System Pages
const PatientEducationManager = lazy(() => import("../pages/PatientEducationManager"));
const PatientFollowUpDashboard = lazy(() => import("../pages/PatientFollowUpDashboard"));
const SurgeryOptionsConfigurator = lazy(() => import("../pages/SurgeryOptionsConfigurator"));
const WhatsAppTest = lazy(() => import("../pages/WhatsAppTest"));
const WhatsAppServiceTest = lazy(() => import("../pages/WhatsAppServiceTest"));

// PDF Generation Test Page
const PDFTestPage = lazy(() => import("../pages/PDFTestPage"));

// Welcome Email Test Page
const WelcomeEmailTest = lazy(() => import("../pages/WelcomeEmailTest"));

// Test Pages for connectivity
const TestWhatsAppAPI = lazy(() => import("../pages/TestWhatsAppAPI"));
const SystemTestDashboard = lazy(() => import("../pages/SystemTestDashboard"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-simple" element={<SimpleSignup />} />
        <Route path="/test" element={<TestSignup />} />

        {/* Patient Routes */}
        <Route path="/patient-signup" element={<PatientSignupEnhanced />} />
        <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>} />
        <Route path="/patient-dashboard" element={<PatientDashboardNew />} />
        <Route path="/patient-register" element={<PatientSelfRegistration />} />
        <Route path="/patient/medical-records" element={<Suspense fallback={<PageLoader />}><PatientMedicalRecords /></Suspense>} />
        <Route path="/patient/prescriptions" element={<Suspense fallback={<PageLoader />}><PatientPrescriptions /></Suspense>} />
        <Route path="/patient/billing" element={<Suspense fallback={<PageLoader />}><PatientBilling /></Suspense>} />
        <Route path="/patient/settings" element={<Suspense fallback={<PageLoader />}><PatientSettings /></Suspense>} />

        {/* Doctor Discovery & Booking */}
        <Route path="/doctors" element={<DoctorDirectory />} />
        <Route path="/doctor/:id" element={<DoctorProfile />} />
        <Route path="/book/:doctorId" element={<BookAppointment />} />
        <Route path="/appointment/confirm/:id" element={<Suspense fallback={<PageLoader />}><AppointmentConfirmation /></Suspense>} />

        {/* Doctor Portal */}
        <Route path="/doctor/dashboard" element={<Suspense fallback={<PageLoader />}><DoctorDashboard /></Suspense>} />
        <Route path="/doctor/settings" element={<Suspense fallback={<PageLoader />}><DoctorSettings /></Suspense>} />
        <Route path="/doctor/calendar" element={<Suspense fallback={<PageLoader />}><DoctorCalendar /></Suspense>} />
        <Route path="/doctor/meeting" element={<Suspense fallback={<PageLoader />}><DoctorMeeting /></Suspense>} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/patient-overview" element={<PatientOverview />} />
        <Route path="/patient-profile" element={<Suspense fallback={<PageLoader />}><PatientProfile /></Suspense>} />
        <Route path="/todays-ipd" element={<TodaysIpdDashboard />} />
        <Route path="/todays-opd" element={<TodaysOpd />} />
        <Route path="/advance-statement-report" element={<AdvanceStatementReport />} />
        <Route path="/advanced-statement-report" element={<Suspense fallback={<PageLoader />}><AdvancedStatementReport /></Suspense>} />
        <Route path="/currently-admitted" element={<CurrentlyAdmittedPatients />} />
        <Route path="/accommodation" element={<Suspense fallback={<PageLoader />}><Accommodation /></Suspense>} />
        <Route path="/room-management" element={<Suspense fallback={<PageLoader />}><RoomManagement /></Suspense>} />
        <Route path="/discharged-patients" element={<Suspense fallback={<PageLoader />}><DischargedPatients /></Suspense>} />
        <Route path="/security-verification" element={<Suspense fallback={<PageLoader />}><SecurityVerificationPage /></Suspense>} />
        <Route path="/mandatory-service" element={<Suspense fallback={<PageLoader />}><MandatoryService /></Suspense>} />
        <Route path="/mandatory-service-create" element={<Suspense fallback={<PageLoader />}><MandatoryServiceCreate /></Suspense>} />
        <Route path="/clinical-services" element={<Suspense fallback={<PageLoader />}><ClinicalServices /></Suspense>} />
        <Route path="/clinical-service-create" element={<Suspense fallback={<PageLoader />}><ClinicalServiceCreate /></Suspense>} />
        <Route path="/external-requisition" element={<Suspense fallback={<PageLoader />}><ExternalRequisition /></Suspense>} />
        <Route path="/external-requisition-create" element={<Suspense fallback={<PageLoader />}><ExternalRequisitionCreate /></Suspense>} />
        <Route path="/gate-pass/:visitId" element={<Suspense fallback={<PageLoader />}><GatePassPrintPage /></Suspense>} />
        <Route path="/discharge-summary-print/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeSummaryPrint /></Suspense>} />
        <Route path="/discharge-summary-edit/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeSummaryEdit /></Suspense>} />
        <Route path="/physiotherapy-bill/:visitId" element={<Suspense fallback={<PageLoader />}><PhysiotherapyBill /></Suspense>} />
        <Route path="/admission-notes/:visitId" element={<Suspense fallback={<PageLoader />}><AdmissionNotes /></Suspense>} />
        <Route path="/opd-admission-notes/:visitId" element={<Suspense fallback={<PageLoader />}><OpdAdmissionNotes /></Suspense>} />

        <Route path="/pvi-form/:visitId" element={<Suspense fallback={<PageLoader />}><PVIFormPrint /></Suspense>} />
        <Route path="/diagnoses" element={<Suspense fallback={<PageLoader />}><Diagnoses /></Suspense>} />
        <Route path="/operation-theatre" element={<Suspense fallback={<PageLoader />}><OperationTheatre /></Suspense>} />
        <Route path="/patients" element={<Suspense fallback={<PageLoader />}><Patients /></Suspense>} />
        <Route path="/users" element={<Suspense fallback={<PageLoader />}><Users /></Suspense>} />
        <Route path="/complications" element={<Suspense fallback={<PageLoader />}><Complications /></Suspense>} />
        <Route path="/cghs-surgery" element={<Suspense fallback={<PageLoader />}><CghsSurgery /></Suspense>} />
        <Route path="/cghs-surgery-master" element={<Suspense fallback={<PageLoader />}><CghsSurgeryMaster /></Suspense>} />
        <Route path="/lab" element={<Suspense fallback={<PageLoader />}><Lab /></Suspense>} />
        <Route path="/radiology" element={<Suspense fallback={<PageLoader />}><Radiology /></Suspense>} />
        <Route path="/medications" element={<Suspense fallback={<PageLoader />}><Medications /></Suspense>} />
        <Route path="/prescriptions" element={<Suspense fallback={<PageLoader />}><Prescriptions /></Suspense>} />
        <Route path="/treatment-sheet" element={<Suspense fallback={<PageLoader />}><TreatmentSheet /></Suspense>} />
        <Route path="/esic-surgeons" element={<Suspense fallback={<PageLoader />}><EsicSurgeons /></Suspense>} />
        <Route path="/referees" element={<Suspense fallback={<PageLoader />}><Referees /></Suspense>} />
        <Route path="/hope-surgeons" element={<Suspense fallback={<PageLoader />}><HopeSurgeons /></Suspense>} />
        <Route path="/hope-consultants" element={<Suspense fallback={<PageLoader />}><HopeConsultants /></Suspense>} />
        <Route path="/hope-anaesthetists" element={<Suspense fallback={<PageLoader />}><HopeAnaesthetists /></Suspense>} />
        <Route path="/ayushman-surgeons" element={<Suspense fallback={<PageLoader />}><AyushmanSurgeons /></Suspense>} />
        <Route path="/ayushman-consultants" element={<Suspense fallback={<PageLoader />}><AyushmanConsultants /></Suspense>} />
        <Route path="/ayushman-anaesthetists" element={<Suspense fallback={<PageLoader />}><AyushmanAnaesthetists /></Suspense>} />
        <Route path="/accounting" element={<Suspense fallback={<PageLoader />}><Accounting /></Suspense>} />
        <Route path="/bill-management" element={<Suspense fallback={<PageLoader />}><BillManagement /></Suspense>} />
        <Route path="/corporate" element={<Suspense fallback={<PageLoader />}><Corporate /></Suspense>} />
        <Route path="/pharmacy/goods-received-note" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/purchase-orders/add" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/purchase-orders/list" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/product-purchase-report" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/inventory-tracking" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/edit-sale/:saleId" element={<Suspense fallback={<PageLoader />}><EditSaleBill /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route path="/final-bill/:visitId" element={<Suspense fallback={<PageLoader />}><FinalBill /></Suspense>} />
        <Route path="/no-deduction-letter/:visitId" element={<NoDeductionLetterPage />} />
        <Route path="/edit-final-bill/:visitId" element={<Suspense fallback={<PageLoader />}><EditFinalBill /></Suspense>} />
        <Route path="/old-bills/:visitId" element={<Suspense fallback={<PageLoader />}><OldBills /></Suspense>} />
        <Route path="/old-bills" element={<Suspense fallback={<PageLoader />}><OldBills /></Suspense>} />
        <Route path="/view-bill/:billId" element={<Suspense fallback={<PageLoader />}><ViewBill /></Suspense>} />
        <Route path="/financial-summary" element={<Suspense fallback={<PageLoader />}><FinancialSummary /></Suspense>} />
        <Route path="/p2form/:visitId" element={<Suspense fallback={<PageLoader />}><P2Form /></Suspense>} />
        <Route path="/lab-print-demo" element={<Suspense fallback={<PageLoader />}><LabPrintDemo /></Suspense>} />
        <Route path="/lab-results-entry-demo" element={<Suspense fallback={<PageLoader />}><LabResultsEntryDemo /></Suspense>} />
        <Route path="/daywise-bills" element={<Suspense fallback={<PageLoader />}><DaywiseBills /></Suspense>} />
        <Route path="/invoice/:visitId" element={<Suspense fallback={<PageLoader />}><Invoice /></Suspense>} />
        <Route path="/detailed-invoice/:visitId" element={<Suspense fallback={<PageLoader />}><DetailedInvoice /></Suspense>} />
        <Route path="/detailed-invoice" element={<Suspense fallback={<PageLoader />}><DetailedInvoice /></Suspense>} />
        <Route path="/discharge-invoice/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeInvoice /></Suspense>} />
        <Route path="/ipd-discharge-summary/:visitId" element={<Suspense fallback={<PageLoader />}><IpdDischargeSummary /></Suspense>} />

        {/* AI Patient Follow-Up System Routes */}
        <Route path="/patient-education" element={<Suspense fallback={<PageLoader />}><PatientEducationManager /></Suspense>} />
        <Route path="/patient-followup" element={<Suspense fallback={<PageLoader />}><PatientFollowUpDashboard /></Suspense>} />
        <Route path="/surgery-options" element={<Suspense fallback={<PageLoader />}><SurgeryOptionsConfigurator /></Suspense>} />
        <Route path="/whatsapp-test" element={<Suspense fallback={<PageLoader />}><WhatsAppTest /></Suspense>} />
        <Route path="/whatsapp-service-test" element={<Suspense fallback={<PageLoader />}><WhatsAppServiceTest /></Suspense>} />

        {/* PDF Generation Test Route */}
        <Route path="/pdf-test" element={<Suspense fallback={<PageLoader />}><PDFTestPage /></Suspense>} />

        {/* Welcome Email Test Route */}
        <Route path="/welcome-email-test" element={<Suspense fallback={<PageLoader />}><WelcomeEmailTest /></Suspense>} />

        {/* API Connectivity Test Routes */}
        <Route path="/test-whatsapp-api" element={<Suspense fallback={<PageLoader />}><TestWhatsAppAPI /></Suspense>} />
        <Route path="/system-test" element={<Suspense fallback={<PageLoader />}><SystemTestDashboard /></Suspense>} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
