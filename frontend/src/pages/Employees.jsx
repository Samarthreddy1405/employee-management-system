import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    activateEmployee,
    getEmployeesByOrganization,
    getEmployee,
} from "../api/apiService";
import {
    DEPT_DESIG_MAP,
    ALL_DEPARTMENTS,
    ALL_DESIGNATIONS,
} from "../constants/appData";
import {
    loadOrganizations,
    resolveOrgName,
    resolveOrgId,
} from "../data/organizationData";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];

const SKILLS_OPTIONS = [
    "JavaScript", "TypeScript", "React", "Vue", "Angular",
    "Node.js", "Python", "Java", "Spring Boot", "SQL",
    "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS",
    "Git", "REST APIs", "GraphQL", "HTML/CSS", "Linux",
];

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PHOTO_SIZE_MB   = 2;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Avatar helpers
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#10b981","#06b6d4","#ef4444","#eab308"];
function avatarColor(name = "") {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name = "") {
    const p = name.trim().split(/\s+/);
    if (!p[0]) return "?";
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const Icon = {
    Search:     ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>),
    Filter:     ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.033a.75.75 0 01-.34.635l-2.5 1.666A.75.75 0 018 17.25v-5.57a2.25 2.25 0 00-.659-1.591L2.659 5.408A2.25 2.25 0 012 3.818V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" /></svg>),
    Chevron:    ({ s = 12, up = false }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor" style={{ transform: up ? "rotate(180deg)" : "none", transition: "transform .18s" }}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>),
    Plus:       ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>),
    Edit:       ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>),
    Power:      ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 0110 2zM5.404 4.343a.75.75 0 010 1.06 6.5 6.5 0 109.192 0 .75.75 0 111.06-1.06 8 8 0 11-11.313 0 .75.75 0 011.06 0z" clipRule="evenodd" /></svg>),
    Users:      ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    UserCheck:  ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>),
    UserX:      ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="23" y2="14" /><line x1="23" y1="8" x2="17" y2="14" /></svg>),
    Eye:        ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
    Alert:      ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>),
    EmptyState: () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    X:          ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
    Mail:       ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>),
    Phone:      ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.93 12 19.79 19.79 0 0 1 1.93 3.4 2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>),
    Building:   ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>),
    Briefcase:  ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>),
    Globe:      ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>),
    Upload:     ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>),
    Tag:        ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>),
};

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────
function Pagination({ total, page, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1 && total <= pageSize) return null;
    const start = (page - 1) * pageSize + 1;
    const end   = Math.min(page * pageSize, total);

    function pageNumbers() {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 4)              return [1, 2, 3, 4, 5, "…", totalPages];
        if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "…", page - 1, page, page + 1, "…", totalPages];
    }

    return (
        <div className="pagination-bar">
            <span className="pagination-info">Showing {start}–{end} of {total} employees</span>
            <div className="pagination-controls">
                <button className="pg-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
                    <svg width={13} height={13} viewBox="0 0 20 20" fill="currentColor" style={{ transform: "rotate(90deg)" }}>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </button>
                {pageNumbers().map((p, i) =>
                    p === "…"
                        ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--text-muted)", fontSize: 13 }}>…</span>
                        : <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => onChange(p)} aria-current={page === p ? "page" : undefined}>{p}</button>
                )}
                <button className="pg-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
                    <svg width={13} height={13} viewBox="0 0 20 20" fill="currentColor" style={{ transform: "rotate(-90deg)" }}>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Dropdown for filter panel (single-select)
// ─────────────────────────────────────────────────────────────────────────────
function DepartmentDropdown({ value, onChange, options, placeholder = "All Departments" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <button type="button" className="custom-dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox" aria-expanded={isOpen}>
                <span>{value || placeholder}</span>
                <Icon.Chevron s={12} up={isOpen} />
            </button>
            {isOpen && (
                <div className="custom-dropdown-menu" role="listbox">
                    <div className={`custom-dropdown-item ${!value ? 'selected' : ''}`}
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        role="option" aria-selected={!value}>{placeholder}</div>
                    {options.map(option => (
                        <div key={option}
                            className={`custom-dropdown-item ${value === option ? 'selected' : ''}`}
                            onClick={() => { onChange(option); setIsOpen(false); }}
                            role="option" aria-selected={value === option}>{option}</div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Designation Dropdown — filter panel (multi-select with checkboxes)
// ─────────────────────────────────────────────────────────────────────────────
function DesignationDropdown({ value = [], onChange, options, placeholder = "All Designations" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const displayValue = value.length === 0 ? placeholder
        : value.length === 1 ? value[0]
        : `${value.length} selected`;

    const handleOptionToggle = (option) => {
        onChange(value.includes(option) ? value.filter(v => v !== option) : [...value, option]);
    };

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <button type="button" className="custom-dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox" aria-expanded={isOpen}>
                <span>{displayValue}</span>
                <Icon.Chevron s={12} up={isOpen} />
            </button>
            {isOpen && (
                <div className="custom-dropdown-menu designation-dropdown-menu" role="listbox">
                    {value.length > 0 && (
                        <>
                            <div className="designation-dropdown-header">
                                <span className="designation-selected-count">{value.length} selected</span>
                                <button type="button" className="designation-clear-button" onClick={() => onChange([])}>Clear</button>
                            </div>
                            <div className="custom-dropdown-divider" />
                        </>
                    )}
                    {options.map(option => (
                        <label key={option} className="custom-dropdown-checkbox-item"
                            role="option" aria-selected={value.includes(option)}>
                            <input type="checkbox"
                                checked={value.includes(option)}
                                onChange={() => handleOptionToggle(option)}
                                className="custom-checkbox" />
                            <span className="custom-checkbox-label">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillsDropdown — NEW: multi-select with predefined options + custom tags
// Used inside EmployeeModal
// ─────────────────────────────────────────────────────────────────────────────
function SkillsDropdown({ value = [], onChange }) {
    const [isOpen,    setIsOpen]    = useState(false);
    const [customVal, setCustomVal] = useState("");
    const dropdownRef = useRef(null);
    const inputRef    = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggle = (skill) => {
        onChange(value.includes(skill) ? value.filter(s => s !== skill) : [...value, skill]);
    };

    const addCustom = () => {
        const trimmed = customVal.trim();
        if (!trimmed || value.includes(trimmed)) { setCustomVal(""); return; }
        onChange([...value, trimmed]);
        setCustomVal("");
    };

    const handleCustomKeyDown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); addCustom(); }
        if (e.key === "Escape") { setIsOpen(false); }
    };

    const removeTag = (skill) => onChange(value.filter(s => s !== skill));

    const triggerLabel = value.length === 0 ? "Select skills…"
        : value.length <= 2 ? value.join(", ")
        : `${value[0]}, ${value[1]} +${value.length - 2} more`;

    return (
        <div className="skills-dropdown" ref={dropdownRef}>
            {/* Trigger */}
            <button
                type="button"
                className={`skills-trigger${isOpen ? " open" : ""}${value.length > 0 ? " has-value" : ""}`}
                onClick={() => { setIsOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 60); }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <Icon.Tag s={13} />
                <span className="skills-trigger-label">{triggerLabel}</span>
                {value.length > 0 && (
                    <span className="skills-badge">{value.length}</span>
                )}
                <Icon.Chevron s={11} up={isOpen} />
            </button>

            {/* Tag pills below trigger */}
            {value.length > 0 && (
                <div className="skills-tags-row" aria-label="Selected skills">
                    {value.map(skill => (
                        <span key={skill} className="skill-tag">
                            {skill}
                            <button
                                type="button"
                                className="skill-tag-remove"
                                onClick={() => removeTag(skill)}
                                aria-label={`Remove ${skill}`}
                            >×</button>
                        </span>
                    ))}
                </div>
            )}

            {/* Dropdown panel */}
            {isOpen && (
                <div className="skills-panel" role="listbox" aria-multiselectable="true">
                    {/* Custom skill input */}
                    <div className="skills-custom-row">
                        <input
                            ref={inputRef}
                            type="text"
                            className="skills-custom-input"
                            placeholder="Type a custom skill…"
                            value={customVal}
                            onChange={e => setCustomVal(e.target.value)}
                            onKeyDown={handleCustomKeyDown}
                            maxLength={50}
                            autoComplete="off"
                            aria-label="Add custom skill"
                        />
                        <button
                            type="button"
                            className="skills-add-btn"
                            onClick={addCustom}
                            disabled={!customVal.trim()}
                            aria-label="Add skill"
                        >Add</button>
                    </div>
                    <div className="skills-divider" />
                    {/* Predefined list */}
                    <div className="skills-list">
                        {SKILLS_OPTIONS.map(skill => {
                            const checked = value.includes(skill);
                            return (
                                <label key={skill}
                                    className={`skills-option${checked ? " checked" : ""}`}
                                    role="option" aria-selected={checked}>
                                    <input
                                        type="checkbox"
                                        className="skills-checkbox"
                                        checked={checked}
                                        onChange={() => toggle(skill)}
                                    />
                                    <span className="skills-option-label">{skill}</span>
                                </label>
                            );
                        })}
                    </div>
                    {value.length > 0 && (
                        <div className="skills-footer">
                            <span className="skills-count">{value.length} selected</span>
                            <button type="button" className="skills-clear-btn" onClick={() => onChange([])}>Clear all</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ViewModal — fetches full employee details via GET /employees/{id}
// ─────────────────────────────────────────────────────────────────────────────
function ViewModal({ employeeId, onClose }) {
    const [emp,     setEmp]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function fetchEmployee() {
            setLoading(true); setError("");
            try {
                const data = await getEmployee(employeeId);
                if (!cancelled) setEmp(data);
            } catch (err) {
                if (!cancelled) setError(err.message || "Failed to load employee details.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchEmployee();
        return () => { cancelled = true; };
    }, [employeeId]);

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [onClose]);

    const color = emp ? avatarColor(emp.name || "") : "#3b82f6";

    return (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-labelledby="view-modal-title">
            <div className="modal modal--view">
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon"><Icon.Eye s={16} /></div>
                        <div>
                            <div className="modal-title" id="view-modal-title">Employee Details</div>
                            <div className="modal-subtitle">Read-only employee information</div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
                </div>

                <div className="modal-body">
                    {loading && (
                        <div className="state-block" style={{ padding: "40px 0" }}>
                            <div className="spinner" aria-label="Loading" />
                            <p>Loading employee details…</p>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="error-banner" role="alert" style={{ marginBottom: 0 }}>
                            <Icon.Alert s={15} /><span>{error}</span>
                        </div>
                    )}
                    {!loading && !error && emp && (
                        <div className="view-emp-body">
                            <div className="view-emp-hero">
                                <div className="view-emp-avatar" style={{ background: color }}>{initials(emp.name)}</div>
                                <div className="view-emp-hero-info">
                                    <div className="view-emp-name">{emp.name || "—"}</div>
                                    <div className="view-emp-role">
                                        {[emp.designation, emp.department].filter(Boolean).join(" · ") || "—"}
                                    </div>
                                    <span className={`badge ${emp.isActive ? "badge-active" : "badge-inactive"}`} style={{ marginTop: 6 }}>
                                        {emp.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                            <div className="view-emp-fields">
                                <div className="view-field">
                                    <span className="view-field-icon">#</span>
                                    <div className="view-field-body">
                                        <span className="view-field-label">Employee ID</span>
                                        <span className="view-field-value" style={{ fontFamily: "monospace", fontSize: "13px" }}>{emp.id}</span>
                                    </div>
                                </div>
                                <div className="view-field">
                                    <span className="view-field-icon"><Icon.Mail s={14} /></span>
                                    <div className="view-field-body">
                                        <span className="view-field-label">Email</span>
                                        <span className="view-field-value">{emp.email || "—"}</span>
                                    </div>
                                </div>
                                <div className="view-field">
                                    <span className="view-field-icon"><Icon.Phone s={14} /></span>
                                    <div className="view-field-body">
                                        <span className="view-field-label">Phone</span>
                                        <span className="view-field-value">{emp.phone || "—"}</span>
                                    </div>
                                </div>
                                <div className="view-field">
                                    <span className="view-field-icon"><Icon.Building s={14} /></span>
                                    <div className="view-field-body">
                                        <span className="view-field-label">Department</span>
                                        <span className="view-field-value">{emp.department || "—"}</span>
                                    </div>
                                </div>
                                <div className="view-field">
                                    <span className="view-field-icon"><Icon.Briefcase s={14} /></span>
                                    <div className="view-field-body">
                                        <span className="view-field-label">Designation</span>
                                        <span className="view-field-value">{emp.designation || "—"}</span>
                                    </div>
                                </div>
                                <div className="view-field">
                                    <span className="view-field-icon"><Icon.Globe s={14} /></span>
                                    <div className="view-field-body">
                                        <span className="view-field-label">Organization</span>
                                        <span className="view-field-value">{resolveOrgName(emp.orgId)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeModal — Add / Edit
// Includes NEW fields: employment type (radio), date of birth, date of joining,
// skills (multi-select), profile photo (file upload)
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeModal({ editingId, formData, onChange, onSubmit, onClose, orgOptions }) {
    const isEdit = Boolean(editingId);

    // ── local metadata state ─────────────────────────────────────────────────
    const [employeeType,  setEmployeeType]  = useState(formData.employeeType  || "");
    const [dateOfBirth,   setDateOfBirth]   = useState(formData.dateOfBirth   || "");
    const [dateOfJoining, setDateOfJoining] = useState(formData.dateOfJoining || "");
    const [skills,        setSkills]        = useState(formData.skills        || []);

    // ── file upload state ────────────────────────────────────────────────────
    const [photoFile,      setPhotoFile]      = useState(null);   // File object
    const [photoPreview,   setPhotoPreview]   = useState(formData.profilePhotoUrl || "");
    const [photoError,     setPhotoError]     = useState("");
    const fileInputRef = useRef(null);

    // Propagate metadata changes up to parent via a synthetic event pattern
    useEffect(() => {
        onChange({ target: { name: "employeeType",  value: employeeType  } });
    }, [employeeType]);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        onChange({ target: { name: "dateOfBirth",   value: dateOfBirth   } });
    }, [dateOfBirth]);   // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        onChange({ target: { name: "dateOfJoining", value: dateOfJoining } });
    }, [dateOfJoining]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        onChange({ target: { name: "skills",        value: skills        } });
    }, [skills]);        // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [onClose]);

    // Designation options tied to selected department
    const desigOptions = useMemo(() => {
        if (!formData.department) return [];
        return (DEPT_DESIG_MAP[formData.department] || []).slice().sort();
    }, [formData.department]);

    function handleDeptChange(val) {
        const validDesigs = DEPT_DESIG_MAP[val] || [];
        const keepDesig   = validDesigs.includes(formData.designation) ? formData.designation : "";
        onChange({ target: { name: "department",  value: val      } });
        onChange({ target: { name: "designation", value: keepDesig } });
    }

    // ── date validation helpers ──────────────────────────────────────────────
    const today       = new Date().toISOString().split("T")[0];
    const minDOB      = "1950-01-01";
    // Must be at least 18 years old
    const maxDOB      = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d.toISOString().split("T")[0];
    })();
    // DOJ cannot be before DOB
    const minDOJ      = dateOfBirth || "1980-01-01";
    // DOJ can be up to 1 year in the future
    const maxDOJ      = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split("T")[0];
    })();

    // ── file upload handler ──────────────────────────────────────────────────
    function handleFileChange(e) {
        const file = e.target.files[0];
        e.target.value = "";          // reset so same file can be re-selected
        if (!file) return;

        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setPhotoError(`Invalid file type. Allowed: JPG, PNG, WEBP, GIF.`);
            return;
        }
        if (file.size > MAX_PHOTO_SIZE_BYTES) {
            setPhotoError(`File too large. Maximum size is ${MAX_PHOTO_SIZE_MB} MB.`);
            return;
        }
        setPhotoError("");
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
        onChange({ target: { name: "profilePhotoFile", value: file } });
    }

    function handleRemovePhoto() {
        setPhotoFile(null);
        setPhotoPreview("");
        setPhotoError("");
        onChange({ target: { name: "profilePhotoFile", value: null } });
    }

    return (
        <div
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-labelledby="modal-title"
        >
            <div className="modal modal--wide">
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon">{isEdit ? <Icon.Edit s={16} /> : <Icon.Plus s={16} />}</div>
                        <div>
                            <div className="modal-title" id="modal-title">
                                {isEdit ? "Edit Employee" : "Add New Employee"}
                            </div>
                            <div className="modal-subtitle">
                                {isEdit ? "Update employee information" : "Fill in the details to add an employee"}
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
                </div>

                <div className="modal-body">
                    <form id="emp-form" onSubmit={onSubmit}>
                        <div className="form-grid">

                            {/* ── Section: Basic Information ── */}
                            <div className="form-section-label">Basic Information</div>

                            {/* Organization — create only */}
                            {!isEdit && (
                                <div className="form-group full-width">
                                    <label className="form-label" htmlFor="f-orgId">
                                        Organization <span className="required">*</span>
                                    </label>
                                    <div className="select-wrap">
                                        <select
                                            id="f-orgId"
                                            className="form-input form-select-native"
                                            name="orgName"
                                            value={formData.orgName || ""}
                                            onChange={e => {
                                                const selectedName = e.target.value;
                                                const selectedUuid = orgOptions.find(o => o.name === selectedName)?.uuid || "";
                                                onChange({ target: { name: "orgName", value: selectedName } });
                                                onChange({ target: { name: "orgId",   value: selectedUuid  } });
                                            }}
                                            required
                                        >
                                            <option value="">Select Organization…</option>
                                            {orgOptions.map(org => (
                                                <option key={org.uuid} value={org.name}>{org.name}</option>
                                            ))}
                                        </select>
                                        <span className="select-chevron-icon"><Icon.Chevron s={12} /></span>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" htmlFor="f-name">
                                    Full Name <span className="required">*</span>
                                </label>
                                <input id="f-name" className="form-input" type="text" name="name"
                                    placeholder="e.g. Jane Smith" value={formData.name}
                                    onChange={onChange} required autoComplete="off" />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="f-email">
                                    Email Address <span className="required">*</span>
                                </label>
                                <input id="f-email" className="form-input" type="email" name="email"
                                    placeholder="jane@company.com" value={formData.email}
                                    onChange={onChange} required autoComplete="off" />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="f-phone">Phone</label>
                                <input id="f-phone" className="form-input" type="tel" name="phone"
                                    placeholder="+91 98765 43210" value={formData.phone}
                                    onChange={onChange} autoComplete="off" />
                            </div>

                            {/* ── NEW: Profile Photo (File Upload) ── */}
                            <div className="form-group">
                                <label className="form-label">
                                    Profile Photo
                                    <span className="form-label hint"> JPG / PNG / WEBP / GIF · max {MAX_PHOTO_SIZE_MB} MB</span>
                                </label>
                                <div className="photo-upload-row">
                                    {/* Preview avatar */}
                                    {photoPreview ? (
                                        <div className="photo-preview-wrap">
                                            <img src={photoPreview} alt="Profile preview" className="photo-preview-img" />
                                            <button
                                                type="button"
                                                className="photo-preview-remove"
                                                onClick={handleRemovePhoto}
                                                aria-label="Remove photo"
                                            >×</button>
                                        </div>
                                    ) : (
                                        <div className="photo-placeholder">
                                            <Icon.Upload s={20} />
                                        </div>
                                    )}
                                    <div className="photo-upload-controls">
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Icon.Upload s={13} />
                                            {photoFile ? "Change Photo" : "Upload Photo"}
                                        </button>
                                        {photoFile && (
                                            <span className="photo-filename" title={photoFile.name}>
                                                {photoFile.name.length > 28
                                                    ? photoFile.name.slice(0, 25) + "…"
                                                    : photoFile.name}
                                                {" "}
                                                <span className="photo-filesize">
                                                    ({(photoFile.size / 1024).toFixed(0)} KB)
                                                </span>
                                            </span>
                                        )}
                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept={ALLOWED_PHOTO_TYPES.join(",")}
                                            onChange={handleFileChange}
                                            style={{ display: "none" }}
                                            aria-label="Upload profile photo"
                                        />
                                    </div>
                                </div>
                                {photoError && (
                                    <p className="form-field-error" role="alert">{photoError}</p>
                                )}
                            </div>

                            {/* ── Section: Classification ── */}
                            <div className="form-section-label">Classification</div>

                            {/* Department — single select */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="f-dept">Department</label>
                                <div className="select-wrap">
                                    <select
                                        id="f-dept"
                                        className="form-input form-select-native"
                                        value={formData.department}
                                        onChange={e => handleDeptChange(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {ALL_DEPARTMENTS.slice().sort().map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <span className="select-chevron-icon"><Icon.Chevron s={12} /></span>
                                </div>
                            </div>

                            {/* Designation — single select, linked to dept */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="f-desig">Designation</label>
                                <div className="select-wrap">
                                    <select
                                        id="f-desig"
                                        className="form-input form-select-native"
                                        value={formData.designation}
                                        onChange={e => onChange({ target: { name: "designation", value: e.target.value } })}
                                        disabled={!formData.department}
                                    >
                                        <option value="">Select Designation</option>
                                        {desigOptions.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <span className="select-chevron-icon"><Icon.Chevron s={12} /></span>
                                </div>
                                {!formData.department && (
                                    <p className="form-hint-text">Select a department first</p>
                                )}
                            </div>

                            {/* ── NEW: Employment Type (Radio Buttons) ── */}
                            <div className="form-group full-width">
                                <label className="form-label" id="f-emptype-label">Employment Type</label>
                                <div className="radio-group" role="radiogroup" aria-labelledby="f-emptype-label">
                                    {EMPLOYMENT_TYPES.map(type => (
                                        <label key={type} className={`radio-card${employeeType === type ? " checked" : ""}`}>
                                            <input
                                                type="radio"
                                                name="employeeType"
                                                value={type}
                                                checked={employeeType === type}
                                                onChange={() => setEmployeeType(type)}
                                                className="radio-card-input"
                                            />
                                            <span className="radio-card-label">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ── NEW: Skills (Multi-select dropdown with custom tags) ── */}
                            <div className="form-group full-width">
                                <label className="form-label" htmlFor="f-skills">
                                    Skills
                                    <span className="form-label hint"> Select from list or type to add custom</span>
                                </label>
                                <SkillsDropdown value={skills} onChange={setSkills} />
                            </div>

                            {/* ── Section: Dates ── */}
                            <div className="form-section-label">Employment Dates</div>

                            {/* ── NEW: Date of Birth (date picker) ── */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="f-dob">Date of Birth</label>
                                <input
                                    id="f-dob"
                                    type="date"
                                    className="form-input"
                                    name="dateOfBirth"
                                    value={dateOfBirth}
                                    min={minDOB}
                                    max={maxDOB}
                                    onChange={e => setDateOfBirth(e.target.value)}
                                />
                                <p className="form-hint-text">Must be 18 or older</p>
                            </div>

                            {/* ── NEW: Date of Joining (date picker) ── */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="f-doj">Date of Joining</label>
                                <input
                                    id="f-doj"
                                    type="date"
                                    className="form-input"
                                    name="dateOfJoining"
                                    value={dateOfJoining}
                                    min={minDOJ}
                                    max={maxDOJ}
                                    onChange={e => setDateOfJoining(e.target.value)}
                                />
                                {dateOfJoining && dateOfBirth && dateOfJoining <= dateOfBirth && (
                                    <p className="form-field-error" role="alert">
                                        Date of joining must be after date of birth.
                                    </p>
                                )}
                            </div>

                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" form="emp-form" className="btn btn-primary">
                        {isEdit ? "Update Employee" : "Create Employee"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterDrawer — full-height side panel
// ─────────────────────────────────────────────────────────────────────────────
function FilterDrawer({
    open, onClose,
    searchText, onSearchChange,
    filterDept,  onFilterDeptChange,
    filterDesig, onFilterDesigChange,
    statusFilter, onStatusFilterChange,
    orgName, onOrgNameChange,
    orgLoading, onGetByOrg, onGetAll,
    onReset,
    deptOptions, desigOptions,
    orgOptions,
}) {
    const drawerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        function handler(e) {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
        }
        const t = setTimeout(() => document.addEventListener("mousedown", handler), 60);
        return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [open, onClose]);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else      document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <>
            <div className="drawer-backdrop" aria-hidden="true" />
            <aside ref={drawerRef} className="filter-drawer" role="complementary" aria-label="Filter employees">

                <div className="filter-drawer-header">
                    <div className="filter-drawer-title-row">
                        <div className="filter-drawer-title">
                            <Icon.Filter s={16} />
                            <span>Filters</span>
                        </div>
                        <button className="filter-drawer-close" onClick={onClose} aria-label="Close filter panel">
                            <Icon.X s={16} />
                        </button>
                    </div>
                </div>

                <div className="filter-drawer-body">

                    {/* Search */}
                    <div className="fd2-section">
                        <div className="fd2-label">Search</div>
                        <div className="fd2-search-wrap">
                            <Icon.Search s={14} />
                            <input
                                type="text"
                                className="fd2-search-input"
                                placeholder="Search name, email, phone…"
                                value={searchText}
                                onChange={e => onSearchChange(e.target.value)}
                                autoComplete="off"
                                aria-label="Search employees"
                            />
                            {searchText && (
                                <button className="fd2-search-clear" onClick={() => onSearchChange("")} aria-label="Clear search">×</button>
                            )}
                        </div>
                    </div>

                    <div className="fd2-divider" />

                    {/* Department */}
                    <div className="fd2-section">
                        <div className="fd2-label">Department</div>
                        <DepartmentDropdown
                            value={filterDept}
                            onChange={onFilterDeptChange}
                            options={deptOptions}
                            placeholder="All Departments"
                        />
                    </div>

                    <div className="fd2-divider" />

                    {/* Designation — multi-select */}
                    <div className="fd2-section">
                        <div className="fd2-label">Designation</div>
                        <DesignationDropdown
                            value={filterDesig}
                            onChange={onFilterDesigChange}
                            options={desigOptions}
                            placeholder="All Designations"
                        />
                    </div>

                    <div className="fd2-divider" />

                    {/* Organization */}
                    <div className="fd2-section">
                        <div className="fd2-label">Organization</div>
                        <select
                            className="fd2-select"
                            value={orgName}
                            onChange={e => onOrgNameChange(e.target.value)}
                            aria-label="Filter by organization"
                        >
                            <option value="">All Organizations</option>
                            {orgOptions.map(org => (
                                <option key={org.uuid} value={org.name}>{org.name}</option>
                            ))}
                        </select>
                        {orgName && (
                            <div className="fd2-org-actions">
                                <button type="button" className="btn btn-primary btn-sm" onClick={onGetByOrg} disabled={orgLoading}>
                                    {orgLoading ? "Loading…" : "Apply Org Filter"}
                                </button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={onGetAll}>
                                    Show All
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="fd2-divider" />

                    {/* Status — radio buttons (existing) */}
                    <div className="fd2-section">
                        <div className="fd2-label">Status</div>
                        <div className="fd2-radio-group" role="radiogroup" aria-label="Status filter">
                            {[
                                { val: "",         label: "All"      },
                                { val: "Active",   label: "Active"   },
                                { val: "Inactive", label: "Inactive" },
                            ].map(({ val, label }) => (
                                <label key={val || "all"} className="fd2-radio-label">
                                    <input
                                        type="radio"
                                        name="drawerStatus"
                                        className="fd2-radio-input"
                                        value={val}
                                        checked={statusFilter === val}
                                        onChange={() => onStatusFilterChange(val)}
                                    />
                                    <span className="fd2-radio-text">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="filter-drawer-footer">
                    <button type="button" className="btn btn-secondary" onClick={onReset} style={{ flex: 1 }}>
                        Clear Filters
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>
                        Apply
                    </button>
                </div>
            </aside>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employees page
// ─────────────────────────────────────────────────────────────────────────────
function Employees({ employees, loading, error: externalError, sortField = "name", sortDir = "asc", pushNotif, onReload, setEmployees }) {

    const [opError, setOpError] = useState("");
    const displayError = opError || externalError;

    const [filterOpen,    setFilterOpen]    = useState(false);
    const [searchText,    setSearchText]    = useState("");
    const [filterDept,    setFilterDept]    = useState("");
    const [filterDesig,   setFilterDesig]   = useState([]);
    const [statusFilter,  setStatusFilter]  = useState("");
    const [orgName,       setOrgName]       = useState("");
    const [orgLoading,    setOrgLoading]    = useState(false);
    const [currentPage,   setCurrentPage]   = useState(1);

    // ── NEW: row-selection state ──────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [viewingId, setViewingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData,  setFormData]  = useState({
        orgId: "", orgName: "", name: "", email: "", phone: "", department: "", designation: "",
        employeeType: "", dateOfBirth: "", dateOfJoining: "", skills: [], profilePhotoFile: null,
    });

    const [orgOptions, setOrgOptions] = useState(() => loadOrganizations());
    useEffect(() => {
        if (showModal) setOrgOptions(loadOrganizations());
    }, [showModal]);

    const allDepts = useMemo(() => ALL_DEPARTMENTS.slice().sort(), []);

    const filterDrawerDesigOptions = useMemo(() => {
        if (!filterDept) return ALL_DESIGNATIONS.slice().sort();
        return (DEPT_DESIG_MAP[filterDept] || []).slice().sort();
    }, [filterDept]);

    useEffect(() => {
        if (filterDept && filterDesig.length > 0) {
            const valid = new Set(DEPT_DESIG_MAP[filterDept] || []);
            const trimmed = filterDesig.filter(d => valid.has(d));
            if (trimmed.length !== filterDesig.length) setFilterDesig(trimmed);
        }
    }, [filterDept]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Filter + Sort pipeline ────────────────────────────────────────────────
    const filteredEmployees = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        const filtered = employees.filter(emp => {
            if (q) {
                const haystack = [emp.name, emp.email, emp.phone].filter(Boolean).map(f => f.toLowerCase());
                if (!haystack.some(h => h.includes(q))) return false;
            }
            if (filterDept && emp.department !== undefined && emp.department !== filterDept) return false;
            if (filterDesig.length > 0 && emp.designation !== undefined && !filterDesig.includes(emp.designation)) return false;
            if (statusFilter === "Active"   && emp.isActive !== true)  return false;
            if (statusFilter === "Inactive" && emp.isActive !== false) return false;
            return true;
        });

        return [...filtered].sort((a, b) => {
            let av = "", bv = "";
            switch (sortField) {
                case "name":        av = a.name        || ""; bv = b.name        || ""; break;
                case "email":       av = a.email       || ""; bv = b.email       || ""; break;
                case "department":  av = a.department  || ""; bv = b.department  || ""; break;
                case "designation": av = a.designation || ""; bv = b.designation || ""; break;
                case "status":      av = a.isActive ? "1" : "0"; bv = b.isActive ? "1" : "0"; break;
                case "newest":      return String(b.id || "").localeCompare(String(a.id || ""));
                case "oldest":      return String(a.id || "").localeCompare(String(b.id || ""));
                default:            av = a.name || ""; bv = b.name || "";
            }
            const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
            return sortDir === "desc" ? -cmp : cmp;
        });
    }, [employees, searchText, filterDept, filterDesig, statusFilter, sortField, sortDir]);

    useEffect(() => { setCurrentPage(1); },
        [searchText, filterDept, filterDesig, statusFilter, sortField, sortDir]);

    // Clear selection when the employee list changes
    useEffect(() => { setSelectedIds(new Set()); }, [employees]);

    const totalActive   = employees.filter(e =>  e.isActive).length;
    const totalInactive = employees.filter(e => !e.isActive).length;

    const hasActiveFilters = searchText.trim() !== "" || filterDept !== "" || filterDesig.length > 0 || statusFilter !== "" || orgName !== "";

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (searchText.trim())  n++;
        if (filterDept)         n++;
        if (filterDesig.length) n++;
        if (statusFilter)       n++;
        if (orgName)            n++;
        return n;
    }, [searchText, filterDept, filterDesig, statusFilter, orgName]);

    const pagedEmployees = filteredEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ── Row-selection helpers ─────────────────────────────────────────────────
    const pagedIds       = pagedEmployees.map(e => e.id);
    const allPageChecked = pagedIds.length > 0 && pagedIds.every(id => selectedIds.has(id));
    const somePageChecked = pagedIds.some(id => selectedIds.has(id));

    function handleSelectAll(e) {
        if (e.target.checked) {
            setSelectedIds(prev => new Set([...prev, ...pagedIds]));
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                pagedIds.forEach(id => next.delete(id));
                return next;
            });
        }
    }

    function handleRowCheck(id, checked) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(id); else next.delete(id);
            return next;
        });
    }

    function clearSelection() { setSelectedIds(new Set()); }

    // ── API helpers ───────────────────────────────────────────────────────────
    const handleGetByOrg = async () => {
        const orgId = resolveOrgId(orgName);
        if (!orgId) { setOpError("Selected organization UUID not found."); return; }
        setOrgLoading(true); setOpError("");
        try {
            const data = await getEmployeesByOrganization(orgId);
            const list = Array.isArray(data) ? data : data.employees || [];
            setEmployees(list);
            pushNotif?.(`Loaded ${list.length} employee${list.length !== 1 ? "s" : ""} for ${orgName}.`, "info");
            setFilterOpen(false);
        } catch (err) {
            setOpError(err.message || "Failed to load employees for this organization.");
        } finally { setOrgLoading(false); }
    };

    const handleGetAll = useCallback(() => {
        resetFiltersState();
        onReload?.();
    }, [onReload]); // eslint-disable-line react-hooks/exhaustive-deps

    function resetFiltersState() {
        setSearchText(""); setFilterDept(""); setFilterDesig([]);
        setStatusFilter(""); setOrgName("");
    }

    const handleReset = useCallback(() => {
        resetFiltersState();
        onReload?.();
    }, [onReload]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Form helpers ──────────────────────────────────────────────────────────
    const handleFormChange = e =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    function openAdd() {
        setEditingId(null);
        setFormData({
            orgId: "", orgName: "", name: "", email: "", phone: "",
            department: "", designation: "",
            employeeType: "", dateOfBirth: "", dateOfJoining: "",
            skills: [], profilePhotoFile: null,
        });
        setShowModal(true);
    }

    async function openEdit(emp) {
        setOpError("");
        try {
            const full = await getEmployee(emp.id);
            const meta = full.metadata || {};
            setEditingId(full.id);
            setFormData({
                orgId:            full.orgId       || "",
                orgName:          (() => {
                    const n = resolveOrgName(full.orgId);
                    return (n !== "—" && n !== "Unknown Organization") ? n : "";
                })(),
                name:             full.name        || "",
                email:            full.email       || "",
                phone:            full.phone       || "",
                department:       full.department  || "",
                designation:      full.designation || "",
                employeeType:     meta.employeeType  || "",
                dateOfBirth:      meta.dateOfBirth   || "",
                dateOfJoining:    meta.dateOfJoining || "",
                skills:           Array.isArray(meta.skills) ? meta.skills : [],
                profilePhotoUrl:  meta.profilePhotoUrl || "",
                profilePhotoFile: null,
            });
            setShowModal(true);
        } catch (err) {
            setOpError(err.message || "Failed to load employee for editing.");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setOpError("");
        try {
            const metadata = {
                employeeType:  formData.employeeType  || undefined,
                dateOfBirth:   formData.dateOfBirth   || undefined,
                dateOfJoining: formData.dateOfJoining || undefined,
                skills:        formData.skills?.length > 0 ? formData.skills : undefined,
                // profilePhotoFile is local-only; in production this would be
                // uploaded to a storage service and the URL stored in metadata.
            };
            // Remove undefined keys
            Object.keys(metadata).forEach(k => metadata[k] === undefined && delete metadata[k]);

            if (editingId) {
                await updateEmployee(editingId, {
                    name: formData.name, email: formData.email, phone: formData.phone,
                    department: formData.department, designation: formData.designation,
                    metadata,
                });
                pushNotif?.(`Employee "${formData.name}" updated successfully.`, "success");
            } else {
                await createEmployee({
                    orgId: formData.orgId, name: formData.name, email: formData.email,
                    phone: formData.phone, department: formData.department,
                    designation: formData.designation, metadata,
                });
                pushNotif?.(`Employee "${formData.name}" added successfully.`, "success");
            }
            setShowModal(false);
            onReload?.();
        } catch (err) {
            setOpError(err.message || "Operation failed. Please try again.");
        }
    };

    const handleToggleStatus = async (emp) => {
        setOpError("");
        try {
            if (emp.isActive) {
                await deactivateEmployee(emp.id);
                pushNotif?.(`Employee deactivated successfully.`, "warning");
            } else {
                await activateEmployee(emp.id);
                pushNotif?.(`Employee activated successfully.`, "success");
            }
            onReload?.();
        } catch (err) {
            setOpError(err.message || "Status update failed. Please try again.");
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    // Render
    // ════════════════════════════════════════════════════════════════════════
    return (
        <main className="page-body">

            {/* Stat Cards */}
            {!loading && !externalError && (
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--total"><Icon.Users s={20} /></div>
                        <div className="stat-text">
                            <span className="stat-value">{employees.length}</span>
                            <span className="stat-label">Total Employees</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--active"><Icon.UserCheck s={20} /></div>
                        <div className="stat-text">
                            <span className="stat-value">{totalActive}</span>
                            <span className="stat-label">Active</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--inactive"><Icon.UserX s={20} /></div>
                        <div className="stat-text">
                            <span className="stat-value">{totalInactive}</span>
                            <span className="stat-label">Inactive</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--showing"><Icon.Eye s={20} /></div>
                        <div className="stat-text">
                            <span className="stat-value">{filteredEmployees.length}</span>
                            <span className="stat-label">Showing</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {displayError && (
                <div className="error-banner" role="alert">
                    <Icon.Alert s={15} />
                    <span>{displayError}</span>
                    <button className="error-close" onClick={() => setOpError("")} aria-label="Dismiss error">×</button>
                </div>
            )}

            {/* Section header + Toolbar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="section-header">
                    <div className="section-title-group">
                        <span className="section-title">Employees</span>
                        {!loading && (
                            <span className="section-count-badge">
                                {filteredEmployees.length}
                                {filteredEmployees.length !== employees.length ? ` / ${employees.length}` : ""}
                            </span>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Icon.Plus s={14} /> Add Employee
                    </button>
                </div>

                <div className="toolbar">
                    <div className="toolbar-search">
                        <Icon.Search s={14} />
                        <input
                            type="text"
                            placeholder="Search name, email, phone…"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            autoComplete="off"
                            aria-label="Search employees by name, email, or phone"
                        />
                        {searchText && (
                            <button className="ts-clear" onClick={() => setSearchText("")} aria-label="Clear search">×</button>
                        )}
                    </div>

                    <button
                        className={`btn-filter${filterOpen ? " is-open" : ""}${hasActiveFilters ? " has-active" : ""}`}
                        onClick={() => setFilterOpen(o => !o)}
                        aria-expanded={filterOpen}
                        aria-haspopup="dialog"
                        aria-label="Open filters"
                    >
                        <Icon.Filter s={14} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="filter-count-badge">{activeFilterCount}</span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button type="button" className="btn btn-ghost btn-sm fp-clear-all" onClick={handleReset}>
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* ── NEW: Bulk-selection bar ───────────────────────────────────────── */}
            {selectedIds.size > 0 && (
                <div className="bulk-bar" role="region" aria-label="Bulk actions">
                    <span className="bulk-bar-count">
                        {selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <div className="bulk-bar-actions">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={clearSelection}
                        >
                            Clear selection
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="table-card">
                    <div className="state-block">
                        <div className="spinner" aria-label="Loading employees" />
                        <p>Loading employees…</p>
                    </div>
                </div>
            )}

            {/* Empty */}
            {!loading && !externalError && filteredEmployees.length === 0 && (
                <div className="table-card">
                    <div className="state-block">
                        <Icon.EmptyState />
                        <p>{employees.length === 0
                            ? "No employees yet. Add your first employee to get started."
                            : "No employees match the current filters."}</p>
                        {employees.length > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={handleReset}>Clear filters</button>
                        )}
                    </div>
                </div>
            )}

            {/* Desktop Table */}
            {!loading && pagedEmployees.length > 0 && (
                <div className="table-card">
                    <div className="table-wrap">
                        <table className="emp-table" aria-label="Employee list">
                            <thead>
                                <tr>
                                    {/* ── NEW: Select-all checkbox ── */}
                                    <th className="th-checkbox">
                                        <input
                                            type="checkbox"
                                            className="row-checkbox"
                                            checked={allPageChecked}
                                            ref={el => { if (el) el.indeterminate = somePageChecked && !allPageChecked; }}
                                            onChange={handleSelectAll}
                                            aria-label="Select all employees on this page"
                                        />
                                    </th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Status</th>
                                    <th className="th-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedEmployees.map(emp => {
                                    const isChecked = selectedIds.has(emp.id);
                                    return (
                                        <tr key={emp.id} className={isChecked ? "row-selected" : ""}>
                                            {/* ── NEW: Row checkbox ── */}
                                            <td className="td-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="row-checkbox"
                                                    checked={isChecked}
                                                    onChange={e => handleRowCheck(emp.id, e.target.checked)}
                                                    aria-label={`Select ${emp.name || "employee"}`}
                                                />
                                            </td>
                                            <td>{emp.name || "—"}</td>
                                            <td>{emp.email || "—"}</td>
                                            <td>{emp.phone || "—"}</td>
                                            <td>{emp.department || "—"}</td>
                                            <td>{emp.designation || "—"}</td>
                                            <td>
                                                <span className={`badge ${emp.isActive ? "badge-active" : "badge-inactive"}`}>
                                                    {emp.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="td-actions">
                                                <div className="action-group">
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setViewingId(emp.id)} aria-label="View employee">
                                                        <Icon.Eye s={13} /> View
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)} aria-label="Edit employee">
                                                        <Icon.Edit s={13} /> Edit
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${emp.isActive ? "btn-danger" : "btn-success"}`}
                                                        onClick={() => handleToggleStatus(emp)}
                                                        aria-label={emp.isActive ? "Deactivate employee" : "Activate employee"}
                                                    >
                                                        <Icon.Power s={13} />
                                                        {emp.isActive ? "Deactivate" : "Activate"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination total={filteredEmployees.length} page={currentPage} pageSize={PAGE_SIZE} onChange={setCurrentPage} />
                </div>
            )}

            {/* Mobile Cards */}
            {!loading && pagedEmployees.length > 0 && (
                <div className="emp-cards">
                    {pagedEmployees.map(emp => (
                        <div className={`emp-card${selectedIds.has(emp.id) ? " row-selected" : ""}`} key={emp.id}>
                            <div className="emp-card-header">
                                {/* ── NEW: Mobile row checkbox ── */}
                                <input
                                    type="checkbox"
                                    className="row-checkbox"
                                    checked={selectedIds.has(emp.id)}
                                    onChange={e => handleRowCheck(emp.id, e.target.checked)}
                                    aria-label={`Select ${emp.name || "employee"}`}
                                    style={{ marginRight: 8, flexShrink: 0 }}
                                />
                                <div className="emp-card-info">
                                    <div className="emp-card-name">{emp.name || "—"}</div>
                                    <div className="emp-card-sub">{[emp.department, emp.designation].filter(Boolean).join(" • ") || "—"}</div>
                                    <div className="emp-card-contact">
                                        {emp.email && <span>{emp.email}</span>}
                                        {emp.phone && <span>{emp.phone}</span>}
                                    </div>
                                </div>
                                <span className={`badge ${emp.isActive ? "badge-active" : "badge-inactive"}`}>
                                    {emp.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="emp-card-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => setViewingId(emp.id)}><Icon.Eye s={13} /> View</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}><Icon.Edit s={13} /> Edit</button>
                                <button className={`btn btn-sm ${emp.isActive ? "btn-danger" : "btn-success"}`} onClick={() => handleToggleStatus(emp)}>
                                    <Icon.Power s={13} />{emp.isActive ? "Deactivate" : "Activate"}
                                </button>
                            </div>
                        </div>
                    ))}
                    <Pagination total={filteredEmployees.length} page={currentPage} pageSize={PAGE_SIZE} onChange={setCurrentPage} />
                </div>
            )}

            {/* Filter Drawer */}
            <FilterDrawer
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                searchText={searchText}
                onSearchChange={setSearchText}
                filterDept={filterDept}
                onFilterDeptChange={setFilterDept}
                filterDesig={filterDesig}
                onFilterDesigChange={setFilterDesig}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                orgName={orgName}
                onOrgNameChange={setOrgName}
                orgLoading={orgLoading}
                onGetByOrg={handleGetByOrg}
                onGetAll={handleGetAll}
                onReset={handleReset}
                deptOptions={allDepts}
                desigOptions={filterDrawerDesigOptions}
                orgOptions={orgOptions}
            />

            {viewingId !== null && (
                <ViewModal employeeId={viewingId} onClose={() => setViewingId(null)} />
            )}

            {showModal && (
                <EmployeeModal
                    editingId={editingId}
                    formData={formData}
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                    orgOptions={orgOptions}
                />
            )}
        </main>
    );
}

export default Employees;
