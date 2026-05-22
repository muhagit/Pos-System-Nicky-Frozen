import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import OwnerPage from "./pages/OwnerPage";
import AdminPage from "./pages/AdminPage";
import KasirPage from "./pages/KasirPage";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<LoginPage />}
                />

                <Route
                    path="/owner"
                    element={<OwnerPage />}
                />

                <Route
                    path="/admin"
                    element={<AdminPage />}
                />

                <Route
                    path="/kasir"
                    element={<KasirPage />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;