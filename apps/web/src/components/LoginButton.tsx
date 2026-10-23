import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router";

export default function LoginButton() {
  const { loginWithRedirect } = useAuth0();
  const location = useLocation();

  return (
    <button
      type="button"
      className="sign-in"
      onClick={() =>
        loginWithRedirect({
          appState: {
            returnTo: location.state?.from ?? '/',
          },
        })
      }
    >
      SIGN IN WITH AUTH0 →
    </button>
  );
}