import React from "react";
import { NavLink } from "react-router-dom";
import { ADMIN_PATH } from "../../../constant/paths";

const adminNavItems = [
  { path: "", label: "Dashboard" },
  { path: "register", label: "Register User" },
  { path: "manage", label: "Manage User" },
];

const AdminNavigation: React.FC = () => {
  return (
    <nav className="p-4 w-56 bg-gray-100 h-screen">
      <h2 className="font-bold text-lg mb-4">Admin Menu</h2>
      <ul className="flex flex-col gap-2 list-none">
        {adminNavItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={`${ADMIN_PATH.ADMIN}/${item.path}`}
              end={item.path === ""}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md ${
                  isActive ? "bg-blue-600 text-white font-semibold" : "text-black hover:bg-gray-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNavigation;
