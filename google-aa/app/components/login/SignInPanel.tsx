import Logo from "../ui/Logo";
import BrandDescription from "./BrandDescription";
import SigninCard from "./SigninCard";
import SigninFooter from "./SigninFooter";

export default function SignInPanel() {
  return (
    <div className="fade-up relative z-10 w-full max-w-100">
      <div className="flex flex-col items-center text-center">
        <Logo />
        <BrandDescription />
        <SigninCard />
        <SigninFooter />
      </div>
    </div>
  );
}
