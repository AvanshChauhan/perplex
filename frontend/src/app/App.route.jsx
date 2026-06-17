import {createBrowserRouter} from "react-router"
import Login from "../features/auth/pages/Login"
import Signup from "../features/auth/pages/Signup"
import Dashboard from "../features/dashboard/Dashboard"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  }
])