import { useContext, useState } from "react"
import { Link , useNavigate } from "react-router-dom"
import { AuthContext } from "../context/UserContext"
import { toast } from "react-toastify";


const Register = () => {

  const context = useContext(AuthContext)
  const [name , setName] = useState<string>('')
  const [email , setEmail] = useState<string>('')
  const [password , setPassword] = useState<string>('')
  const navigate = useNavigate()

  if(!context) return null
  const { register } = context
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name , email, password);
      navigate("/"); 
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#F5EDE0]">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#d8c4b8] shadow-xl py-6 w-[600px] px-8 rounded-3xl"
      >
        <h1 className="text-3xl mb-5 text-[#5a403b] font-semibold">
          Register Page
        </h1>

        <div className="flex flex-col mb-4">
          <label htmlFor="email" className="mb-1 text-start text-[#5a403b]">
            Email:
          </label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="border border-[#c2a79d] py-2 px-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b5e57]"
          />
        </div>

        <div className="flex flex-col mb-4">
          <label htmlFor="name" className="mb-1 text-start text-[#5a403b]">
            Name:
          </label>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="border border-[#c2a79d] py-2 px-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b5e57]"
          />
        </div>

        <div className="flex flex-col mb-6">
          <label htmlFor="password" className="mb-1 text-start text-[#5a403b]">
            Password:
          </label>
          <input
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="border border-[#c2a79d] py-2 px-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b5e57]"
          />
        </div>

        <button
          type="submit"
          className="w-full mb-3 text-white bg-[#7b5e57] duration-300 cursor-pointer hover:bg-[#5a403b] py-3 rounded-xl font-medium shadow-md"
        >
          Register
        </button>

        <div className="flex justify-center text-[#5a403b]">
          <p className="mr-2">Already have an account?</p>
          <Link to={"/login"} className="text-[#7b5e57] underline font-semibold">
            Login
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Register