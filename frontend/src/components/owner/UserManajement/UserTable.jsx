const UserTable = ({ setShowEditModal, setSelectedUser }) => {
  const users = [
    {
      fullName: "Ahmad Nur Rofik",
      username: "ahmadowner",
      role: "Owner",
      branch: "All Branches",
      status: "Active",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text">User List</h2>
          <p className="text-text-secondary text-sm mt-1">
            Manage all registered users
          </p>
        </div>

        <div className="text-sm text-text-secondary">
          Total Users: {users.length}
        </div>
      </div>

      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-border text-text-secondary text-sm">
            <th className="text-left py-4 font-medium">Full Name</th>
            <th className="text-left font-medium">Username</th>
            <th className="text-left font-medium">Role</th>
            <th className="text-left font-medium">Branch</th>
            <th className="text-left font-medium">Status</th>
            <th className="text-left font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => (
            <tr
              key={index}
              className="border-b border-border hover:bg-background transition-all duration-200"
            >
              <td className="py-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-sidebar font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-text">{user.fullName}</p>
                    <p className="text-sm text-text-secondary">
                      Owner Account
                    </p>
                  </div>
                </div>
              </td>

              <td className="text-text">{user.username}</td>

              <td>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                  {user.role}
                </span>
              </td>

              <td className="text-text">{user.branch}</td>

              <td>
                <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-semibold">
                  {user.status}
                </span>
              </td>

              <td>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditModal(true);
                    }}
                    className="bg-warning/10 text-warning px-4 py-2 rounded-xl text-sm font-medium hover:bg-warning/20 transition-all duration-200"
                  >
                    Edit
                  </button>

                  <button className="bg-danger/10 text-danger px-4 py-2 rounded-xl text-sm font-medium hover:bg-danger/20 transition-all duration-200">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;