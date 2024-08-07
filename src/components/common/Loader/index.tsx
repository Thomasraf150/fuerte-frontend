const Loader = () => {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-opacity-50 bg-black">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
};

export default Loader;
