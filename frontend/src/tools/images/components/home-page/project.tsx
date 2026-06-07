import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import LoadingIndicator from "../ui/loading-indicator";
import MainArea from "./main-area";

interface ProjectProps {
  isLoading?: boolean;
}

const Project = ({ isLoading }: ProjectProps) => {
  return (
    <div className="fixed left-0 top-0 w-screen h-screen bg-[#EBECF0]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <LoadingIndicator className="size-14" />
        </div>
      ) : (
        <>
          <Header />
          <Sidebar />
          <MainArea />
        </>
      )}
    </div>
  );
};

export default Project;
