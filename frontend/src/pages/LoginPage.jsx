import { useState } from "react";
import API from "../services/api";

const LoginPage = () => {

    const [role, setRole] = useState("Owner");

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {

            const response = await API.post("/auth/login", {
                username: formData.username,
                password: formData.password,
                role: role,
            });

            console.log(response.data);

            // simpan token
            localStorage.setItem(
                "userInfo",
                JSON.stringify(response.data)
            );

            alert("Login berhasil");

            // redirect berdasarkan role
            if (response.data.role === "Owner") {
                window.location.href = "/owner";
            }

            if (response.data.role === "Admin") {
                window.location.href = "/admin";
            }

            if (response.data.role === "Kasir") {
                window.location.href = "/kasir";
            }

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Login gagal"
            );
        }
    };

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f5f5f5",
            }}
        >
            <form
                onSubmit={handleLogin}
                style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "10px",
                    width: "350px",
                }}
            >

                <h2>Nicky Frozen POS</h2>

                <h3>Pilih Role</h3>

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "15px",
                    }}
                >
                    <option>Owner</option>
                    <option>Admin</option>
                    <option>Kasir</option>
                </select>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    onChange={handleChange}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "15px",
                    }}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "15px",
                    }}
                />

                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "10px",
                        background: "#111827",
                        color: "white",
                        border: "none",
                    }}
                >
                    Login
                </button>

            </form>
        </div>
    );
};

export default LoginPage;