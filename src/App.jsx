import { useState } from "react";
import "./App.css";
import Login from "./pages/login";
import Home from "./pages/home";
import Packages from "./pages/buyPackage";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Helmet } from "react-helmet";

const theme = createTheme({
  palette: {
    primary: { main: "#0d47a1" }, // biru tua
    secondary: { main: "#1565c0" },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("home");
  };

  return (
    <ThemeProvider theme={theme}>
      <Helmet>
        <title>IQICell - Selamat Datang</title>
        <meta
          name="description"
          content="Masukkan nomor HP Anda untuk login ke IQICell, aplikasi pengelolaan paket dan top up mudah."
        />
      </Helmet>

      {page === "login" && <Login onLogin={handleLogin} />}
      {page === "home" && (
        <Home
          user={user}
          setUser={setUser}
          goHome={() => setPage("home")} // <--- tambahkan ini
          goToPackages={() => setPage("packages")}
        />
      )}

      {page === "packages" && (
        <Packages
          user={user}
          setUser={setUser}
          goHome={() => setPage("home")}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
