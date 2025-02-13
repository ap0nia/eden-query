export function Note() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-2 text-gray-300 dark:text-gray-500">
        <div className="flex h-[1px] w-full grow bg-gray-300 dark:bg-gray-500" />
        <span className="icon-[mdi--heart-outline] h-8 w-8 shrink-0"></span>
        <div className="flex h-[1px] w-full grow bg-gray-300 dark:bg-gray-500" />
      </div>

      <h2 className="text-center leading-normal opacity-80">
        <span>The first production ready,</span>
        <br className="sm:none block" />
        <span>and most loved Bun framework</span>
      </h2>
    </div>
  )
}
