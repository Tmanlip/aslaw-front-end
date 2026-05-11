import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Mail, AlertCircle, Stethoscope, Clipboard } from 'lucide-react';
import { templates } from '../data/templates';
import AuthMemory from '../../data/authMemory';
import '../styles/documentGenerator.css';

const iconMap = {
  Mail: Mail,
  AlertCircle: AlertCircle,
  Stethoscope: Stethoscope,
  Clipboard: Clipboard
};

const sectionConfig = [
  {
    key: "documents",
    title: "Documents",
    description: "Templates for legal documents and letters.",
  },
  {
    key: "reports",
    title: "Reports",
    description: "Templates for case reports and status summaries.",
  },
  {
    key: "invoices",
    title: "Invoices",
    description: "Templates related to cheque records and payments.",
  },
];

const normalizeCategory = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const inferCategory = (template) => {
  const explicit = normalizeCategory(template.category);
  if (["documents", "reports", "invoices"].includes(explicit)) {
    return explicit;
  }

  const id = normalizeCategory(template.id);
  const title = normalizeCategory(template.title);

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

const Dashboard = () => {
  const location = useLocation();
  const currentSearch = location.search || "";
  const currentUser = AuthMemory.getUser?.() || null;
  const currentUserRole = String(currentUser?.role || "").toLowerCase();
  const isLawyer = currentUserRole === "lawyer";

  const searchParams = new URLSearchParams(location.search);
  const filterCategory = searchParams.get("category") || null;

  const visibleSections = sectionConfig.filter((section) => {
    if (isLawyer && section.key === "invoices") return false;
    if (filterCategory && section.key !== filterCategory) return false;
    return true;
  });
  const visibleTemplates = templates.filter((template) => {
    const cat = inferCategory(template);
    if (isLawyer && cat === "invoices") return false;
    if (filterCategory && cat !== filterCategory) return false;
    return true;
  });

  const groupedTemplates = visibleSections.map((section) => ({
    ...section,
    items: visibleTemplates.filter((template) => inferCategory(template) === section.key),
  }));

  return (
    <div className="dg-page">
      <div className="dg-container">
        <div className="dg-hero">
          <h1>
            Choose the document you want to create
          </h1>
          <p>
            Select a document template below to begin creating your legal document.
          </p>
        </div>
        <div className="dg-sections">
          {groupedTemplates.map((section) => (
            <section key={section.key} className="dg-section">
              <div className="dg-section-head">
                <div>
                  <h2>
                  {section.title}
                </h2>
                  <p>
                  {section.description}
                </p>
                </div>
              </div>

              {section.items.length === 0 ? (
                <div className="dg-empty">
                  No templates available yet for {section.title}.
                </div>
              ) : (
                <div className="dg-grid">
                  {section.items.map((template) => {
                    const Icon = iconMap[template.icon] || Mail;
                    return (
                      <Link
                        key={template.id}
                        to={`/document-generator/template/${template.id}${currentSearch}`}
                        className="dg-template-card"
                      >
                        <div className="dg-template-card-main">
                          <div className="dg-template-icon">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="dg-template-title">
                            {template.title}
                          </h3>
                          <p className="dg-template-desc">
                            {template.description}
                          </p>
                        </div>
                        <div className="dg-template-foot">
                          <span>
                            Use this template &rarr;
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
