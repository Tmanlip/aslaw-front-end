import React, { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Spinner from "react-bootstrap/Spinner";
import logo from "../../../assets/pics/logo-landscape.png";
import menuIcon from "../../../assets/pics/menus.png";
import { LeftSection, MenuIcon, Logo } from "./style";
import SearchBar from "../../../components/SearchBar/Search";
import CustomButton from "../../../components/Button/button";
import Sidebar from "../../SideBar";
import NavbarNotifications from "../../components/NavbarNotifications";
import { useNavigate } from "react-router-dom";
import PATH from "../../../constant/paths";
import { useAuth } from "../../../context/AuthContext";
import AuthMemory from "../../../data/authMemory";
import { apiFetch } from "../../../hooks/api";
import { fetchLawyerFullData } from "../../../hooks/lawyerApi";

type LawyerCase = {
  caseId?: number;
  title?: string;
  caseName?: string;
  caseNumber?: string;
  description?: string;
  status?: string;
  clientName?: string;
  lawyerName?: string;
  encrypted_documents?: Array<{
    document_id?: string;
    file_name?: string;
    category?: "documents" | "reports" | "invoices";
    status?: string;
  }>;
};

type DocumentMatch = {
  documentId?: string;
  fileName: string;
  category: "documents" | "reports" | "invoices";
  caseItem: LawyerCase;
};

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

const containsQuery = (value: unknown, query: string): boolean => {
  if (!query) return false;
  return normalize(value).includes(query);
};

const NavBarLawyer: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingSearchData, setLoadingSearchData] = useState(false);
  const [searchDataError, setSearchDataError] = useState("");
  const [cases, setCases] = useState<LawyerCase[]>([]);

  const { logout } = useAuth();
  const navigate = useNavigate();
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
    if (queryNormalized.length < 2) return;

    const firmID = AuthMemory.getUser()?.firmID;
    if (!firmID) return;

    const fetchData = async () => {
      setLoadingSearchData(true);
      setSearchDataError("");

      try {
        const response = await fetchLawyerFullData(firmID);
        setCases(Array.isArray(response?.cases) ? response.cases : []);
      } catch (error) {
        console.error("Failed to load lawyer search data", error);
        setSearchDataError("Unable to load search results.");
      } finally {
        setLoadingSearchData(false);
      }
    };

    void fetchData();
  }, [queryNormalized]);

  const matchedCases = useMemo(() => {
    if (queryNormalized.length < 2) return [];

    return cases.filter((item) =>
      [
        item.title,
        item.caseName,
        item.caseNumber,
        item.description,
        item.status,
        item.clientName,
        item.lawyerName,
      ].some((field) => containsQuery(field, queryNormalized))
    );
  }, [cases, queryNormalized]);

  const matchedDocuments = useMemo(() => {
    if (queryNormalized.length < 2) return [];

    const documentResults: DocumentMatch[] = [];
    cases.forEach((caseItem) => {
      const docs = Array.isArray(caseItem.encrypted_documents) ? caseItem.encrypted_documents : [];
      docs.forEach((doc) => {
        const category = (doc.category || "documents") as "documents" | "reports" | "invoices";
        const fileName = String(doc.file_name || "");
        const caseLabel = caseItem.title || caseItem.caseName || caseItem.caseNumber || `CASE-${caseItem.caseId || "-"}`;

        const isMatch = [fileName, category, caseLabel, caseItem.clientName].some((field) =>
          containsQuery(field, queryNormalized)
        );

        if (isMatch) {
          documentResults.push({
            documentId: doc.document_id,
            fileName,
            category,
            caseItem,
          });
        }
      });
    });

    return documentResults;
  }, [cases, queryNormalized]);

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

  const openUpdateCase = (caseItem: LawyerCase, activeFileSection?: "documents" | "reports" | "invoices") => {
    const resolvedCaseId = Number(caseItem.caseId);
    navigate(PATH.LAWYER.UPDATE_CASE, {
      state: {
        selectedCaseId: Number.isFinite(resolvedCaseId) ? resolvedCaseId : null,
        activeFileSection,
      },
    });
    setShowSearchResults(false);
  };

  const openCasesPage = () => {
    navigate(`${PATH.LAWYER.UPDATE_CASE}?search=${encodeURIComponent(query)}`);
    setShowSearchResults(false);
  };

  const renderSearchResultsPanel = () => {
    if (!shouldRenderResults) return null;

    return (
      <div className="aslaw-navbar-search-results" role="listbox" aria-label="Lawyer search results">
        {loadingSearchData && (
          <div className="aslaw-navbar-search-state">
            <Spinner animation="border" size="sm" />
            <span>Searching...</span>
          </div>
        )}

        {!loadingSearchData && searchDataError && <p className="aslaw-navbar-search-error">{searchDataError}</p>}

        {!loadingSearchData && !searchDataError && (
          <>
            <div className="aslaw-navbar-search-summary">
              <span>{matchedCases.length} cases</span>
              <span>{matchedDocuments.length} documents</span>
            </div>

            <div className="aslaw-navbar-search-section">
              <div className="aslaw-navbar-search-section-head">
                <h6>Cases</h6>
                <button type="button" onClick={openCasesPage}>Open</button>
              </div>
              <ul>
                {matchedCases.slice(0, 4).map((item, index) => (
                  <li key={`${item.caseId || index}-case`}>
                    <button type="button" className="aslaw-navbar-search-item-btn" onClick={() => openUpdateCase(item)}>
                      <strong>{item.title || item.caseName || item.caseNumber || `CASE-${item.caseId || "-"}`}</strong>
                      <p>{item.clientName || "-"}</p>
                    </button>
                  </li>
                ))}
                {matchedCases.length === 0 && <li className="empty">No case matches.</li>}
              </ul>
            </div>

            <div className="aslaw-navbar-search-section">
              <div className="aslaw-navbar-search-section-head">
                <h6>Documents</h6>
                <button type="button" onClick={openCasesPage}>Open</button>
              </div>
              <ul>
                {matchedDocuments.slice(0, 4).map((doc, index) => (
                  <li key={`${doc.documentId || doc.fileName}-${index}`}>
                    <button
                      type="button"
                      className="aslaw-navbar-search-item-btn"
                      onClick={() => openUpdateCase(doc.caseItem, doc.category)}
                    >
                      <strong>{doc.fileName || "Unnamed document"}</strong>
                      <p>{(doc.caseItem.title || doc.caseItem.caseName || `CASE-${doc.caseItem.caseId || "-"}`)} • {doc.category}</p>
                    </button>
                  </li>
                ))}
                {matchedDocuments.length === 0 && <li className="empty">No document matches.</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);

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
      navigate("/login");

      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Navbar
        className="aslaw-metis-navbar"
        expand="lg"
      >
        <Container
          fluid
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <LeftSection className="aslaw-metis-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="aslaw-metis-menu-btn" role="button" tabIndex={0} onClick={toggleSidebar}>
              <MenuIcon src={menuIcon} alt="Menu" style={{ cursor: "pointer" }} />
            </span>
            <Navbar.Brand href={PATH.LAWYER.DASHBOARD} className="aslaw-metis-logo-wrap">
              <Logo src={logo} alt="Logo" />
            </Navbar.Brand>

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

          <Nav className="aslaw-metis-right">
            <NavbarNotifications scopeKey="lawyer" targetPath={PATH.LAWYER.SCHEDULE_MEETING} />
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

      <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)}>
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

export default NavBarLawyer;