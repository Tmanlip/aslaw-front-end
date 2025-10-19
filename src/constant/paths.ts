const PATH = {
  ADMIN : {
    ROOT : "/admin",
    DASHBOARD : "/admin/dashboard",
    BILLING : "/admin/billing",
    MANAGE_CASE : "/admin/manage_case",
    ASSIGN_CASE : "/admin/manage_case/assign_case",
    EDIT_CASE : "/admin/manage_case/edit_case",
    MANAGE_USER : "/admin/manage_user/manage",
    MANAGE_PROFILE : "/admin/manage_user/manage_profile",
    REGISTER_USER : "/admin/manage_user/register",
    CHATBOT : "/admin/chatbot"
  },

  CLIENT : {
    ROOT : "/client",
    DASHBOARD : "/client/dashboard",
    MY_PROFILE : "/client/myprofile",
    VIEW_CASE : "/client/view_case",
    CHATBOT : "/client/chatbot"
  },

  LAWYER : {
    ROOT : "/lawyer",
    DASHBOARD : "/lawyer/dashboard",
    UPDATE_CASE : "/lawyer/update_case",
    MY_PROFILE : "/lawyer/my_profile",
    CHATBOT : "/client/chatbot"
  },

  CHATBOT : {
    ROOT : "/chatbot"
  },

  AUTH : {
    LOGOUT : "/logout"
  }
};

export default PATH;