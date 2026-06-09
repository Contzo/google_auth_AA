import { Backdrop } from "./components/layout/Backdrop";
import Main from "./components/layout/Main";
import SignInPanel from "./components/login/SignInPanel";

export default function LoginPage() {
  return (
    <Main>
      <Backdrop variant="login" />
      <SignInPanel />
    </Main>
  );
}
