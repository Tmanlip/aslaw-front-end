const PATH = {
  HOME: "/",
  CHATBOT: "/chatbot",

  ADMIN : {
    ROOT : "/admin",
    DASHBOARD : "/admin/dashboard",
    MY_PROFILE : "/admin/my-profile",
    SCHEDULE_MEETING : "/admin/schedule-meeting",
    BILLING : "/admin/billing",
    LAWYER_BILLING : "/admin/lawyer-billing", 
    MANAGE_CASE : "/admin/cases",
    ASSIGN_CASE : "/admin/cases/assign-case",
    REGISTER_CASE : "/admin/cases/register-case",
    EDIT_CASE : "/admin/cases/edit-case",
    MANAGE_USER : "/admin/users",
    MANAGE_PROFILE : "/admin/users/manage-profile",
    REGISTER_USER : "/admin/users/register",
    LOGS : "/admin/logs",
    SEARCH : "/admin/search"
  },

  ADMIN_STAFF : {
    ROOT : "/admin-staff",
    DASHBOARD : "/admin-staff/dashboard",
    MY_PROFILE : "/admin-staff/my-profile",
    SCHEDULE_MEETING : "/admin-staff/schedule-meeting",
    BILLING : "/admin-staff/billing",
    LAWYER_BILLING : "/admin-staff/lawyer-billing",
    MANAGE_CASE : "/admin-staff/cases",
    ASSIGN_CASE : "/admin-staff/cases/assign-case",
    REGISTER_CASE : "/admin-staff/cases/register-case",
    EDIT_CASE : "/admin-staff/cases/edit-case",
    MANAGE_USER : "/admin-staff/users",
    MANAGE_PROFILE : "/admin-staff/users/manage-profile",
    REGISTER_USER : "/admin-staff/users/register",
    SEARCH : "/admin-staff/search"
  },

  JUNIOR_ADMIN : {
    ROOT : "/junior-admin",
    DASHBOARD : "/junior-admin/dashboard",
    MY_PROFILE : "/junior-admin/my-profile",
    SCHEDULE_MEETING : "/junior-admin/schedule-meeting",
    MANAGE_CASE : "/junior-admin/cases",
    REGISTER_CASE : "/junior-admin/cases/register-case",
    MANAGE_USER : "/junior-admin/users",
    MANAGE_PROFILE : "/junior-admin/users/manage-profile",
    REGISTER_USER : "/junior-admin/users/register"
  },

  CLIENT : {
    ROOT : "/client",
    DASHBOARD : "/client/dashboard",
    MY_PROFILE : "/client/my-profile",
    VIEW_CASE : "/client/view-case",
    SCHEDULE_MEETING : "/client/schedule-meeting"
  },

  LAWYER : {
    ROOT : "/lawyer",
    DASHBOARD : "/lawyer/dashboard",
    UPDATE_CASE : "/lawyer/update-case",
    MY_PROFILE : "/lawyer/my-profile",
    SCHEDULE_MEETING : "/lawyer/schedule-meeting"
  },

  DOCUMENT_GENERATOR: {
    DASHBOARD: "/document-generator",
    TEMPLATE: "/document-generator/template/:id",
    TEMPLATE_VISIBILITY: "/document-generator/template-visibility",
  },

  AUTH : {
    LOGOUT : "/logout",
    FORGOT_PASSWORD : "/forgot-password",
    RESET_PASSWORD : "/reset-password",
    LOGIN : "/login"
  }
};

export default PATH;