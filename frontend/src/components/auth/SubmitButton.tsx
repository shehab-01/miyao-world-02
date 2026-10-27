export default function SubmitButton({
  error,
  submitting,
  children,
}: {
  error: string;
  submitting: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-[40px] flex flex-col items-center gap-[14px]">
      {error && (
        <p role="alert" className="text-[12.5px] text-[#f0736b]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-[150px] bg-ink py-[11px] text-[13px] leading-none text-white hover:opacity-85 disabled:opacity-50"
      >
        {children}
      </button>
    </div>
  );
}
