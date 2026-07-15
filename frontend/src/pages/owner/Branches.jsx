import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import RevenueChart from "../../components/owner/RevenueChart";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "Belum sinkron";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Branches = () => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState("monitoring");

  // Monitoring States
  const [ringkasanCabang, setRingkasanCabang] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [selectedMonitorBranch, setSelectedMonitorBranch] = useState("All");
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState(true);

  // CRUD States
  const [branches, setBranches] = useState([]);
  const [isLoadingCRUD, setIsLoadingCRUD] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    isActive: true,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = {
    headers: { Authorization: `Bearer ${userInfo?.token}` },
  };

  // Fetch Dashboard data for Monitoring
  const fetchMonitoringData = async () => {
    try {
      setIsLoadingMonitoring(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/dashboard/owner",
        config
      );
      setRingkasanCabang(data.cabang || []);
      setRevenueData(data.revenueData || []);
      setIsLoadingMonitoring(false);
    } catch (error) {
      console.error("Gagal mengambil data monitoring cabang:", error);
      setIsLoadingMonitoring(false);
    }
  };

  // Fetch all branches for CRUD
  const fetchBranches = async () => {
    try {
      setIsLoadingCRUD(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/branches",
        config
      );
      setBranches(data || []);
      setIsLoadingCRUD(false);
    } catch (error) {
      console.error("Gagal mengambil data cabang:", error);
      setIsLoadingCRUD(false);
    }
  };

  useEffect(() => {
    if (activeTab === "monitoring") {
      fetchMonitoringData();
    } else {
      fetchBranches();
    }
  }, [activeTab]);

  // Open modal for add
  const handleAddClick = () => {
    setFormData({ name: "", address: "", isActive: true });
    setModalMode("add");
    setErrorMessage("");
    setShowModal(true);
  };

  // Open modal for edit
  const handleEditClick = (branch) => {
    setFormData({
      name: branch.name,
      address: branch.address || "",
      isActive: branch.isActive,
    });
    setSelectedBranchId(branch._id);
    setModalMode("edit");
    setErrorMessage("");
    setShowModal(true);
  };

  // Save branch (Add or Edit)
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage("Nama cabang harus diisi");
      return;
    }

    try {
      if (modalMode === "add") {
        await axios.post(
          "http://localhost:5000/api/branches",
          formData,
          config
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/branches/${selectedBranchId}`,
          formData,
          config
        );
      }
      setShowModal(false);
      fetchBranches();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal menyimpan data cabang");
    }
  };

  // Delete branch
  const handleDeleteBranch = async (id, name) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Apakah Anda yakin ingin menghapus cabang "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/branches/${id}`, config);
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: response.data.message || "Cabang berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchBranches();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: error.response?.data?.message || "Gagal menghapus cabang",
        });
      }
    }
  };

  // Quick toggle active status
  const handleToggleStatus = async (branch) => {
    try {
      await axios.put(
        `http://localhost:5000/api/branches/${branch._id}`,
        { ...branch, isActive: !branch.isActive },
        config
      );
      fetchBranches();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal merubah status cabang");
    }
  };

  // Filter monitoring view based on dropdown
  const filteredRingkasan = selectedMonitorBranch === "All"
    ? ringkasanCabang
    : ringkasanCabang.filter((c) => c.nama === selectedMonitorBranch);

  // Filter revenue data for charts
  const getFilteredRevenueData = () => {
    if (selectedMonitorBranch === "All") return revenueData;
    return revenueData.map((day) => {
      const filteredDay = { hari: day.hari };
      if (day[selectedMonitorBranch] !== undefined) {
        filteredDay[selectedMonitorBranch] = day[selectedMonitorBranch];
      }
      return filteredDay;
    });
  };

  return (
    <div className="p-6 min-h-screen bg-background overflow-y-auto font-poppins text-text">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Branches</h1>
          <p className="text-text-secondary mt-1">
            Manage branches and monitor sales performance
          </p>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm self-start">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "monitoring"
                ? "bg-primary text-sidebar shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            Monitoring Cabang
          </button>
          <button
            onClick={() => setActiveTab("kelola")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "kelola"
                ? "bg-primary text-sidebar shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            Kelola Cabang
          </button>
        </div>
      </div>

      {/* --- TAB MONITORING --- */}
      {activeTab === "monitoring" && (
        <div className="space-y-8">
          {isLoadingMonitoring ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* DROPDOWN SELECTOR */}
              <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm w-full md:w-96">
                <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
                  Pilih Cabang:
                </span>
                <select
                  value={selectedMonitorBranch}
                  onChange={(e) => setSelectedMonitorBranch(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="All">Semua Cabang</option>
                  {ringkasanCabang.map((c, idx) => (
                    <option key={idx} value={c.nama}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* SYNC STATUS */}
              <div>
                <h2 className="text-lg font-semibold text-text mb-4">Sync Status</h2>
                {filteredRingkasan.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center text-text-secondary">
                    Tidak ada data sinkronisasi untuk cabang terpilih.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredRingkasan.map((c, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-text">{c.nama}</h2>
                            <p className="text-text-secondary text-sm mt-1">
                              Last Sync: {formatRelativeTime(c.lastSync)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              c.isOnline ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                            }`}
                          >
                            {c.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BRANCH SUMMARY */}
              <div>
                <h2 className="text-lg font-semibold text-text mb-4">Sales Overview</h2>
                {filteredRingkasan.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center text-text-secondary">
                    Tidak ada ringkasan penjualan untuk cabang terpilih.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredRingkasan.map((c, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-semibold text-text">{c.nama}</h2>
                            <p className="text-text-secondary text-sm mt-1">
                              Daily sales overview
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              c.selisih ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                            }`}
                          >
                            {c.selisih ? "Warning" : "Safe"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mt-6">
                          <div>
                            <p className="text-text-secondary text-sm">Revenue</p>
                            <h3 className="text-2xl font-bold text-text mt-1">
                              {formatRupiah(c.penjualan)}
                            </h3>
                          </div>

                          <div>
                            <p className="text-text-secondary text-sm">Transactions</p>
                            <h3 className="text-2xl font-bold text-text mt-1">
                              {c.transaksi}
                            </h3>
                          </div>

                          <div>
                            <p className="text-text-secondary text-sm">Cash Total</p>
                            <h3 className="text-xl font-semibold text-text mt-1">
                              {formatRupiah(c.kas)}
                            </h3>
                          </div>

                          <div>
                            <p className="text-text-secondary text-sm">Cash Difference</p>
                            <h3
                              className={`font-semibold mt-1 ${
                                c.selisih ? "text-danger" : "text-success"
                              }`}
                            >
                              {c.selisih ? formatRupiah(c.nominalSelisih) : "No Difference"}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SALES COMPARISON */}
              <div className="mt-8">
                <RevenueChart data={getFilteredRevenueData()} />
              </div>
            </>
          )}
        </div>
      )}

      {/* --- TAB KELOLA CABANG (CRUD) --- */}
      {activeTab === "kelola" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text">Daftar Cabang</h2>
            <button
              onClick={handleAddClick}
              className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm shadow-sm"
            >
              <FiPlus size={16} />
              Tambah Cabang
            </button>
          </div>

          {isLoadingCRUD ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : branches.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-secondary">
              Belum ada cabang yang didaftarkan.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-background text-text-secondary text-xs uppercase font-semibold">
                      <th className="px-6 py-4">Nama Cabang</th>
                      <th className="px-6 py-4">Alamat</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {branches.map((b) => (
                      <tr key={b._id} className="hover:bg-background/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-text">{b.name}</td>
                        <td className="px-6 py-4 text-text-secondary">{b.address || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(b)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold select-none cursor-pointer transition-colors ${
                              b.isActive
                                ? "bg-success/10 text-success hover:bg-success/20"
                                : "bg-danger/10 text-danger hover:bg-danger/20"
                            }`}
                            title="Klik untuk mengubah status"
                          >
                            {b.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleEditClick(b)}
                              className="p-2 rounded-lg border border-border hover:bg-background text-primary hover:text-primary-dark transition"
                              title="Edit Cabang"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(b._id, b.name)}
                              className="p-2 rounded-lg border border-border hover:bg-background text-danger hover:text-danger-dark transition"
                              title="Hapus Cabang"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
              <h3 className="font-bold text-lg text-text">
                {modalMode === "add" ? "Tambah Cabang Baru" : "Edit Cabang"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-secondary hover:text-text p-1.5 rounded-lg border border-border hover:bg-background transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm border border-danger/20">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-text block mb-2">
                  Nama Cabang <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cabang Semarang"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary transition"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-2">
                  Alamat Cabang
                </label>
                <textarea
                  placeholder="Masukkan alamat cabang..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-background outline-none text-text focus:border-primary transition min-h-24 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-text cursor-pointer select-none">
                  Cabang Aktif
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl border border-border text-text hover:bg-background transition-all text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-5 py-3 rounded-xl transition-all duration-200 text-sm shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;