import { signInWithPassword } from './actions'
import { Metadata } from 'next'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Đăng nhập CMS | Hệ thống tòa soạn ảo',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams.message;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans relative overflow-hidden selection:bg-emerald-500/30">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-emerald-300/30 to-teal-200/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-blue-300/30 to-indigo-200/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md px-8 py-10 mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/80 p-10 overflow-hidden relative">
          
          <div className="mb-10 text-center relative z-10">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-3xl">A</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Đăng nhập CMS</h1>
            <p className="text-slate-500 font-medium">Đăng nhập bằng tài khoản Quản trị viên</p>
          </div>

          <form className="relative z-10 flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Địa chỉ Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mt-2">
              <Button formAction={signInWithPassword} variant="success" className="w-full">
                Đăng nhập
              </Button>
            </div>

            {message && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 font-bold text-sm text-center rounded-xl border border-red-100">
                {message}
              </div>
            )}
          </form>
        </div>
        
        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          &copy; {new Date().getFullYear()} ANV SPORT. All rights reserved.
        </p>
      </div>
    </div>
  )
}
