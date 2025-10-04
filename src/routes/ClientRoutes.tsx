import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Client/Pages/Dashboard";
import Profile from "../features/Client/Pages/My Profile";
import ViewCase from "../features/Client/Pages/View Case";

const clientRoutes: RouteObject[] = [
  { path: PATH.CLIENT.DASHBOARD, element: <Dashboard /> },
  { path: PATH.CLIENT.MY_PROFILE, element: <Profile /> },
  { path: PATH.CLIENT.VIEW_CASE, element: <ViewCase />}
];

export default clientRoutes;
