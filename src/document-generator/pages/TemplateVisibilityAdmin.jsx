import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosUser from "../../api/axiosUser";
import PATH from "../../constant/paths";
import AuthMemory from "../../data/authMemory";
import NavBarAdmin from "../../shared/Navbar/NavBar Admin/new";
import { templates } from "../data/templates";
import "../styles/documentGenerator.css";

const sectionConfig = [
  {
    key: "documents",
    title: "Documents",
  },
  {
    key: "reports",
    title: "Reports",
  },
  {
    key: "invoices",
    title: "Invoices",
  },
];

const normalizeCategory = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const inferCategory = (template) => {
  const explicit = normalizeCategory(template?.category);
  if (["documents", "reports", "invoices"].includes(explicit)) {
    return explicit;
  }

  const id = normalizeCategory(template?.id);
  const title = normalizeCategory(template?.title);

  if (id.includes("report") || title.includes("report")) {
    return "reports";
  }

  if (
    id.includes("invoice") ||
    title.includes("invoice") ||
    id.includes("cheque") ||
    id.includes("check") ||
    title.includes("cheque") ||
    title.includes("check")
  ) {
    return "invoices";
  }

  return "documents";
};

const buildDefaultVisibility = () => {
  const result = {};

  templates.forEach((template) => {
    if (template?.id) {
      result[template.id] = true;
    }
  });

  return result;
};

const TemplateVisibilityAdmin = () => {
  const currentUser = AuthMemory.getUser?.() || null;
  const role = String(currentUser?.role || "").toLowerCase();
  const isAdmin = role === "admin";

  const [visibility, setVisibility] = useState(buildDefaultVisibility);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadVisibility = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axiosUser.get("/document-generator/templates/visibility");
        if (!isActive) return;

        const serverVisibility = response?.data?.visibility;
        const base = buildDefaultVisibility();

        if (serverVisibility && typeof serverVisibility === "object") {
          Object.keys(base).forEach((templateId) => {
            if (Object.prototype.hasOwnProperty.call(serverVisibility, templateId)) {
              base[templateId] = Boolean(serverVisibility[templateId]);
            }
          });
        }

        setVisibility(base);
      } catch {
        if (!isActive) return;
        setError("Failed to load template visibility. Showing defaults.");
        setVisibility(buildDefaultVisibility());
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadVisibility();

    return () => {
      isActive = false;
    };
  }, []);

  const groupedTemplates = useMemo(() => {
    return sectionConfig.map((section) => ({
      ...section,
      items: templates.filter((template) => inferCategory(template) === section.key),
    }));
  }, []);

  const handleToggle = (templateId) => {
    setSuccess("");
    setVisibility((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await axiosUser.put("/document-generator/templates/visibility", {
        visibility,
      });
      setSuccess("Template visibility updated.");
    } catch {
      setError("Failed to save template visibility.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <>
        <NavBarAdmin />
        <div className="dg-page dg-page-admin">
          <div className="dg-container">
            <div className="dg-shell">
              <div className="dg-shell-head">
                <div>
                  <h1>Template Visibility</h1>
                  <p className="dg-shell-subtitle">Only admins can access this page.</p>
                </div>
              </div>
              <div className="dg-body">
                <Link to={PATH.DOCUMENT_GENERATOR.DASHBOARD} className="dg-link-back">
                  Back to Document Generator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBarAdmin />
      <div className="dg-page dg-page-admin">
        <div className="dg-container">
          <Link to={PATH.DOCUMENT_GENERATOR.DASHBOARD} className="dg-link-back">
            Back to Document Generator
          </Link>

          <div className="dg-shell">
            <div className="dg-shell-head">
              <div>
                <h1>Template Visibility</h1>
                <p className="dg-shell-subtitle">
                  Turn templates on or off to control whether users can see them in the document generator dashboard.
                </p>
              </div>
              <div className="dg-actions">
                <button
                  type="button"
                  className="dg-btn dg-btn-primary"
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
            <div className="dg-body">
              {error ? <div className="dg-alert-error">{error}</div> : null}
              {success ? <div className="dg-note">{success}</div> : null}

              {loading ? (
                <div className="dg-prefill-loading">
                  <div className="dg-prefill-spinner" />
                  <p>Loading template visibility...</p>
                </div>
              ) : (
                <div className="dg-visibility-list">
                  {groupedTemplates.map((section) => (
                    <section key={section.key} className="dg-section">
                      <div className="dg-section-head">
                        <h2>{section.title}</h2>
                      </div>

                      <div className="dg-visibility-grid">
                        {section.items.map((template) => {
                          const enabled = Boolean(visibility[template.id]);

                          return (
                            <label key={template.id} className="dg-visibility-item">
                              <div className="dg-visibility-item-main">
                                <span className="dg-visibility-title">{template.title}</span>
                                <span className="dg-visibility-id">{template.id}</span>
                              </div>
                              <input
                                type="checkbox"
                                className="dg-visibility-switch"
                                checked={enabled}
                                onChange={() => handleToggle(template.id)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateVisibilityAdmin;
