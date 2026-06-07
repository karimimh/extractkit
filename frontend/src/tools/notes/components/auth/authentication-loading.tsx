import LoadingIndicator from "@notes/ui/loading-indicator";

const AuthenticationLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <LoadingIndicator className="h-12 w-12 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default AuthenticationLoading;
