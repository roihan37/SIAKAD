import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import React, { useState } from "react"
import { login } from "@/features/action/authThunk"
import { useAppDispatch } from "@/hooks/redux"
import { useNavigate } from "react-router"
// import { setAccessToken } from "@/features/slice/authSlice"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({
    identifier : 'admin@siakad.com',
    password : 'Tasik123'
  })

  const henddleinput = ({ target } : React.ChangeEvent<HTMLInputElement>) => {

    setLoginForm({
      ...loginForm,
      [target.name] : target.value
    }) 
  }

  const submitLogin = async (e: React.SubmitEvent<Element>) => {
    e.preventDefault();
    try {
      const data = await dispatch(login(loginForm)).unwrap();
      // console.log(data, "<< PADA SUBMIT LOGIN");
      navigate('/mahasiswa')
    } catch (error) {
      
      console.log(error);
    }
  }

  return (
    <form onSubmit={submitLogin} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email or Username</FieldLabel>
          <Input id="email" name="identifier" value={loginForm.identifier} onChange={henddleinput} placeholder="email or username" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" name="password" value={loginForm.password} onChange={henddleinput} type="password" required />
        </Field>
        <Field>
          <Button type="submit">Login</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
