import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Box,
  ListItemIcon,
  Badge,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import Swal from "sweetalert2";
import { useMediaQuery } from "@mui/material";

function Packages({ user, setUser, goHome, goToPackages }) {
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [topUpPulsa, setTopUpPulsa] = useState([]);
  const [notifikasi, setNotifikasi] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("beliLagi");
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const fetchTopUp = async () => {
      const res = await fetch("http://localhost:3001/topUpPulsa");
      const data = await res.json();
      setTopUpPulsa(data);
    };
    fetchTopUp();
  }, []);

  useEffect(() => {
    const fetchNotifikasi = async () => {
      const res = await fetch("http://localhost:3001/notifikasi");
      const data = await res.json();
      setNotifikasi(data);
      setBadgeCount(data.length);
    };
    fetchNotifikasi();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      const res1 = await fetch("http://localhost:3001/beliLagi");
      const beliLagi = await res1.json();

      const res2 = await fetch("http://localhost:3001/spesialUntukAnda");
      const spesial = await res2.json();

      const res3 = await fetch("http://localhost:3001/paketUtama");
      const paketUtama = await res3.json();

      setItems({
        beliLagi,
        spesialUntukAnda: spesial,
        paketUtama, 
      });
    };
    fetchItems();
  }, []);

  const displayedItems = items[selectedCategory] || [];

  const handleNotifClick = (event) => {
    setNotifAnchor(event.currentTarget);
    setBadgeCount(0);
  };

  const handleBuy = async (item) => {
    const result = await Swal.fire({
      title: `Beli Paket ${item.title}?`,
      html: `
      <p>${item.deskripsi}</p>
      <p>Kuota: ${item.kuota} GB</p>
      <p>Harga: Rp ${item.harga}</p>
      <p>Masa aktif tambahan: ${item.masaAktifTambahan} hari</p>
    `,
      showCancelButton: true,
      confirmButtonText: "Iya",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#1976d2",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return; 
    if (user.saldo < item.harga) {
      Swal.fire("Gagal!", "Saldo tidak cukup!", "error");
      return;
    }

    try {
      const updatedUser = {
        ...user,
        saldo: user.saldo - item.harga,
        kuota: (user.kuota || 0) + item.kuota,
        masaAktifKuota: (user.masaAktifKuota || 0) + item.masaAktifTambahan,
      };

      await fetch(`http://localhost:3001/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      const newNotif = {
        id: Date.now(),
        deskripsi: `Berhasil membeli ${item.title}, kuota +${item.kuota}GB, masa aktif +${item.masaAktifTambahan} hari, saldo berkurang Rp ${item.harga}`,
        waktu: new Date().toISOString(),
      };

      await fetch("http://localhost:3001/notifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotif),
      });

      setUser(updatedUser);
      setNotifikasi((prev) => [...prev, newNotif]);

      Swal.fire({
        title: "Berhasil!",
        text: `Pembelian ${item.title} berhasil.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#1976d2", 
      });
    } catch (error) {
      console.error("Gagal membeli paket:", error);
      Swal.fire({
        title: "Error!",
        text: "Terjadi kesalahan saat membeli paket.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#1976d2",
      });
    }
  };

  return (
    <div>
      <AppBar position="fixed">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!isMobile && <Typography variant="h6">IQICell</Typography>}
            <Button color="inherit" onClick={goHome}>
              Beranda
            </Button>
            <Button color="inherit" onClick={goToPackages}>
              Pembelian
            </Button>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton color="inherit" onClick={handleNotifClick}>
              <Badge badgeContent={badgeCount} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={() => setNotifAnchor(null)}
            >
              {[...notifikasi]
                .reverse()
                .slice(0, 5)
                .map((n) => (
                  <MenuItem key={n.id}>{n.deskripsi}</MenuItem>
                ))}
            </Menu>

            <IconButton>
              <Avatar src="images/avatar.png" />
            </IconButton>
            <Menu>
              <MenuItem
                onClick={() => {
                  Swal.fire({
                    title: "Apakah Anda yakin ingin logout?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Ya",
                    confirmButtonColor: "#1976d2",
                    cancelButtonText: "Tidak",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      window.location.reload();
                    }
                  });
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ padding: 2, paddingTop: "80px" }}>
        <Typography variant="h5" gutterBottom>
          <span style={{ color: "blue" }}>Pilih Paket Anda, </span>
          <span style={{ color: "black" }}>{user.phone}</span>
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            {["paketUtama", "beliLagi", "spesialUntukAnda"].map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 3,
                  bgcolor: selectedCategory === cat ? "#1976d2" : "#fff",
                  color: selectedCategory === cat ? "#fff" : "#1976d2",
                  border: "1px solid #1976d2",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: selectedCategory === cat ? "#1565c0" : "#f0f0f0",
                  },
                }}
              >
                {cat === "paketUtama"
                  ? "Paket Utama"
                  : cat === "beliLagi"
                  ? "Beli Lagi"
                  : "Spesial untuk Anda"}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", overflowX: "auto", gap: 2 }}>
            {displayedItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  minWidth: 200,
                  width: 200,
                  height: 250,
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 2,
                  boxShadow: 3,
                  p: 1,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    {item.deskripsi}
                  </Typography>
                  <Typography variant="subtitle1" textAlign="center">
                    {item.title} | {item.masaAktifTambahan} hari
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary"
                    textAlign="center"
                    sx={{ mt: 1 }}
                  >
                    Rp {item.harga}
                  </Typography>
                </CardContent>

                <Box sx={{ display: "flex", justifyContent: "center", pb: 1 }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#1976d2",
                      color: "#fff",
                      textTransform: "none",
                      borderRadius: 3,
                      px: 4,
                      py: 1,
                      "&:hover": { bgcolor: "#1565c0" },
                    }}
                    onClick={() => handleBuy(item)}
                  >
                    Beli
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default Packages;
