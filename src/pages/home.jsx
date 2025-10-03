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
  ButtonGroup,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import Swal from "sweetalert2";
import { useMediaQuery } from "@mui/material";

function Home({ user, setUser, goHome, goToPackages }) {
  const [anchorEl, setAnchorEl] = useState(null);
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
      const res = await fetch("http://localhost:3001/beliLagi");
      const beliLagi = await res.json();
      const res2 = await fetch("http://localhost:3001/spesialUntukAnda");
      const spesial = await res2.json();

      setItems({
        beliLagi,
        spesialUntukAnda: spesial,
      });
    };
    fetchItems();
  }, []);

  const displayedItems = items[selectedCategory] || [];
  const handleNotifClick = (event) => {
    setNotifAnchor(event.currentTarget);
    setBadgeCount(0); 
  };
  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const formatTanggal = (tanggal) => {
    const d = new Date(tanggal);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleTopUp = () => {
    if (!topUpPulsa || topUpPulsa.length === 0) return;

    Swal.fire({
      title: "Pilih nominal top up",
      html: topUpPulsa
        .map(
          (item) =>
            `<button class="swal2-confirm swal2-styled" style="margin:4px; background-color:#1976d2; border:none; color:white;" data-nominal="${item.nominal}" data-hari="${item.masaAktif}">Rp ${item.nominal}</button>`
        )
        .join(""),
      showConfirmButton: false,
      didOpen: () => {
        const container = Swal.getHtmlContainer();
        const buttons = container.querySelectorAll("button");
        buttons.forEach((btn) => {
          btn.addEventListener("click", async () => {
            const nominal = Number(btn.dataset.nominal);
            const masaAktifTambahan = btn.dataset.hari; 
            const hari = Number(masaAktifTambahan.replace(/\D/g, "")) || 0;

            Swal.fire({
              title: "Top Up...",
              didOpen: () => Swal.showLoading(),
              allowOutsideClick: false,
            });

            const baseDate = user.masaAktif
              ? new Date(user.masaAktif)
              : new Date();
            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() + hari);

            const updatedUser = {
              ...user,
              saldo: user.saldo + nominal,
              masaAktif: newDate.toISOString().split("T")[0],
            };

            await fetch(`http://localhost:3001/users/${user.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                saldo: updatedUser.saldo,
                masaAktif: updatedUser.masaAktif,
              }),
            });

            setUser(updatedUser);

            const newNotif = {
              id: Date.now(),
              deskripsi: `Saldo bertambah Rp ${nominal}, masa aktif +${hari} hari`,
              waktu: new Date().toISOString(),
            };

            await fetch(`http://localhost:3001/notifikasi`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newNotif),
            });

            setNotifikasi((prev) => [...prev, newNotif]);
            setBadgeCount((prev) => prev + 1);

            Swal.fire({
              title: "Berhasil!",
              text: `Saldo bertambah Rp ${nominal}`,
              icon: "success",
              confirmButtonText: "OK",
              confirmButtonColor: "#1976d2",
            });
          });
        });
      },
    });
  };

  const handleBuy = (item) => {
    Swal.fire({
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
      color: "#1976d2",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setUser((prev) => {
          const newMasaAktifKuota =
            prev.masaAktifKuota + item.masaAktifTambahan;
          const newSaldo = prev.saldo - item.harga;
          const newKuota = prev.kuota + item.kuota;

          return {
            ...prev,
            kuota: newKuota,
            saldo: newSaldo,
            masaAktifKuota: newMasaAktifKuota,
          };
        });

        setNotifikasi((prev) => [
          ...prev,
          {
            id: Date.now(),
            deskripsi: `Berhasil membeli ${item.title}, kuota +${item.kuota}GB, masa aktif +${item.masaAktifTambahan} hari, saldo berkurang Rp ${item.harga}`,
            waktu: new Date().toISOString(),
          },
        ]);

        Swal.fire({
          title: "Berhasil!",
          text: `Pembelian ${item.title} berhasil`,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#1976d2",
        });
      }
    });
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

            <IconButton onClick={handleAvatarClick}>
              <Avatar src="images/avatar.png" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
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
          <span style={{ color: "blue" }}>Selamat datang, </span>
          <span style={{ color: "black" }}>{user.phone}</span>
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Masa Aktif Kartu Anda
              </Typography>
              <Typography variant="h6" color="primary">
                {formatTanggal(user.masaAktif)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Saldo Pulsa
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <Typography variant="h6" color="primary">
                  Rp {user.saldo}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: "#1976d2" }}
                  onClick={handleTopUp}
                >
                  +
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Sisa Paket Data
              </Typography>
              <Typography variant="h6" color="primary">
                {user.kuota} GB | {user.masaAktifKuota} hari
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Button
              onClick={() => setSelectedCategory("beliLagi")}
              sx={{
                px: 3,
                bgcolor: selectedCategory === "beliLagi" ? "#1976d2" : "#fff",
                color: selectedCategory === "beliLagi" ? "#fff" : "#1976d2",
                border: "1px solid #1976d2",
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  bgcolor:
                    selectedCategory === "beliLagi" ? "#1565c0" : "#f0f0f0",
                },
              }}
            >
              Beli Lagi
            </Button>

            <Button
              onClick={() => setSelectedCategory("spesialUntukAnda")}
              sx={{
                px: 3,
                bgcolor:
                  selectedCategory === "spesialUntukAnda" ? "#1976d2" : "#fff",
                color:
                  selectedCategory === "spesialUntukAnda" ? "#fff" : "#1976d2",
                border: "1px solid #1976d2",
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  bgcolor:
                    selectedCategory === "spesialUntukAnda"
                      ? "#1565c0"
                      : "#f0f0f0",
                },
              }}
            >
              Spesial untuk Anda
            </Button>
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

export default Home;
