import { useState } from "react";
import { FcGoogle } from "react-icons/fc"; // Google icon
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ERROR_MESSAGES = {
  "auth/email-already-in-use":
    "An account already exists with this email address.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-login-credentials": "The email or password is incorrect.",
  "auth/user-disabled":
    "This account has been disabled. Contact support for help.",
  "auth/user-not-found": "No account was found with this email address.",
  "auth/wrong-password": "The password is incorrect.",
  "auth/invalid-password": "The password is invalid.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/operation-not-allowed":
    "Email and password authentication is currently disabled.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/popup-closed-by-user":
    "Google sign-in was cancelled. Please try again.",
  "auth/cancelled-popup-request": "Another sign-in window is already open.",
  "auth/popup-blocked":
    "The sign-in window was blocked. Allow pop-ups and try again.",
};

function getErrorMessage(err) {
  if (err?.code && ERROR_MESSAGES[err.code]) return ERROR_MESSAGES[err.code];
  if (err?.code === "auth/too-many-requests")
    return ERROR_MESSAGES["auth/too-many-requests"];
  if (typeof err?.message === "string" && err.message.trim())
    return err.message;
  return "Something went wrong. Please try again.";
}

function Signup() {
  const [isLogin, setIsLogin] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  function switchMode() {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
  }

  //  Email submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("First name and last name are required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(cleanEmail, password);
      } else {
        await signup(
          cleanEmail,
          password,
          `${firstName.trim()} ${lastName.trim()}`,
        );
      }
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  //  Google login
  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  //  Facebook login

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-4xl px-4">
        {/* Left Side */}
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">NewBook</h1>
          <p className="text-2xl text-gray-700">
            Connect with friends and the world around you on Facebook.
          </p>
        </div>

        {/* Right Side */}
        <div className="bg-white p-6 rounded-lg shadow-md w-full md:w-96">
          {/* ===== SIGNUP FORM ===== */}
          {!isLogin ? (
            <>
              <h2 className="text-2xl font-bold mb-1">Create a new account</h2>
              <p className="text-gray-500 text-sm mb-4">It's quick and easy.</p>

              {error && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-1/2 p-3 border border-gray-300 rounded bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-1/2 p-3 border border-gray-300 rounded bg-gray-50"
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded bg-gray-50 mb-3"
                />

                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded bg-gray-50 mb-4"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-3 rounded font-bold text-lg hover:bg-green-600 disabled:opacity-50 mb-3"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-2 my-3">
                <hr className="flex-1" />
                <span className="text-gray-400 text-sm">OR</span>
                <hr className="flex-1" />
              </div>

              {/*  Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded font-semibold hover:bg-gray-50 disabled:opacity-50 mb-2"
              >
                <FcGoogle size={22} />
                <span>Continue with Google</span>
              </button>

              {/* Switch to Login */}
              <div className="mt-4 text-center border-t pt-4">
                <button
                  onClick={switchMode}
                  className="text-blue-600 hover:underline text-sm font-semibold"
                >
                  Already have an account? Log in
                </button>
              </div>
            </>
          ) : (
            /* ===== LOGIN FORM ===== */
            <>
              <h2 className="text-3xl font-bold text-center mb-2">
                Log in to NewBook
              </h2>
              <p className="text-gray-500 text-center text-sm mb-4">
                Enter your details to log in.
              </p>

              {error && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded bg-gray-50 mb-3"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded bg-gray-50 mb-4"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded font-bold text-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </form>

              <p className="text-center text-blue-600 text-sm mt-3 cursor-pointer hover:underline">
                Forgot password?
              </p>

              {/* Divider */}
              <div className="flex items-center gap-2 my-3">
                <hr className="flex-1" />
                <span className="text-gray-400 text-sm">OR</span>
                <hr className="flex-1" />
              </div>

              {/*  Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded font-semibold hover:bg-gray-50 disabled:opacity-50 mb-2"
              >
                <span>Continue with Google</span>
              </button>

              {/* Switch to Signup */}
              <div className="mt-2 text-center border-t pt-4">
                <button
                  onClick={switchMode}
                  className="bg-green-500 text-white px-6 py-2 rounded font-bold hover:bg-green-600"
                >
                  Create new account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;
