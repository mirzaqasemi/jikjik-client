import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CHATS_ROUTE } from "@/router.tsx";
import { useMutation } from "@tanstack/react-query";
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as backend from '../../services/backend.ts';
import * as session from '../../services/session.ts';
import './login.css';
import { CircleAlert } from "lucide-react";


export default function Login() {
    const navigate = useNavigate();
    const [warning, setWarning] = useState("");
    const usernameRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);

    const loginMutation = useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) => {
            return backend.login(username, password);
        },
        onSuccess: (user) => {
            if (user != null) {
                session.setUser(user.username, user.displayName);
                navigate(CHATS_ROUTE);
            } else {
                setWarning("This username is not found!");
            }
        },
        onError: (err) => {
            console.error(err)
            setWarning("Username or password is wrong!");
        }
    });

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const usernameInput = usernameRef.current;
        const passwordInput = passRef.current;

        if (!usernameInput || !passwordInput) {
            return;
        }

        setWarning("");
        loginMutation.mutate({
            username: usernameInput.value,
            password: passwordInput.value
        }); // React Query internally does something like:
        // const data = await mutationFn({username: usernameInput.value, password: passwordInput.value})
        // storeResultInsideReactQuery(data) Which stores data in "mutation.data"
        //      mutate(...)
        //          ↓
        //      mutationFn runs
        //          ↓
        //      backend.login(...)
        //          ↓
        //      returns user
        //          ↓
        //      TanStack saves it to:
        //      loginMutation.data
        //          ↓
        //      calls onSuccess(user)
    }

    return (
        <div className='flex flex-col items-center justify-center h-full login-page'>
            <div className='flex items-center justify-center w-12 h-12 mb-6 text-white font-bold brand-logo'>C</div>
            <div className='login-header'>
                <h1 className='mb-4 text-center font-semibold tracking-tight text-5xl'>Welcome back</h1>
                <div className="login-header-description">Enter your details to access your chats.</div>
            </div>
            <form onSubmit={handleSubmit} className='flex flex-col mt-16 w-full form-group'>
                <FieldGroup>
                    <Field className='gap-2'>
                        <FieldLabel htmlFor="fieldgroup-username" className='form-field-label'>Email or Username</FieldLabel>
                        <Input
                            defaultValue={"alex92"}
                            id="fieldgroup-username"
                            type='text'
                            placeholder="Jordan Lee"
                            ref={usernameRef}
                        />
                    </Field>
                    <Field className='gap-2'>
                        <FieldLabel htmlFor="fieldgroup-pass" className='form-field-label'>Password</FieldLabel>
                        <Input
                            id="fieldgroup-pass"
                            type="password"
                            defaultValue="password123"
                            ref={passRef}
                        />
                    </Field>
                    {warning != "" && <div className='flex error-message' id="login-error">
                        <CircleAlert className="circle-alert-icon"/>
                        <span>{warning}</span>
                    </div>}
                    <Field orientation="horizontal">
                        <Button className='w-full btn-primary' type="submit" disabled={loginMutation.isPending}>Login</Button>
                    </Field>
                </FieldGroup>
            </form>
        </div>
    );
}
