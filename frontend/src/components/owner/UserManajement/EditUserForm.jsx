import Swal from "sweetalert2";

const EditUserForm = ({ showModal, setShowModal, selectedUser }) => {
  if (!showModal) return null;

  const handleUpdate = async () => {
    // Di sini nanti kamu bisa tambahkan logika update data (API, state, dll)
    // Untuk contoh, kita asumsikan update berhasil

    await Swal.fire({
      icon: "success",
      title: "User Updated!",
      text: "The user has been successfully updated.",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: true,
    });

    setShowModal(false);
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
              defaultValue={selectedUser?.fullName}
              placeholder="Enter full name"
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text"
            />
          </div>

          {/* USERNAME */}
          <div>
            <label className="text-sm font-medium text-text">Username</label>

            <input
              type="text"
              defaultValue={selectedUser?.username}
              placeholder="Enter username"
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium text-text">Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text"
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="text-sm font-medium text-text">Role</label>

            <select
              defaultValue={selectedUser?.role}
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text"
            >
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Cashier">Cashier</option>
            </select>
          </div>

          {/* BRANCH */}
          <div>
            <label className="text-sm font-medium text-text">Branch</label>

            <select
              defaultValue={selectedUser?.branch}
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text"
            >
              <option value="">Select Branch</option>
              <option value="Depok Branch">Depok Branch</option>
              <option value="Sleman Branch">Sleman Branch</option>
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium text-text">Status</label>

            <select
              defaultValue={selectedUser?.status}
              className="w-full mt-2 border border-border rounded-xl px-4 py-3 bg-background outline-none text-text"
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
