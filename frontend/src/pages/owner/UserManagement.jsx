import { useState } from "react";

import AddUserForm from "../../components/owner/UserManajement/AddUserForm";
import UserTable from "../../components/owner/UserManajement/UserTable";
import EditUserForm from "../../components/owner/UserManajement/EditUserForm";

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);


  return (
    <div className="p-6 min-h-screen bg-background overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">User Management</h1>

          <p className="text-text-secondary mt-1">
            Manage system users and permissions
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primary-dark text-sidebar font-semibold px-5 py-3 rounded-2xl transition-all duration-200"
        >
          + Add User
        </button>
      </div>

      {/* TABLE */}
      <UserTable
        setShowEditModal={setShowEditModal}
        setSelectedUser={setSelectedUser}
      />

      {/* MODAL */}
      <AddUserForm
        showModal={showModal}
        setShowModal={setShowModal}
        selectedUser={selectedUser}
      />
      <EditUserForm
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        selectedUser={selectedUser}
      />
    </div>
  );
};

export default UserManagement;
