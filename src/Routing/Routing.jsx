import { BrowserRouter, Route, Routes } from "react-router-dom";

import StudentManagement from "../components/student-management/StudentManagement";
import AddStudent from "../components/student-management/AddStudent";
import StaffManagement from "../components/staff-management/StaffManagement";
import Enquiries from "../components/Enquires";
import CourseManagement from "../components/courses/CourseManagement";
import CourseForm from "../components/courses/CourseForm";
import Login from "../components/Login";
import Dashboard from "../components/Dashboard";
import Layout from "../components/common/Layout";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

export default function dasRouting() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/students/add" element={<AddStudent />} />
            <Route path="/students/edit/:studentId" element={<AddStudent />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/courses/add" element={<CourseForm />} />
            <Route
              path="/courses/edit/:courseId"
              element={<CourseForm mode="edit" />}
            />
            <Route
              path="/courses/view/:courseId"
              element={<CourseForm mode="view" />}
            />
            <Route path="/enquiries" element={<Enquiries />} />
            <Route path="/staff" element={<StaffManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
