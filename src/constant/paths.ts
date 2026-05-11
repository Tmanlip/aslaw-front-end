const PATH = {
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
    SEARCH : "/admin/search",
    CHATBOT : "/admin/chatbot"
  },

  CLIENT : {
    ROOT : "/client",
    DASHBOARD : "/client/dashboard",
    MY_PROFILE : "/client/my-profile",
    VIEW_CASE : "/client/view-case",
    SCHEDULE_MEETING : "/client/schedule-meeting",
    CHATBOT : "/client/chatbot"
  },

  LAWYER : {
    ROOT : "/lawyer",
    DASHBOARD : "/lawyer/dashboard",
    UPDATE_CASE : "/lawyer/update-case",
    MY_PROFILE : "/lawyer/my-profile",
    SCHEDULE_MEETING : "/lawyer/schedule-meeting",
    CHATBOT : "/lawyer/chatbot"
  },

  CHATBOT : {
    ROOT : "/chatbot"
  },

  DOCUMENT_GENERATOR: {
    DASHBOARD: "/document-generator",
    TEMPLATE: "/document-generator/template/:id",
  },

  AUTH : {
    LOGOUT : "/logout",
    FORGOT_PASSWORD : "/forgot-password",
    RESET_PASSWORD : "/reset-password",
    LOGIN : "/login"
  }
};

export default PATH;