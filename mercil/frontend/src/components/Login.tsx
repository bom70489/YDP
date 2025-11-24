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
      navigate("/tester"); 
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div  className="flex justify-center items-center h-screen">
        <form onSubmit={handleSubmit}  className="border py-3 w-[600px] px-6 rounded-3xl">
            <h1 className="text-2xl mb-3 text-blue-400">Login Page</h1>
            <div className="flex flex-col mb-3">
                <label htmlFor="name" className="mb-1 text-start">Email:</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}  placeholder="Enter your email" className="border py-1 px-2 w-full"/>
            </div>
            <div className="flex flex-col mb-4">
                <label htmlFor="password" className="mb-1 text-start">Password:</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}  placeholder="Enter your password" className="border py-1 px-2 w-full"/>
            </div>
            <button type="submit" className="w-full mb-1 text-white bg-black duration-300 cursor-pointer hover:bg-green-400 hover:text-black py-2">Submit</button>
            {/* if not hace account */}
            <div className="flex">
                <p className="mr-3">If you don't have account.</p>
                <Link to={'/register'} className="text-blue-500 underline">Register</Link>
            </div>
        </form>
    </div>
  )
}

export default Login