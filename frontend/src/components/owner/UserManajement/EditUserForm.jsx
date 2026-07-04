import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const EditUserForm = ({
  showModal,
  setShowModal,
  selectedUser,
  fetchUsers,
}) => {
  // State untuk form values (Tanpa password)
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    username: "",
    role: "",
    cabang: "",
    status: "Active",
  });

  // Mengisi form secara otomatis saat selectedUser berubah
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        nama_lengkap: selectedUser.nama_lengkap || "",
        username: selectedUser.username || "",
        role: selectedUser.role || "",
        cabang:
          selectedUser.role === "Owner" ? "Pusat" : selectedUser.cabang || "",
        status: selectedUser.status || "Active",
      });
    }
  }, [selectedUser]);

  if (!showModal) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "role" && value === "Owner") {
      setFormData((prev) => ({
        ...prev,
        role: value,
        cabang: "",
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    // Validasi input dasar
    if (
      !formData.nama_lengkap ||
      !formData.username ||
      !formData.role ||
      (formData.role !== "Owner" && !formData.cabang)
    ) {
      return Swal.fire(
        "Error",
        "Mohon lengkapi nama, username, role, dan cabang.",
        "error",
      );
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      };

      // Siapkan data yang akan dikirim (tanpa password)
      const payload = {
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        role: formData.role,
        cabang: formData.role === "Owner" ? "Pusat" : formData.cabang,
        status: formData.status,
      };

      // Kirim request PUT ke backend
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser._id}`,
        payload,
        config,
      );

      await Swal.fire({
        icon: "success",
        title: "User Updated!",
        text: "The user has been successfully updated.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
        timer: 2000,
        timerProgressBar: true,
      });

      setShowModal(false);
      if (fetchUsers) fetchUsers(); // Refresh tabel
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          error.response?.data?.message ||
          "An error occurred while updating the user.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card w-full max-w-2xl rounded-3xl p-6 border border-border">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text">Edit User</h2>
            <p className="text-text-secondary text-sm mt-1">
              Update user information
            </p>
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="text-text-secondary hover:text-danger text-2xl"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* FULL NAME */}
          <div>
            <label className="text-sm font-medium text-text">Full Name</label>
            <input
              type="text"
              name="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
            />
          </div>

          {/* USERNAME */}
          <div>
            <label className="text-sm font-medium text-text">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="text-sm font-medium text-text">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
            >
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
              <option value="Kasir">Kasir</option>
            </select>
          </div>

          {/* BRANCH */}
          {formData.role !== "Owner" && (
            <div>
              <label className="text-sm font-medium text-text">Branch</label>
              <select
                name="cabang"
                value={formData.cabang}
                onChange={handleChange}
                className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
              >
                <option value="">Select Branch</option>
                <option value="Cabang Jogja">Cabang Jogja</option>
                <option value="Cabang Solo">Cabang Solo</option>
              </select>
            </div>
          )}

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium text-text">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-4 mt-8">
          <button
            onClick={() => setShowModal(false)}
            className="px-5 py-3 rounded-2xl border border-border text-text hover:bg-background transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-5 py-3 rounded-2xl transition-all duration-200"
          >
            Update User
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;
