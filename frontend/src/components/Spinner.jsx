const Spinner = () => (
    <div className="flex flex-col justify-center items-center h-64 w-full gap-3">
        <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-0 rounded-full border-2 border-t-violet-600 dark:border-t-violet-500 animate-spin" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Loading...</p>
    </div>
);

export default Spinner;
