// src/services/AuthService.js
import axiosInstance from "./AxiosInstance";
import swal from "sweetalert";

const API_BASE_URL = "http://localhost:8000/api"; 

// Register User (Sign Up)
export function signUp(username, email, password) {
    return axiosInstance.post(`${API_BASE_URL}/auth/register`, { username, email, password })
        .then((response) => {
            return new Promise((resolve) => {
                swal({
                    title: "Success",
                    text: "Registration successful! Please check your email for verification code.",
                    icon: "success",
                    timer: 2000,
                    buttons: false,
                });
                setTimeout(() => resolve(response.data), 2000);
            });
        })
        .catch((error) => {
            swal("Oops", error.response?.data?.detail || "Registration failed", "error");
            throw error;
        });
}

// Verify Email Code
export function verifyCode(email, code) {
    return axiosInstance.post(`${API_BASE_URL}/auth/verify-email`, { email, code })
        .then((response) => {
            return new Promise((resolve) => {
                swal({
                    title: "Success",
                    text: "Email verified successfully! Redirecting to dashboard...",
                    icon: "success",
                    timer: 2000,
                    buttons: false,
                });
                setTimeout(() => resolve(response.data), 2000);
            });
        })
        .catch((error) => {
            swal("Oops", error.response?.data?.detail || "Verification failed", "error");
            throw error;
        });
}

// Resend Verification Code
export function resendCode(email) {
    return axiosInstance.post(`${API_BASE_URL}/auth/resend-verification`, { email })
        .then((response) => {
            return new Promise((resolve) => {
                swal({
                    title: "Success",
                    text: "Verification code resent to your email!",
                    icon: "success",
                    timer: 2000,
                    buttons: false,
                });
                setTimeout(() => resolve(response.data), 2000);
            });
        })
        .catch((error) => {
            swal("Oops", error.response?.data?.detail || "Failed to resend code", "error");
            throw error;
        });
}

// Login User (Using Sessions)
export function login(username, password) {
    return axiosInstance.post(`${API_BASE_URL}/auth/login`, { username, password }, { withCredentials: true })
        .then((response) => {
            return new Promise((resolve) => {
                swal({
                    title: "Success",
                    text: "SignIn successful! Redirecting to home having dashboard access...",
                    icon: "success",
                    timer: 1000,
                    buttons: false,
                });
                setTimeout(() => resolve(response.data), 2000);
            });
        })
        .catch((error) => {
            const errorMessage = error.response?.data?.detail || "Login failed";
            
            // Handle email verification error specifically
            if (error.response?.status === 403 && errorMessage.includes("verify your email")) {
                swal({
                    title: "Email Not Verified",
                    text: "Please verify your email before logging in. Check your email for the verification code.",
                    icon: "warning",
                    buttons: {
                        verify: "Go to Verification",
                        cancel: "Cancel"
                    }
                }).then((value) => {
                    if (value === "verify") {
                        // Redirect to verification page
                        window.location.href = "/verification";
                    }
                });
            } else {
                swal("Oops", errorMessage, "error");
            }
            throw error;
        });
}

// Logout User
export function logoutUser() {
    return axiosInstance.get(`${API_BASE_URL}/auth/logout`, { withCredentials: true })
        .then(() => {
            // swal("Success", "Logout successful!", "success");
            return new Promise((resolve) => {
                //swal("Success", "Logout successful! Redirecting to login...", "success");
                swal({
                    title: "Success",
                    text: "Logout successful! Redirecting to login...",
                    icon: "success",
                    timer: 1000,  // ✅ Closes automatically after 1 second
                    buttons: false, // ✅ Removes OK button
                });
                setTimeout(() => resolve(), 1000); // Delay response by 1 second
            });
        })
        .catch((error) => {
            swal("Oops", "Logout failed", "error");
            throw error;
        });
}

// Fetch Current User (Session-based)
export function getCurrentUser() {
    return axiosInstance.get(`${API_BASE_URL}/auth/users/me`, { withCredentials: true })
        .then((response) => {
            if (!response.data) {
                throw new Error("Session expired");
            }
            return response.data;
        })
        .catch((error) => {
            console.error('Error fetching current user:', error);
            return null;
        });
}

// Forgot Password - Send Reset Code
export function forgotPassword(email) {
    return axiosInstance.post(`${API_BASE_URL}/auth/forgot-password`, { email })
        .then((response) => {
            return new Promise((resolve) => {
                swal({
                    title: "Success",
                    text: "Reset code sent to your email!",
                    icon: "success",
                    timer: 2000,
                    buttons: false,
                });
                setTimeout(() => resolve(response.data), 2000);
            });
        })
        .catch((error) => {
            swal("Oops", error.response?.data?.detail || "Failed to send reset code", "error");
            throw error;
        });
}

// Reset Password - Verify Code and Update Password
export function resetPassword(email, code, newPassword) {
    return axiosInstance.post(`${API_BASE_URL}/auth/reset-password`, { 
        email, 
        code, 
        new_password: newPassword 
    })
        .then((response) => {
            return new Promise((resolve) => {
                swal({
                    title: "Success",
                    text: "Password reset successful! Redirecting to login...",
                    icon: "success",
                    timer: 2000,
                    buttons: false,
                });
                setTimeout(() => resolve(response.data), 2000);
            });
        })
        .catch((error) => {
            swal("Oops", error.response?.data?.detail || "Failed to reset password", "error");
            throw error;
        });
}

