import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel
} from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    Item,
    ItemContent,
    ItemMedia,
    ItemTitle
} from "@/components/ui/item";
import { CHATS_ROUTE } from "@/router.tsx";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, CircleAlert, EyeIcon, EyeOffIcon, LockKeyhole, MessageSquareMore, UserRound, Users } from "lucide-react";
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as backend from '../../services/backend.ts';
import './login.css';


export default function Login() {
    const navigate = useNavigate();
    const [warning, setWarning] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);

    const loginMutation = useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) => {
            return backend.login(username, password);
        },
        onSuccess: (user) => {
            if (user != null) {
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
            password: passwordInput.value,
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
        <div className='flex items-center justify-center h-full w-full xl:bg-secondary login-page-outer-container'>

            <div className="flex items-center justify-center w-full h-full xl:w-[90%] max-w-[1280px] xl:max-h-[600px] xl:rounded-4xl overflow-hidden login-page-inner-container">
                {/* DESKTOP VIEW - LEFT SIDE */}
                <div className="relative hidden xl:flex xl:flex-col xl:w-[52%] items-center h-full justify-center py-8 overflow-hidden login-left-side">
                    <div className='max-w-150 relative z-10 text-start'>
                        <h1 className="leading-none">Simple Chats.</h1>
                        <h1 className="mb-2.5">Real connections.</h1>
                        <span>Jik Jik makes it easy to stay in touch</span>
                        <span>with the people who matter.</span>
                        <div className="flex w-xl gap-4 mt-9 login-card">
                            <Item variant="outline" className="login-card-item">
                                <ItemMedia variant="icon">
                                    <MessageSquareMore />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>Fast messaging</ItemTitle>
                                </ItemContent>
                            </Item>
                            <Item variant="outline" className="login-card-item">
                                <ItemMedia variant="icon">
                                    <LockKeyhole />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>Private & Secure</ItemTitle>
                                </ItemContent>
                            </Item>
                            <Item variant="outline" className="login-card-item">
                                <ItemMedia variant="icon">
                                    <Users />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>Made for everyone</ItemTitle>
                                </ItemContent>
                            </Item>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className='flex w-full h-full xl:w-[48%] xl:bg-background overflow-auto login-right-side'>
                    <div className='flex flex-col items-center justify-center w-full m-auto p-7 sm:p-0 max-w-[420px] py-8'>
                        {/* LOGO */}
                        <div className='flex mb-10 items-center justify-center w-12 h-12 text-white font-bold brand-logo'>J</div>

                        {/* HEADER */}
                        <div className='login-header flex flex-col mb-8 gap-1 xl:gap-3.5'>
                            <h1 className='text-center font-bold tracking-tight'>Welcome back</h1>
                            <span className="login-header-description">Enter your details to access your chats.</span>
                        </div>

                        {/* LOGIN FORM */}
                        <form onSubmit={handleSubmit} className='flex flex-col mb-8 w-full'>
                            <FieldGroup className="flex flex-col gap-5">
                                <Field className='gap-2'>
                                    <FieldLabel htmlFor="fieldgroup-username" className='form-field-label'>Email or Username</FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon align="inline-start" className="pr-1.5">
                                            <UserRound />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            defaultValue={"diana"}
                                            id="fieldgroup-username"
                                            type='text'
                                            placeholder="Jordan Lee"
                                            ref={usernameRef}
                                        />
                                    </InputGroup>
                                </Field>
                                <Field className='gap-2'>
                                    <FieldLabel htmlFor="fieldgroup-pass" className='form-field-label'>Password</FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon align="inline-start" className="pr-1.5">
                                            <LockKeyhole />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            type={showPassword ? "text" : "password"}
                                            id="fieldgroup-pass"
                                            defaultValue="password123"
                                            ref={passRef}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ?
                                                    <EyeOffIcon className="size-4" /> :
                                                    <EyeIcon className="size-4" />
                                                }

                                            </button>
                                        </InputGroupAddon>
                                    </InputGroup>
                                </Field>
                                {warning != "" && <div className='flex error-message' id="login-error">
                                    <CircleAlert className="circle-alert-icon" />
                                    <span>{warning}</span>
                                </div>}
                                <Field orientation="horizontal">
                                    <Button className='w-full btn-primary' type="submit" disabled={loginMutation.isPending}>Login</Button>
                                </Field>
                            </FieldGroup>
                        </form>

                        <div className="flex flex-col w-full max-w-md  gap-2.5">
                            {/* DIVIDED LINE */}
                            <div className="flex w-full max-w-md items-center gap-4">
                                <div className="h-px flex-1 bg-border"></div>
                                <span className="text-xs text-muted-foreground">or</span>
                                <div className="h-px flex-1 bg-border"></div>
                            </div>

                            {/* SIGN UP SECTION */}
                            <div className="flex items-center justify-center">
                                <span className="text-muted-foreground">Don't have an account?</span>
                                <Button variant="link" className="text-chart-2 text-sm gap-1 hover:no-underline">
                                    Sign up
                                    <ChevronRight className="text-chart-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
