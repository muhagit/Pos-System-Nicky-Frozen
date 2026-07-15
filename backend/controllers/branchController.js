import Branch from "../models/Branch.js";

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private (Owner, Admin, Kasir)
export const getBranches = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        const filter = {};
        if (activeOnly === "true") {
            filter.isActive = true;
        }
        const branches = await Branch.find(filter).sort({ name: 1 });
        res.json(branches);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data cabang", error: error.message });
    }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Private (Owner)
export const createBranch = async (req, res) => {
    try {
        const { name, address, isActive } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Nama cabang harus diisi" });
        }
        const branchExists = await Branch.findOne({ name });
        if (branchExists) {
            return res.status(400).json({ message: "Nama cabang sudah digunakan" });
        }
        const branch = await Branch.create({
            name,
            address: address || "",
            isActive: isActive !== undefined ? isActive : true
        });
        res.status(201).json(branch);
    } catch (error) {
        res.status(500).json({ message: "Gagal membuat cabang baru", error: error.message });
    }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Owner)
export const updateBranch = async (req, res) => {
    try {
        const { name, address, isActive } = req.body;
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: "Cabang tidak ditemukan" });
        }
        
        if (name && name !== branch.name) {
            const branchExists = await Branch.findOne({ name });
            if (branchExists) {
                return res.status(400).json({ message: "Nama cabang sudah digunakan" });
            }
            branch.name = name;
        }
        
        if (address !== undefined) {
            branch.address = address;
        }
        if (isActive !== undefined) {
            branch.isActive = isActive;
        }
        
        const updatedBranch = await branch.save();
        res.json(updatedBranch);
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui cabang", error: error.message });
    }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Owner)
export const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: "Cabang tidak ditemukan" });
        }
        await Branch.findByIdAndDelete(req.params.id);
        res.json({ message: "Cabang berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus cabang", error: error.message });
    }
};
