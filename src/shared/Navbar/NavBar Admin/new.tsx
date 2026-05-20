// src/features/Admin/Components/NavBarAdmin.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/pics/logo-landscape.png";
import menuIcon from "../../../assets/pics/menus.png";
import PATH from "../../../constant/paths";
import { LeftSection, MenuIcon, Logo } from "./style";
import SearchBar from "../../../components/SearchBar/Search";
import CustomButton from "../../../components/Button/button";
import Sidebar from "../../SideBar";
import NavbarNotifications from "../../components/NavbarNotifications";
import { useAuth } from "../../../context/AuthContext";
import { useClientData } from "../../../context/ClientDataContext";
import AuthMemory from "../../../data/authMemory";
import { apiFetch } from "../../../hooks/api"; // custom fetch wrapper
import axiosUser from "../../../api/axiosUser";

type UserRecord = {
  id: number;
  firmID?: string;
  name?: string;
  email?: string;
  role?: string;
};

type CaseRecord = {
  id: number;
  caseId?: number;
  caseNumber?: string;
  caseName?: string;
  clientName?: string;
  lawyerName?: string;
  clientFirmID?: string;
  lawyerFirmID?: string;
  blob_folder_path?: string;
  status?: string;
  encrypted_documents?: Array<{
    document_id?: number;
    file_name?: string;
    category?: "documents" | "reports" | "invoices";
    status?: string;
    created_at?: string;
  }>;
};

type InteractionLog = {
  _id?: string;
  method?: string;
  path?: string;
  status_code?: number;
  email?: string | null;
};

type DocumentMatch = {
  documentId?: number;
  fileName: string;
  category: "documents" | "reports" | "invoices";
  status?: string;
  caseItem: CaseRecord;
};

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

const containsQuery = (value: unknown, query: string): boolean => {
  if (!query) return false;
  return normalize(value).includes(query);
};

const NavBarAdmin: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingSearchData, setLoadingSearchData] = useState(false);
  const [searchDataError, setSearchDataError] = useState("");
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [allLogs, setAllLogs] = useState<InteractionLog[]>([]);
  const [hasFetchedSearchData, setHasFetchedSearchData] = useState(false);

  const { logout, role } = useAuth();
  const { setUserData } = useClientData();
  const navigate = useNavigate();
  const adminPathGroup =
    role === "junioradmin"
      ? PATH.JUNIOR_ADMIN
      : role === "adminstaff"
      ? PATH.ADMIN_STAFF
      : PATH.ADMIN;
  const canAccessLogs = role === "admin";
  const desktopSearchWrapRef = useRef<HTMLDivElement | null>(null);
  const sidebarSearchWrapRef = useRef<HTMLDivElement | null>(null);

  const query = searchValue.trim();
  const queryNormalized = normalize(query);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const isInsideDesktop = desktopSearchWrapRef.current?.contains(targetNode);
      const isInsideSidebar = sidebarSearchWrapRef.current?.contains(targetNode);

      if (!isInsideDesktop && !isInsideSidebar) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const shouldFetch = queryNormalized.length >= 2 && !hasFetchedSearchData;
    if (!shouldFetch) return;

    const fetchSearchData = async () => {
      setLoadingSearchData(true);
      setSearchDataError("");

      try {
        const requests = [
          axiosUser.get(`${process.env.REACT_APP_API_URL}/users`),
          axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`),
        ];

        if (canAccessLogs) {
          requests.push(axiosUser.get(`${process.env.REACT_APP_API_URL}/logs/interactions?limit=120`));
        }

        const [usersRes, casesRes, logsRes] = await Promise.all(requests);

        const usersData = Array.isArray(usersRes.data)
          ? usersRes.data
          : Array.isArray(usersRes.data?.data)
          ? usersRes.data.data
          : [];

        const casesData = Array.isArray(casesRes.data)
          ? casesRes.data
          : Array.isArray(casesRes.data?.data)
          ? casesRes.data.data
          : [];

        const logsData = canAccessLogs
          ? Array.isArray((logsRes as any)?.data?.data)
            ? (logsRes as any).data.data
            : Array.isArray((logsRes as any)?.data)
            ? (logsRes as any).data
            : []
          : [];

        setAllUsers(usersData);
        setAllCases(casesData);
        setAllLogs(logsData);
        setHasFetchedSearchData(true);
      } catch (error) {
        console.error("Failed to load navbar search data", error);
        setSearchDataError("Unable to load results. Please try again.");
      } finally {
        setLoadingSearchData(false);
      }
    };

    void fetchSearchData();
  }, [hasFetchedSearchData, queryNormalized, role]);

  const matchedUsers = useMemo(() => {
    if (queryNormalized.length < 2) return [];
    return allUsers.filter((user) =>
      [user.name, user.email, user.firmID, user.role].some((field) => containsQuery(field, queryNormalized))
    );
  }, [allUsers, queryNormalized]);

  const matchedCases = useMemo(() => {
    if (queryNormalized.length < 2) return [];

    const userTokens = new Set<string>();
    matchedUsers.forEach((user) => {
      const nameToken = normalize(user.name);
      const firmToken = normalize(user.firmID);
      if (nameToken) userTokens.add(nameToken);
      if (firmToken) userTokens.add(firmToken);
    });

    return allCases.filter((item) => {
      const directMatch = [
        item.caseName,
        item.caseNumber,
        item.clientName,
        item.lawyerName,
        item.status,
      ].some((field) => containsQuery(field, queryNormalized));

      if (directMatch) return true;

      const clientName = normalize(item.clientName);
      const lawyerName = normalize(item.lawyerName);
      return Array.from(userTokens).some(
        (token) => token && [clientName, lawyerName].some((field) => field.includes(token))
      );
    });
  }, [allCases, matchedUsers, queryNormalized]);

  const matchedLogs = useMemo(() => {
    if (queryNormalized.length < 2) return [];
    return allLogs.filter((log) =>
      [log.email, log.path, log.method, String(log.status_code || "")].some((field) =>
        containsQuery(field, queryNormalized)
      )
    );
  }, [allLogs, queryNormalized]);

  const matchedDocuments = useMemo(() => {
    if (queryNormalized.length < 2) return [];

    const documentResults: DocumentMatch[] = [];

    allCases.forEach((caseItem) => {
      const docs = Array.isArray(caseItem.encrypted_documents) ? caseItem.encrypted_documents : [];

      docs.forEach((doc) => {
        const category = (doc.category || "documents") as "documents" | "reports" | "invoices";
        const fileName = String(doc.file_name || "");
        const status = String(doc.status || "");
        const caseName = caseItem.caseName || caseItem.caseNumber || `CASE-${caseItem.id}`;

        const isMatch = [
          fileName,
          category,
          status,
          caseName,
          caseItem.clientName,
          caseItem.lawyerName,
          caseItem.clientFirmID,
          caseItem.lawyerFirmID,
        ].some((field) => containsQuery(field, queryNormalized));

        if (isMatch) {
          documentResults.push({
            documentId: doc.document_id,
            fileName,
            category,
            status,
            caseItem,
          });
        }
      });
    });

    return documentResults;
  }, [allCases, queryNormalized]);

  const shouldRenderResults = showSearchResults && queryNormalized.length >= 2;

  const handleSearch = () => {
    if (queryNormalized.length < 2) return;
    setShowSearchResults(true);
    setShowSidebar(false);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchValue(value);
    setShowSearchResults(value.trim().length >= 2);
  };

  const openUsersPage = () => {
    navigate(`${adminPathGroup.MANAGE_USER}?search=${encodeURIComponent(query)}`);
    setShowSearchResults(false);
  };

  const openCasesPage = () => {
    navigate(`${adminPathGroup.MANAGE_CASE}?search=${encodeURIComponent(query)}`);
    setShowSearchResults(false);
  };

  const getLockManageUserByCaseAndQuery = (caseItem: CaseRecord): boolean => {
    const isLawyerMatch = [caseItem.lawyerName, caseItem.lawyerFirmID].some((field) =>
      containsQuery(field, queryNormalized)
    );
    const isClientMatch = [caseItem.clientName, caseItem.clientFirmID].some((field) =>
      containsQuery(field, queryNormalized)
    );

    return isLawyerMatch && !isClientMatch;
  };

  const openLogsPage = () => {
    if (!canAccessLogs) return;
    navigate(`${PATH.ADMIN.LOGS}?search=${encodeURIComponent(query)}`);
    setShowSearchResults(false);
  };

  const openLogsFromActivity = (log: InteractionLog) => {
    if (!canAccessLogs) return;

    const token = [
      (log.method || "").toUpperCase(),
      log.path || "",
      log.email || "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const targetQuery = token || query;
    navigate(`${PATH.ADMIN.LOGS}?search=${encodeURIComponent(targetQuery)}`);
    setShowSearchResults(false);
  };

  const openManageProfileFromUser = async (user: UserRecord) => {
    if (!user.firmID || !user.role) {
      navigate(adminPathGroup.MANAGE_PROFILE);
      setShowSearchResults(false);
      return;
    }

    try {
      if (user.role === "client") {
        const response = await axiosUser.get(`${process.env.REACT_APP_API_URL}/clients/${user.firmID}`);
        const { client, cases } = response.data;
        setUserData(client, cases || []);
      } else if (user.role === "lawyer") {
        const response = await axiosUser.get(`${process.env.REACT_APP_API_URL}/lawyers/${user.firmID}`);
        const { lawyer, cases } = response.data;
        setUserData(lawyer, cases || []);
      } else {
        const response = await axiosUser.get(`${process.env.REACT_APP_API_URL}/admins/${user.firmID}`);
        const { admin, cases } = response.data;
        setUserData(admin, cases || []);
      }
    } catch (error) {
      console.error("Failed to prepare user profile data from search result", error);
    } finally {
      navigate(adminPathGroup.MANAGE_PROFILE);
      setShowSearchResults(false);
    }
  };

  const openBillingFromCase = (caseItem: CaseRecord) => {
    if (role !== "admin") {
      openCasesPage();
      return;
    }

    const lockManageUser = getLockManageUserByCaseAndQuery(caseItem);
    const resolvedCaseId = Number(caseItem.caseId ?? caseItem.id);

    navigate(PATH.ADMIN.BILLING, {
      state: {
        selectedCase: {
          ...caseItem,
          caseId: Number.isFinite(resolvedCaseId) ? resolvedCaseId : caseItem.id,
          title: caseItem.caseName || caseItem.caseNumber || `CASE-${caseItem.id}`,
        },
        lockManageUser,
      },
    });

    setShowSearchResults(false);
  };

  const openBillingFromDocument = (documentMatch: DocumentMatch) => {
    if (!(role === "admin" || role === "adminstaff")) {
      openCasesPage();
      return;
    }

    const { caseItem, category } = documentMatch;
    const lockManageUser = getLockManageUserByCaseAndQuery(caseItem);
    const resolvedCaseId = Number(caseItem.caseId ?? caseItem.id);
    const billingPath = role === "adminstaff" ? PATH.ADMIN_STAFF.BILLING : PATH.ADMIN.BILLING;

    navigate(billingPath, {
      state: {
        selectedCase: {
          ...caseItem,
          caseId: Number.isFinite(resolvedCaseId) ? resolvedCaseId : caseItem.id,
          title: caseItem.caseName || caseItem.caseNumber || `CASE-${caseItem.id}`,
        },
        lockManageUser,
        activeFileSection: category,
      },
    });

    setShowSearchResults(false);
  };

  const openDocumentsPage = () => {
    if ((role === "admin" || role === "adminstaff") && matchedDocuments.length > 0) {
      openBillingFromDocument(matchedDocuments[0]);
      return;
    }

    navigate(`${adminPathGroup.MANAGE_CASE}?search=${encodeURIComponent(query)}`);
    setShowSearchResults(false);
  };

  const renderSearchResultsPanel = () => {
    if (!shouldRenderResults) return null;

    return (
      <div className="aslaw-navbar-search-results" role="listbox" aria-label="Search results">
        {loadingSearchData && (
          <div className="aslaw-navbar-search-state">
            <Spinner animation="border" size="sm" />
            <span>Searching...</span>
          </div>
        )}

        {!loadingSearchData && searchDataError && (
          <p className="aslaw-navbar-search-error">{searchDataError}</p>
        )}

        {!loadingSearchData && !searchDataError && (
          <>
            <div className="aslaw-navbar-search-summary">
              <span>{matchedUsers.length} users</span>
              <span>{matchedCases.length} cases</span>
              <span>{matchedDocuments.length} documents</span>
              {canAccessLogs && <span>{matchedLogs.length} activities</span>}
            </div>

            <div className="aslaw-navbar-search-section">
              <div className="aslaw-navbar-search-section-head">
                <h6>Users</h6>
                <button type="button" onClick={openUsersPage}>Open</button>
              </div>
              <ul>
                {matchedUsers.slice(0, 3).map((user) => (
                    <li key={user.id}>
                      <button type="button" className="aslaw-navbar-search-item-btn" onClick={() => void openManageProfileFromUser(user)}>
                        <strong>{user.name || "-"}</strong>
                        <p>{user.email || "-"}</p>
                      </button>
                    </li>
                ))}
                {matchedUsers.length === 0 && <li className="empty">No user matches.</li>}
              </ul>
            </div>

            <div className="aslaw-navbar-search-section">
              <div className="aslaw-navbar-search-section-head">
                <h6>Cases</h6>
                <button type="button" onClick={openCasesPage}>Open</button>
              </div>
              <ul>
                {matchedCases.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <button type="button" className="aslaw-navbar-search-item-btn" onClick={() => openBillingFromCase(item)}>
                        <strong>{item.caseName || item.caseNumber || `CASE-${item.id}`}</strong>
                        <p>{item.clientName || "-"} vs {item.lawyerName || "-"}</p>
                      </button>
                    </li>
                ))}
                {matchedCases.length === 0 && <li className="empty">No case matches.</li>}
              </ul>
            </div>

            <div className="aslaw-navbar-search-section">
              <div className="aslaw-navbar-search-section-head">
                <h6>Documents</h6>
                <button type="button" onClick={openDocumentsPage}>Open</button>
              </div>
              <ul>
                {matchedDocuments.slice(0, 3).map((documentMatch, index) => (
                    <li key={`${documentMatch.documentId || documentMatch.fileName}-${index}`}>
                      <button
                        type="button"
                        className="aslaw-navbar-search-item-btn"
                        onClick={() => openBillingFromDocument(documentMatch)}
                      >
                        <strong>{documentMatch.fileName || "Unnamed document"}</strong>
                        <p>
                          {(documentMatch.caseItem.caseName || documentMatch.caseItem.caseNumber || `CASE-${documentMatch.caseItem.id}`)}
                          {` • ${documentMatch.category}`}
                        </p>
                      </button>
                    </li>
                ))}
                {matchedDocuments.length === 0 && <li className="empty">No document matches.</li>}
              </ul>
            </div>

            {canAccessLogs && (
              <div className="aslaw-navbar-search-section">
                <div className="aslaw-navbar-search-section-head">
                  <h6>Activities</h6>
                  <button type="button" onClick={openLogsPage}>Open</button>
                </div>
                <ul>
                  {matchedLogs.slice(0, 3).map((log, index) => (
                    <li key={log._id || `${log.path || "log"}-${index}`}>
                      <button type="button" className="aslaw-navbar-search-item-btn" onClick={() => openLogsFromActivity(log)}>
                        <strong>{(log.method || "GET").toUpperCase()} {log.path || "-"}</strong>
                        <p>{log.email || "Unknown actor"}</p>
                      </button>
                    </li>
                  ))}
                  {matchedLogs.length === 0 && <li className="empty">No activity matches.</li>}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1️⃣ Get the stored token from AuthMemory
      const token = AuthMemory.getToken(); // assuming you store it after login

      // 2️⃣ Call backend logout to revoke the token
      await apiFetch("/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`, // include token
        },
      });

    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // 3️⃣ Clear memory-only auth
      AuthMemory.clear();

      // 4️⃣ Clear auth context
      logout();

      // 5️⃣ Redirect to login page
      navigate("/");

      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Navbar */}
      <Navbar
        className="aslaw-metis-navbar"
        expand="lg"
      >
        <Container
          fluid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left Section: Hamburger + Logo */}
          <LeftSection className="aslaw-metis-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="aslaw-metis-menu-btn" role="button" tabIndex={0} onClick={toggleSidebar}>
              <MenuIcon src={menuIcon} alt="Menu" style={{ cursor: "pointer" }} />
            </span>
            <Navbar.Brand href={adminPathGroup.DASHBOARD} className="aslaw-metis-logo-wrap">
              <Logo src={logo} alt="Logo" />
            </Navbar.Brand>

            {/* SearchBar: visible on md+ screens */}
            <div
              className="d-none d-md-block aslaw-metis-search aslaw-metis-search-with-results"
              style={{ marginLeft: "1rem" }}
              ref={desktopSearchWrapRef}
            >
              <SearchBar
                value={searchValue}
                onChange={handleSearchInputChange}
                onSearch={handleSearch}
                placeholder="Search here..."
                buttonLabel="Search"
              />
              {renderSearchResultsPanel()}
            </div>
          </LeftSection>

          {/* Right-side Logout button */}
          <Nav className="aslaw-metis-right">
            <NavbarNotifications
              scopeKey={
                role === "junioradmin"
                  ? "junioradmin"
                  : role === "adminstaff"
                  ? "adminstaff"
                  : "admin"
              }
              targetPath={adminPathGroup.SCHEDULE_MEETING}
            />
            <CustomButton
              customColor="darkSilver"
              size="lg"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="aslaw-metis-logout"
            >
              {isLoggingOut ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </CustomButton>
          </Nav>
        </Container>
      </Navbar>

      {/* Sidebar */}
      <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)}>
        {/* Optional: SearchBar inside sidebar on small screens */}
        <div
          className="d-md-none aslaw-sidebar-search aslaw-metis-search-with-results"
          style={{ marginBottom: "1rem" }}
          ref={sidebarSearchWrapRef}
        >
          <SearchBar
            value={searchValue}
            onChange={handleSearchInputChange}
            onSearch={handleSearch}
            placeholder="Search here..."
            buttonLabel="Search"
          />
          {renderSearchResultsPanel()}
        </div>
      </Sidebar>
    </>
  );
};

export default NavBarAdmin;