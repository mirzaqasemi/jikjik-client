import './login.css'
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as backend from '../../services/backend.ts';
import * as session from '../../services/session.ts';
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"


export default function Login() {
    const navigate = useNavigate();
    const [warning, setWarning] = useState("");
    const usernameRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const usernameInput = usernameRef.current;
        const passwordInput = passRef.current;
        if (!usernameInput || !passwordInput) {
            return;
        }
        let user = await backend.login(usernameInput.value, usernameInput.value);
        if (user != null) {
            session.setUser(user.username, user.displayName);
            navigate("/chats");
        } else {
            setWarning("This username is not found!");
        }
    }

    return (
        <div className='flex flex-col items-center justify-center h-full login-page'>
            <div className='flex items-center justify-center w-12 h-12 mb-6 text-white font-bold brand-logo'>C</div>
            <div className='login-header'>
                <h1 className='mb-1.5 text-center font-semibold tracking-tight text-5xl'>Welcome back</h1>
                <p className='mb-8 font-medium tracking-wider'>Enter your details to access your chats.</p>
            </div>

            {/* <form onSubmit={handleSubmit} className='flex flex-col mt-5' id='login-form'>
                <div className='flex flex-col input-group'>
                    <label>Email or Username</label>
                    <input defaultValue="alex92" id='username' ref={usernameRef} type="text" placeholder="e.g. alex@company.com" />
                </div>
                <div className='flex flex-col input-group'>
                    <label>Password</label>
                    <input name='password' ref={passRef} type="password" placeholder="••••••••" />
                </div> */}

            {/* Error Message Container */}
            {/* {
                    warning != "" &&
                    <div className='flex error-message' id="login-error">
                        <svg viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                        <span>{warning}</span>
                    </div>
                }
                <Button type='submit' className='btn-reset btn-primary'>Login</Button>
            </form> */}
            <form onSubmit={handleSubmit} className='flex flex-col mt-5 w-full form-group'>
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
                            placeholder="name@example.com"
                            ref={passRef}
                        />
                    </Field>
                    <Field orientation="horizontal">
                        <Button className='w-full btn-primary' type="submit">Login</Button>
                    </Field>
                </FieldGroup>
            </form>


        </div>
    );
}