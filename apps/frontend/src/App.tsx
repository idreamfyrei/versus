import { Routes, Route } from "react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { CreatePoll } from "@/pages/CreatePoll";
import { PollPage } from "@/pages/PollPage";
import { Analytics } from "@/pages/Analytics";
import { NotFound } from "@/pages/NotFound";

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="vs/new" element={<CreatePoll />} />
        <Route path="vs/:slugOrId" element={<PollPage />} />
        <Route
          path="vs/:id/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
