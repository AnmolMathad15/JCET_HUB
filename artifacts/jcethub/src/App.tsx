import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard/index";
import Attendance from "@/pages/dashboard/attendance";
import Marks from "@/pages/dashboard/marks";
import Timetable from "@/pages/dashboard/timetable";
import Notifications from "@/pages/dashboard/notifications";
import Events from "@/pages/dashboard/events";
import AcademicCalendar from "@/pages/dashboard/academic-calendar";
import LMS from "@/pages/dashboard/lms";
import Transport from "@/pages/dashboard/transport";
import ExamSchedule from "@/pages/dashboard/exam-schedule";
import Results from "@/pages/dashboard/results";
import Fees from "@/pages/dashboard/fees";
import Circular from "@/pages/dashboard/circular";
import Mentoring from "@/pages/dashboard/mentoring";
import Feedback from "@/pages/dashboard/feedback";
import Notes from "@/pages/dashboard/notes";
import Assignments from "@/pages/dashboard/assignments";
import EventsHub from "@/pages/dashboard/events-hub";
import Leaderboard from "@/pages/dashboard/leaderboard";
import Achievements from "@/pages/dashboard/achievements";
import Resume from "@/pages/dashboard/resume";
import AdminPanel from "@/pages/dashboard/admin/index";
import AdminDepartments from "@/pages/dashboard/admin/departments";
import AdminBatches from "@/pages/dashboard/admin/batches";
import AdminSubjects from "@/pages/dashboard/admin/subjects";
import AdminUsers from "@/pages/dashboard/admin/users";
import AdminFacultyAssignments from "@/pages/dashboard/admin/faculty-assignments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 800,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/attendance" component={Attendance} />
      <Route path="/dashboard/marks" component={Marks} />
      <Route path="/dashboard/timetable" component={Timetable} />
      <Route path="/dashboard/notifications" component={Notifications} />
      <Route path="/dashboard/events" component={Events} />
      <Route path="/dashboard/academic-calendar" component={AcademicCalendar} />
      <Route path="/dashboard/lms" component={LMS} />
      <Route path="/dashboard/transport" component={Transport} />
      <Route path="/dashboard/exam-schedule" component={ExamSchedule} />
      <Route path="/dashboard/results" component={Results} />
      <Route path="/dashboard/fees" component={Fees} />
      <Route path="/dashboard/circular" component={Circular} />
      <Route path="/dashboard/mentoring" component={Mentoring} />
      <Route path="/dashboard/feedback" component={Feedback} />
      <Route path="/dashboard/notes" component={Notes} />
      <Route path="/dashboard/assignments" component={Assignments} />
      <Route path="/dashboard/events-hub" component={EventsHub} />
      <Route path="/dashboard/leaderboard" component={Leaderboard} />
      <Route path="/dashboard/achievements" component={Achievements} />
      <Route path="/dashboard/resume" component={Resume} />
      <Route path="/dashboard/admin" component={AdminPanel} />
      <Route path="/dashboard/admin/departments" component={AdminDepartments} />
      <Route path="/dashboard/admin/batches" component={AdminBatches} />
      <Route path="/dashboard/admin/subjects" component={AdminSubjects} />
      <Route path="/dashboard/admin/users" component={AdminUsers} />
      <Route path="/dashboard/admin/faculty-assignments" component={AdminFacultyAssignments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
