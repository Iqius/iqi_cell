import React, { useState, useRef, useEffect } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

function LoginFlow({ onLogin }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef([]);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:3001/users?phone=${phone}`);
    const data = await res.json();
    if (data.length > 0) {
      setStep(2);
      setError(""); 
    } else {
      setError("Nomor HP tidak terdaftar di server!");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    const res = await fetch(
      `http://localhost:3001/users?phone=${phone}&otp=${otpString}`
    );
    const data = await res.json();
    if (data.length > 0) {
      setOtpError(""); 
      onLogin(data[0]);
    } else {
      setOtpError("OTP salah!");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "#0021fb",
      }}
    >

      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" }, 
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <img
          src="/images/iqicell.png"
          alt="Ilustrasi"
          style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "1rem" }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          background: "#ffffffff",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 1, fontWeight: 900, color: "#0021fb", zIndex: 1000 }}
        >
          Selamat Datang di IQICell
        </Typography>

        {step === 1 && (
          <>
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{ mt: 2, color: "#000000ff" }}
            >
              Masukkan nomor telepon Anda untuk melanjutkan login
            </Typography>

            <form
              onSubmit={handlePhoneSubmit}
              style={{ width: "100%", maxWidth: 500 }}
            >
              <TextField
                label="Nomor HP"
                variant="outlined"
                fullWidth
                margin="normal"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                    WebkitTextFillColor: "#000",
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                    WebkitTextFillColor: "#000",
                  },
                  "& input": { caretColor: "#000" },
                }}
              />
              <Box sx={{ minHeight: "2rem", mb: 2 }}>
                {error && (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                )}
              </Box>

              <Box display="flex" alignItems="center" mt={1} mb={2}>
                <input
                  type="checkbox"
                  id="agree"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="agree" style={{ fontSize: 14, color: "#000" }}>
                  Saya menyetujui{" "}
                  <a
                    href="/syarat-dan-ketentuan" 
                    style={{
                      color: "#0021fb",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.textDecoration = "underline")
                    }
                    onMouseOut={(e) => (e.target.style.textDecoration = "none")}
                  >
                    syarat dan ketentuan
                  </a>{" "}
                  IQICell
                </label>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 1.5, py: 1.5 }}
                disabled={!agree} 
              >
                Kirim OTP
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{ mt: 2, color: "#000000ff" }}
            >
              Masukkan OTP yang kami kirimkan kepada anda
            </Typography>

            <form onSubmit={handleOtpSubmit}>
              <Box display="flex" justifyContent="space-between" gap={1} mb={1}>
                {otp.map((digit, idx) => (
                  <TextField
                    key={idx}
                    inputRef={(el) => (otpRefs.current[idx] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: "center", caretColor: "#000" },
                    }}
                    variant="outlined"
                    sx={{
                      width: "3rem",
                      "& input:-webkit-autofill": {
                        WebkitBoxShadow: "0 0 0 1000px white inset",
                        WebkitTextFillColor: "#000",
                      },
                      "& input:-webkit-autofill:focus": {
                        WebkitBoxShadow: "0 0 0 1000px white inset",
                        WebkitTextFillColor: "#000",
                      },
                      "& input": { caretColor: "#000" },
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ minHeight: "1.25rem", mb: 2 }}>
                {otpError && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ display: "block" }}
                  >
                    {otpError}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ py: 1.5 }}
              >
                Login
              </Button>
            </form>
          </>
        )}
      </Box>
    </Box>
  );
}

export default LoginFlow;
