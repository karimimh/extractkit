
import ExitProject from "./exit-project";
import Logo from "./logo";

const HeaderLeft = () => {
  return (
    <div className="flex flex-row items-center gap-2">
      <ExitProject />
      <Logo />
    </div>
  );
};

export default HeaderLeft;
