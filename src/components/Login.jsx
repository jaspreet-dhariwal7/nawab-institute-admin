import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import niteLogo from "../assets/nite-logo.jpg";
import { callApi } from "../services/ApiService";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Loader from "./common/Loader.jsx";

const getTokenFromResponse = (response) => (
  response?.token ||
  response?.key ||
  response?.auth_token ||
  response?.access ||
  response?.data?.token ||
  ""
);

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(()=>{
    const token = Cookies.get("token");
    if(token){
      navigate("/dashboard");
    }
  },[])

  const inputHandler = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: "" }));
    setFormError("");
  };

  const validateForm = () => {
    let newError = {};
    if (!form.email) newError.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newError.email = "Invalid email format.";
    if (!form.password) newError.password = "Password is required.";
    else if (form.password.length < 6) newError.password = "Password must be at least 6 characters.";
    setError(newError);
    return Object.keys(newError).length === 0;
  };

  const handleSubmit = async(e) => {

    console.log("Submitting form with data:", form);
    e.preventDefault();
    setError({});
    setFormError("");
    if (!validateForm()) return;
    try{
      setLoading(true);
        const payload = {
          email: form.email,
          password: form.password,
        }
      const res = await callApi({
        url: "/auth/login/",
        method: "post",
        data: payload,
      })
      console.log("login response", res)

      if(res.statusCode === 200){
        const token = getTokenFromResponse(res);
        if (!token) {
          setFormError("Login succeeded, but no token was returned.");
          return;
        }

        toast.success("Login successful!", { id: "loginSuccessToast" });
        Cookies.set("token", token, { expires: 7, sameSite: "lax" });
        navigate("/dashboard");
      }
    }catch(err){
      console.log("login error", err)
    }finally{
      setLoading(false);
    }
    
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#222] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#020818] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[#020818]/85" />
        <div className="absolute inset-x-0 top-0 h-[116px] bg-[#020818]/80" />
        <div className="absolute inset-x-0 bottom-0 h-[124px] bg-[#020818]/80" />

        <div className="relative  flex h-full w-full max-w-[520px] flex-col items-center justify-center px-10 text-center">
          <div className="w-40 h-40 mb-5  p-3">
            <img src={niteLogo} alt="img" className="rounded-xl" />
          </div>

          <div className="mt-20">
            <h1 className="text-[42px] font-black leading-[1.25] text-white">
              Cultivating Technical Excellence & Innovation
            </h1>
            <p className="mx-auto mt-10 max-w-[430px] text-[16px] font-semibold leading-7 text-white/82">
              Access the Nawab Institute of Technical Education administrative
              ecosystem. Integrated management for the future of technical
              learning.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f7] px-5 py-10">
        <div className="mb-8 flex items-center gap-2 text-[15px] font-bold text-[#061530] lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-[#061530] text-[10px] font-black text-white">
            N
          </span>
          <span>NITE Logo</span>
        </div>

        <div className="w-full max-w-[410px] rounded-[10px] border border-[#dddddd] bg-white px-9 py-10 shadow-[0_2px_8px_rgba(0,0,0,0.18)] sm:px-10">
          <h2 className="mb-9 text-center text-[30px] font-black leading-none text-[#202124]">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-black uppercase tracking-[0.02em] text-[#4f5260]"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#777d8c]" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={inputHandler}
                  placeholder="admin@nite.edu.in"
                  className="h-[47px] w-full rounded-[7px] border border-[#cfd3db] bg-[#f9fafb] pl-10 pr-4 text-[14px] font-semibold text-[#4b5260] outline-none transition focus:border-[#ffb21d] focus:bg-white focus:ring-2 focus:ring-[#ffb21d]/25"
                />
              </div>
              {error?.email && (
                <p className="pt-1 text-xs font-semibold text-[#dc000b]">
                  {error.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[11px] font-black uppercase tracking-[0.02em] text-[#4f5260]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#777d8c]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={inputHandler}
                  placeholder="••••••••"
                  className="h-[47px] w-full rounded-[7px] border border-[#cfd3db] bg-[#f9fafb] pl-10 pr-4 text-[14px] font-semibold text-[#4b5260] outline-none transition focus:border-[#ffb21d] focus:bg-white focus:ring-2 focus:ring-[#ffb21d]/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777d8c] hover:text-[#4b5260]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {error?.password && (
                <p className="pt-1 text-xs font-semibold text-[#dc000b]">
                  {error?.password}
                </p>
              )}
            </div>

            {formError && (
              <p className="text-center text-xs font-semibold text-[#dc000b]">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-[53px] w-full items-center justify-center gap-3 rounded-[6px] bg-[#ffb21d] text-[14px] font-semibold text-[#332000] transition hover:bg-[#f5a600] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader variant="button" label="Logging in..." />
              ) : (
                <>
                  Login
                  <ArrowRight className="h-[19px] w-[19px]" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-7 text-center text-[11px] font-bold tracking-[0.05em] text-[#777]">
          © 2024 Nawab Institute of Technical Education. All rights reserved.
        </p>
      </section>
    </main>
  );
}
