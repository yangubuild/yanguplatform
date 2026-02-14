import { Navigate } from "react-router-dom";

/** Legacy route — redirects to new /dashboard App Shell */
const NavigationDashboard = () => <Navigate to="/dashboard" replace />;

export default NavigationDashboard;
