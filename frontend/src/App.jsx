
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import "./index.css";

const API_URL = "http://localhost:5001/api/user";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function getUsersFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

function TiltCard({ children, className = "", intensity = 7 }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setTilt({
      x: (0.5 - y) * intensity,
      y: (x - 0.5) * intensity,
    });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{
        transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, delay = 0 }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="stat-card"
      style={{ "--accent": accent, animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>
        <span className="stat-live">
          <span className="live-dot" />
          LIVE
        </span>
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <div className="stat-glow" />
    </motion.div>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not load users from the server.")
        );
      }

      setUsers(getUsersFromResponse(data));
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the backend. Check that your server is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timeout);
  }, [notice]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.email, user.phone]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [users, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    if (!payload.name || !payload.email) {
      setError("Please enter a name and email address.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editing);
      const url = isEditing ? `${API_URL}/${editing._id}` : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not save this user.")
        );
      }

      // Use the API response when it contains the saved user.
      const savedUser =
        data?.user ||
        data?.data ||
        (data?._id ? data : null);

      if (isEditing) {
        if (savedUser?._id) {
          setUsers((current) =>
            current.map((user) =>
              user._id === editing._id ? savedUser : user
            )
          );
        } else {
          await loadUsers();
        }
        setNotice("User updated successfully.");
      } else {
        if (savedUser?._id) {
          setUsers((current) => [savedUser, ...current]);
        } else {
          await loadUsers();
        }
        setNotice("User added successfully.");
      }

      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser?._id) return;

    setDeletingId(deleteUser._id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/${deleteUser._id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not delete this user.")
        );
      }

      setUsers((current) =>
        current.filter((user) => user._id !== deleteUser._id)
      );
      setNotice("User deleted successfully.");
      setDeleteUser(null);
    } catch (err) {
      setError(err.message || "Something went wrong while deleting.");
      setDeleteUser(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="crud-app">
      <div className="background-grid" aria-hidden="true" />
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />

      <motion.div
        className="app-shell"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >


        {/* <motion.section className="stats-grid" variants={containerVariants}>
          <StatCard
            icon={Users}
            label="Total users"
            value={loading ? "—" : users.length.toLocaleString()}
            accent="#8b5cf6"
          />
          <StatCard
            icon={CheckCircle2}
            label="Visible records"
            value={loading ? "—" : filteredUsers.length.toLocaleString()}
            accent="#06b6d4"
            delay={80}
          />
          <StatCard
            icon={Database}
            label="Data source"
            value="MongoDB"
            accent="#34d399"
            delay={160}
          />
        </motion.section> */}

        <motion.section className="create-panel" variants={itemVariants}>
          <div className="create-copy">
            <div className="create-icon">
              <UserPlus size={22} />
            </div>
            <div>
              <h2>Build your user space</h2>
              <p>Add a new user and keep your records organized.</p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={openAdd}
            className="primary-button"
            whileHover={{ scale: 1.035, y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <UserPlus size={18} />
            Add new user
            <span className="button-shine" />
          </motion.button>
        </motion.section>

        {error && !modalOpen && (
          <motion.div
            className="alert alert-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}

        <motion.section
          className="table-panel"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
          transition={{ duration: 0.25 }}
        >
          <div className="table-toolbar">
            <div>
              <div className="table-title-row">
                <h2>All Users</h2>
                <span className="count-pill">{users.length} records</span>
              </div>
              <p>View, edit and manage user records.</p>
            </div>

            <div className="table-tools">
              <label className="search-box">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users..."
                  aria-label="Search users"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>

              <button
                type="button"
                className="refresh-button"
                onClick={loadUsers}
                disabled={loading}
                aria-label="Refresh users"
                title="Refresh users"
              >
                <RotateCcw
                  size={17}
                  className={loading ? "spin-icon" : ""}
                />
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email address</th>
                  <th>Phone number</th>
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">
                      <LoaderCircle
                        className="loading-spinner"
                        size={30}
                      />
                      <p>Loading your users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">
                      <div className="empty-icon">
                        <Users size={25} />
                      </div>
                      <strong>
                        {search ? "No matching users found" : "No users yet"}
                      </strong>
                      <p>
                        {search
                          ? "Try a different name, email or phone number."
                          : "Add your first user to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence initial={false}>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        layout
                        key={user._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{
                          duration: 0.24,
                          delay: Math.min(index * 0.035, 0.25),
                        }}
                        className="user-row"
                      >
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {(user.name || "?")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="user-name">
                              {user.name || "Unnamed user"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="contact-cell">
                            <Mail size={16} />
                            {user.email || "—"}
                          </span>
                        </td>

                        <td>
                          <span className="contact-cell">
                            <Phone size={16} />
                            {user.phone || "—"}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <motion.button
                              type="button"
                              onClick={() => openEdit(user)}
                              aria-label={`Edit ${user.name}`}
                              className="action-button edit-button"
                              whileHover={{ scale: 1.08, rotate: -3 }}
                              whileTap={{ scale: 0.92 }}
                            >
                              <Pencil size={16} />
                            </motion.button>

                            <motion.button
                              type="button"
                              onClick={() => setDeleteUser(user)}
                              disabled={deletingId === user._id}
                              aria-label={`Delete ${user.name}`}
                              className="action-button delete-button"
                              whileHover={{ scale: 1.08, rotate: 3 }}
                              whileTap={{ scale: 0.92 }}
                            >
                              {deletingId === user._id ? (
                                <LoaderCircle
                                  size={16}
                                  className="loading-spinner"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              {loading
                ? "Loading records..."
                : `Showing ${filteredUsers.length} of ${users.length} users`}
            </span>
            <span className="database-status">
              <span className="live-dot" />
              Data managed via MongoDB API
            </span>
          </div>
        </motion.section>

        <motion.footer className="app-footer" variants={itemVariants}>
          <span>© {new Date().getFullYear()} NEXUS USER MANAGEMENT</span>
          <span>Designed with depth. Built for clarity.</span>
        </motion.footer>
      </motion.div>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast toast-success"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
          >
            <CheckCircle2 size={19} />
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <motion.div
              className="form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="form-modal-title"
              initial={{ opacity: 0, y: 35, rotateX: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 23 }}
            >
              <div className="modal-top-glow" />
              <div className="modal-heading">
                <div className="modal-icon">
                  {editing ? <Pencil size={21} /> : <UserPlus size={21} />}
                </div>
                <div>
                  <h2 id="form-modal-title">
                    {editing ? "Edit user" : "Create a user"}
                  </h2>
                  <p>
                    {editing
                      ? "Update the details below."
                      : "Enter the details for your new user."}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="user-form">
                <label className="form-field">
                  <span>Full name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    autoComplete="name"
                    required
                    maxLength={100}
                  />
                </label>

                <label className="form-field">
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    maxLength={150}
                  />
                </label>

                <label className="form-field">
                  <span>Phone number <small>(optional)</small></span>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    maxLength={30}
                  />
                </label>

                {error && (
                  <div className="form-error">
                    <AlertCircle size={17} />
                    {error}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    className="primary-button submit-button"
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.025 }}
                    whileTap={{ scale: saving ? 1 : 0.97 }}
                  >
                    {saving ? (
                      <LoaderCircle size={18} className="loading-spinner" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save changes"
                        : "Create user"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteUser && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deletingId) {
                setDeleteUser(null);
              }
            }}
          >
            <motion.div
              className="form-modal delete-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
              initial={{ opacity: 0, y: 25, scale: 0.94, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
            >
              <div className="delete-icon">
                <Trash2 size={24} />
              </div>
              <h2 id="delete-modal-title">Delete this user?</h2>
              <p>
                You are about to delete{" "}
                <strong>{deleteUser.name}</strong>. This action cannot be
                undone.
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDeleteUser(null)}
                  disabled={Boolean(deletingId)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={handleDelete}
                  disabled={Boolean(deletingId)}
                >
                  {deletingId ? (
                    <LoaderCircle size={17} className="loading-spinner" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                  {deletingId ? "Deleting..." : "Delete user"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
