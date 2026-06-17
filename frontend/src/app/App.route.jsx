import { createBrowserRouter } from "react-router"
import Login from "../features/auth/pages/Login"
import Signup from "../features/auth/pages/Signup"
import Dashboard from "../features/dashboard/Dashboard"
import { ProtectedRoute, GuestRoute } from "../features/auth/components/AuthRoutes"

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Dashboard />
      }
    ]
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/signup",
        element: <Signup />
      }
    ]
  }
])