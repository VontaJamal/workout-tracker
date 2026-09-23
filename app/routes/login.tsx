import { AuthShell } from "~/components/auth-shell";
import styles from "~/styles/workouts.css";
import type {
  ActionArgs,
  LoaderArgs,
  MetaFunction,
  LinksFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useNavigation,
} from "@remix-run/react";
import * as React from "react";

import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const remember = formData.get("remember");

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { email: null, password: "Password is required" } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { email: null, password: "Password is too short" } },
      { status: 400 }
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return json(
      { errors: { email: "Invalid email or password", password: null } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <AuthShell
      title="Welcome back."
      description="Sign in to see your training."
    >
      <Form method="post" className="auth-fields">
        <div>
          <label htmlFor="email" className="select-label">
            Email address
          </label>
          <div className="mt-1">
            <input
              ref={emailRef}
              id="email"
              required
              autoFocus={true}
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={actionData?.errors?.email ? true : undefined}
              aria-describedby="email-error"
              className="form-input"
            />
            {actionData?.errors?.email && (
              <div className="form-error" role="alert" id="email-error">
                {actionData.errors.email}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="select-label">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              ref={passwordRef}
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={actionData?.errors?.password ? true : undefined}
              aria-describedby="password-error"
              className="form-input"
            />
            {actionData?.errors?.password && (
              <div className="form-error" role="alert" id="password-error">
                {actionData.errors.password}
              </div>
            )}
          </div>
        </div>

        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button type="submit" className="primary auth-submit" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </button>
        <div className="auth-options">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="remember-checkbox"
            />
            <label htmlFor="remember" className="text-ink ml-2 block text-sm">
              Remember me
            </label>
          </div>
          <div className="text-muted text-center text-sm">
            Don't have an account?{" "}
            <Link
              className="auth-link"
              to={{
                pathname: "/join",
                search: searchParams.toString(),
              }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </Form>
    </AuthShell>
  );
}
