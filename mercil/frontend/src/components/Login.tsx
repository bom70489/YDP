import { useState , useContext } from "react"
import { Link , useNavigate} from "react-router-dom"
import { AuthContext } from "../context/UserContext"
import { toast } from "react-toastify";

const Login = () => {

  const context = useContext(AuthContext)
  const [email , setEmail] = useState<string>('')
  const [password , setPassword] = useState<string>('')
  const navigate = useNavigate();

  if(!context) return null
  const { login } = context
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login success!");
      navigate("/"); 
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#F5EDE0]">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl border border-[#C8B8A5] py-8 w-[450px] px-8 rounded-2xl"
      >
        <h1 className="text-3xl font-semibold mb-6 text-center text-[#7B5E57]">
          Login
        </h1>

        <div className="flex flex-col mb-4">
          <label className="mb-1 text-[#5A463F] font-medium">Email:</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="border border-[#C8B8A5] py-2 px-3 rounded-lg focus:ring-2 focus:ring-[#A3887B] outline-none"
          />
        </div>

        <div className="flex flex-col mb-6">
          <label className="mb-1 text-[#5A463F] font-medium">Password:</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="border border-[#C8B8A5] py-2 px-3 rounded-lg focus:ring-2 focus:ring-[#A3887B] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full mb-3 text-white bg-[#7B5E57] hover:bg-[#A07D72] duration-300 py-2 rounded-lg font-semibold"
        >
          Login
        </button>

        <div className="flex justify-center mt-2 text-sm">
          <p className="mr-2 text-[#5A463F]">Don't have an account?</p>
          <Link to="/register" className="text-[#7B5E57] underline font-medium">
            Register
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Login