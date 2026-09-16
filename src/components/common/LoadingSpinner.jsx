function LoadingSpinner({
  label = "Loading..."
}) {

  return (
    <div className="flex flex-col items-center justify-center py-16">

      <div
        className="
          w-8 h-8
          border-2
          border-gray-700
          border-t-orange-500
          rounded-full
          animate-spin
        "
      />

      <p className="text-sm text-gray-500 mt-4">
        {label}
      </p>

    </div>
  );
}

export default LoadingSpinner;